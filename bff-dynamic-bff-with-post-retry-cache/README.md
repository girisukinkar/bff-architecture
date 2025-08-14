# Dynamic Express + GraphQL BFF for Salesforce

A production-ready, **config-driven** Backend‑for‑Frontend (BFF) that consumes **Salesforce REST APIs** via **Axios** and exposes a **GraphQL** interface. Built for **zero copy‑paste** growth: add endpoints and even whole providers from a **single config**.

---

## ✨ Highlights

- **Dynamic GraphQL modules:** drop a folder in `src/modules/*`, the server autoloads schema + resolvers.
- **Config‑driven HTTP calls:** change base URLs, tokens, and endpoints in one file: `src/config/apiConfig.js`.
- **Auto‑generated API wrappers:** use `API.salesforce.getAccount(...)` — no error‑prone strings.
- **Structured logging:** JSON logs with timestamps; includes per‑request `traceId`.
- **Clean separation:** schema ↔ resolvers ↔ transformers ↔ HTTP caller.

---

## 🧰 Tech

- Express, Apollo Server (GraphQL)
- Axios with interceptors
- Winston logger
- dotenv, uuid

---

## 🚀 Quick Start

1) **Clone & install**
```bash
npm install
```

2) **Configure env**
Create `.env` (see `.env` in repo):
```env
PORT=4000
LOG_LEVEL=info
SF_BASE_URL=https://your-instance.my.salesforce.com/services/data/v60.0
SF_TOKEN=REPLACE_WITH_OAUTH_BEARER_TOKEN
```

3) **Run**
```bash
npm run dev
# or
npm start
```

Open GraphQL Playground at: `http://localhost:4000/graphql`

---

## 🧪 Try a Query

```graphql
query Example {
  account(id: "001xx000003DGbUAAW") {
    id
    name
    industry
  }
}
```

> The resolver calls Salesforce: `GET /sobjects/Account/{id}` and maps fields via `transform.js`.

---

## 🧱 Project Layout

```
src/
  config/
    index.js         # loads env
    logger.js        # winston logger
    axiosClient.js   # global axios + logs
    apiKeys.js       # central constants
    apiConfig.js     # baseURL, auth, endpoints
  graphql/
    loader.js        # autoload modules
    server.js        # Apollo server factory
  modules/
    salesforce/
      schema.graphql
      resolvers.js
      transform.js
  utils/
    traceId.js
    apiCaller.js     # generic HTTP
    apiFactory.js    # auto wrappers
  app.js             # express bootstrap
```

---

## 🧩 How “Config‑Driven” Works

- `apiConfig.js` holds **everything** about an external service:
  - `baseURL`, `authHeader()`
  - `endpoints`: `{ method, path: (...args) => string }`

- `apiCaller.callAPI(service, endpoint, args, options, traceId)` reads that config and executes the request.

- `apiFactory.createAPIWrappers()` generates functions like `API.salesforce.getAccount()` so you don’t pass strings.

**Add a new endpoint (example):**
```js
// src/config/apiConfig.js
salesforce: {
  // ...
  endpoints: {
    getAccount: { method: 'GET', path: (id) => `/sobjects/Account/${id}` },
    searchAccounts: { method: 'GET', path: () => `/parameterizedSearch` } // NEW
  }
}
```
Use it in a resolver:
```js
const data = await API.salesforce.searchAccounts([], { params: { q: 'Acme' } }, traceId);
```

---

## ➕ Add a New Provider (e.g., HubSpot)

1) Add service to `apiConfig.js` with `baseURL`, `authHeader`, and `endpoints`.
2) Create a module folder: `src/modules/hubspot/` with `schema.graphql`, `resolvers.js`, `transform.js`.
3) The loader picks it up automatically.

---

## 🛡️ Errors, Logging, and Trace IDs

- Every request gets a `traceId` (UUID) injected into logs & outbound headers (`x-trace-id`).
- Axios interceptors log outbound requests and responses (status, URL, traceId).
- Non‑2xx responses throw; errors are logged and surfaced to GraphQL as safe messages.

---

## 🏭 Production Tips

- Rotate OAuth tokens securely (don’t commit `.env`).
- Add retries/circuit‑breaker (e.g., p-retry, opossum) in `apiCaller` if needed.
- Add caching (e.g., Redis) per endpoint if your use‑case benefits.
- Add rate limiting (express-rate-limit) and input validation (zod/yup) at the resolver boundary.

---

## 📜 License

MIT


---

## 🧪 New: Mutation Example (POST)

```graphql
mutation MakeAccount {
  createAccount(input: { Name: "Acme Corp", Industry: "Manufacturing" }) {
    id
    success
  }
}
```

The resolver calls:
- `API.salesforce.createAccount([], { data: input }, traceId)`

Salesforce responds with `{ id, success, errors }` on success/failure.

---

## 🧱 Resilience Built-in

- **Retries:** transient network/5xx errors are retried with exponential backoff (default: 3 attempts).
- **Circuit Breaker:** after repeated failures (default threshold: 5), the service opens for `15s`, then half‑opens.
- **Caching:** GET calls can be cached in‑memory with TTL (default 5s for demo). Tune or replace with Redis in prod.

Configure per service in `src/config/apiConfig.js`:
```js
resilience: { retries: 3, backoffMs: 300, breakerThreshold: 5, breakerResetMs: 15000 },
cache: { enabled: true, ttlMs: 5000 }
```

---

## ✅ Input Validation (Optional)

Consider adding schema-level validation (e.g., **zod**) in resolvers before calling providers.

---

## 🔁 TypeScript (Optional)

To get compile-time safety, add TS later:
- `npm i -D typescript ts-node @types/node`
- Create `tsconfig.json`
- Rename files to `.ts` and type `apiConfig` + wrappers.
This repo keeps JS for approachability.

