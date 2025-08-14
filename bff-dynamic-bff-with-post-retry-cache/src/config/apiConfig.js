/**
 * Central registry of external APIs + endpoints.
 * Includes per-service defaults for retries, backoff, and circuit breaker.
 */
import config from './index.js';

const apiConfig = {
  salesforce: {
    baseURL: config.services.salesforce.baseURL,
    authHeader: () => `Bearer ${config.services.salesforce.token}`,
    // Resilience defaults
    resilience: {
      retries: 3,             // number of retry attempts for transient errors
      backoffMs: 300,         // base backoff in ms (exponential)
      breakerThreshold: 5,    // consecutive failures to open breaker
      breakerResetMs: 15000   // open -> half-open after this many ms
    },
    cache: {
      enabled: true,
      ttlMs: 5000             // cache GET responses for 5s (demo)
    },
    endpoints: {
      getAccount:   { method: 'GET',  path: (id) => `/sobjects/Account/${id}` },
      getContact:   { method: 'GET',  path: (id) => `/sobjects/Contact/${id}` },
      createAccount:{ method: 'POST', path: () => `/sobjects/Account` }
    }
  },
  // Add more providers similarly
};

export default apiConfig;
