/**
 * Generic API caller with:
 * - config-driven endpoints
 * - in-memory GET cache (TTL)
 * - retries with exponential backoff
 * - simple circuit breaker per service
 */
import client from '../config/axiosClient.js';
import apiConfig from '../config/apiConfig.js';

// --- Simple per-service circuit breaker state ---
const breakers = {}; // { serviceName: { state, failures, openedAt } }
const CLOSED = 'CLOSED', OPEN = 'OPEN', HALF = 'HALF_OPEN';

// --- Tiny in-memory cache for GETs ---
const cacheStore = new Map(); // key -> { expiresAt, data }
function cacheKey(serviceName, endpointKey, args, params) {
  return JSON.stringify([serviceName, endpointKey, args, params || null]);
}

function now() { return Date.now(); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function getBreaker(serviceName) {
  if (!breakers[serviceName]) {
    breakers[serviceName] = { state: CLOSED, failures: 0, openedAt: 0 };
  }
  return breakers[serviceName];
}

function canPass(breaker, resilience) {
  if (breaker.state === CLOSED) return true;
  if (breaker.state === OPEN) {
    if (now() - breaker.openedAt >= resilience.breakerResetMs) {
      breaker.state = HALF;
      return true; // allow a probe
    }
    return false;
  }
  // HALF_OPEN: allow a single trial; we'll update after call outcome
  return true;
}

function onSuccess(breaker) {
  breaker.failures = 0;
  breaker.state = CLOSED;
  breaker.openedAt = 0;
}

function onFailure(breaker, resilience) {
  breaker.failures += 1;
  if (breaker.failures >= resilience.breakerThreshold) {
    breaker.state = OPEN;
    breaker.openedAt = now();
  }
}

export async function callAPI(serviceName, endpointKey, args = [], options = {}, traceId) {
  const service = apiConfig[serviceName];
  if (!service) throw new Error(`Unknown API service: ${serviceName}`);
  const endpoint = service.endpoints[endpointKey];
  if (!endpoint) throw new Error(`Unknown endpoint: ${endpointKey}`);

  const resilience = Object.assign({
    retries: 0, backoffMs: 200, breakerThreshold: 5, breakerResetMs: 15000
  }, service.resilience || {});

  const url = endpoint.path(...args);
  const cfg = {
    method: endpoint.method,
    baseURL: service.baseURL,
    url,
    headers: {
      Authorization: service.authHeader(),
      'x-trace-id': traceId,
      ...(options.headers || {})
    },
    params: options.params || undefined,
    data: options.data || undefined,
    validateStatus: (s) => s >= 200 && s < 300
  };

  const breaker = getBreaker(serviceName);
  if (!canPass(breaker, resilience)) {
    const err = new Error(`Circuit breaker OPEN for service ${serviceName}`);
    err.code = 'CIRCUIT_OPEN';
    throw err;
  }

  // Cache only GET requests
  const shouldCache = service.cache?.enabled && cfg.method?.toUpperCase() === 'GET';
  const ttlMs = service.cache?.ttlMs || 0;
  const ck = shouldCache ? cacheKey(serviceName, endpointKey, args, options.params) : null;

  if (shouldCache && ck && cacheStore.has(ck)) {
    const entry = cacheStore.get(ck);
    if (entry.expiresAt > now()) {
      return entry.data;
    } else {
      cacheStore.delete(ck);
    }
  }

  let attempt = 0;
  const maxAttempts = 1 + (resilience.retries || 0);

  while (attempt < maxAttempts) {
    try {
      const res = await client(cfg);
      onSuccess(breaker);
      if (shouldCache && ck) {
        cacheStore.set(ck, { expiresAt: now() + ttlMs, data: res.data });
      }
      return res.data;
    } catch (err) {
      attempt += 1;
      onFailure(breaker, resilience);

      const status = err.response?.status;
      const isTransient =
        err.code === 'ECONNRESET' ||
        err.code === 'ETIMEDOUT' ||
        (status && status >= 500);

      if (attempt >= maxAttempts || !isTransient) {
        throw err;
      }

      const wait = (resilience.backoffMs || 200) * Math.pow(2, attempt - 1);
      await sleep(wait);
    } finally {
      // If we were HALF_OPEN, close on success or reopen on failure handled above
      // (already covered by onSuccess/onFailure)
    }
  }
}
