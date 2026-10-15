# Backend routes and authentication middleware

The API is connected to native email/password authentication. It runs separately from Expo, using the package and environment file in `backend/`. See [setup.md](setup.md).

## Module responsibilities

| File under backend/ | Responsibility |
| --- | --- |
| `server.mjs` | Creates the pool/app and listens on all interfaces; PORT defaults to 3000 |
| `app.mjs` | Configures CORS and JSON, mounts routers, then registers error handling |
| `db.mjs` | Creates a pg pool with a five-second connection timeout and idle-pool error logging |
| `auth-middleware.mjs` | Parses Bearer tokens, hashes tokens and validates sessions |
| `routes/auth.routes.mjs` | Login, current-user and logout endpoints |
| `routes/health.routes.mjs` | Database connectivity endpoint |
| `middleware/error-handler.mjs` | Invalid JSON, oversized bodies and generic server errors |
| `passwords.mjs` | Salted scrypt password hashing and timing-safe verification |
| `seed-user.mjs` | Creates a local test account |

`createApp({ pool })` is asynchronous because authentication setup derives a dummy password hash. JSON bodies are limited to 10 KB. CORS permits `WEB_ORIGIN`, defaulting to `http://localhost:8081`; it does not authenticate requests.

## Endpoint contracts

All paths below are relative to the configured API base URL.

| Method and path | Request | Response |
| --- | --- | --- |
| `GET /health` | No credentials | 200 `{ status: "ok", database: "connected" }`; 503 when the DB query fails |
| `POST /auth/login` | JSON `{ email, password }` | Token, expiry and user details; 400 invalid input, 401 wrong credentials, 429 throttled |
| `GET /auth/me` | Authorization Bearer token | 200 `{ user: { id, email, name, username } }`; 401 for invalid/expired sessions or a missing account |
| `POST /auth/logout` | Authorization Bearer token | 204 after deleting the matching token hash; 401 for a missing/malformed token |

Login and current-user responses both include `id`, `email`, `name` and `username`. Middleware selects ID/email to authenticate the session; `/auth/me` then queries all four account fields with `WHERE id = $1` and `[req.user.id]`. It returns the first row under `user`, not pg query metadata. See [account fields](login.md#account-fields).

Database errors reach the Express error handler as 500 responses. Invalid JSON returns 400 and oversized JSON returns 413. SQL errors are not returned directly to the client. See [Express async error handling](https://expressjs.com/en/guide/error-handling/).

## Sessions and middleware

Login creates a random 32-byte token encoded as 64 hexadecimal characters, with a seven-day expiry. The device stores the raw token in native SecureStore. PostgreSQL stores its SHA-256 hash. Passwords use the separate salted `scrypt-v1` format.

`requireAuth` reads `Authorization: Bearer <token>`, checks its format, hashes it and joins sessions to users. The query requires `expires_at > NOW()`. A valid match becomes `req.user`; its identifier is `req.user.id`. Missing, revoked, unknown or expired sessions receive 401. Protected responses set `Cache-Control: no-store`.

The login limit is five unsuccessful requests per IP within fifteen minutes, with successful requests skipped. It uses the limiter's default in-memory store. Login removes that user's expired sessions; logout deletes the supplied session hash. A well-formed already-absent logout token still returns 204.

## Add private feature endpoints

Mount a future private feature router with authentication before its handlers:

```js
app.use("/example", requireAuth, exampleRouter);
```

This is an extension pattern; `/example` does not currently exist. Put registration after JSON middleware and before `app.use(errorHandler)`. Alternatively, apply `requireAuth` to individual handlers in a mixed-access router, as `/auth/me` does.

Use parameterized SQL and authenticated `req.user.id` when selecting or modifying user-owned rows. Never accept a client-supplied user ID as the sole ownership check. There is no role/permission model or meal-data API yet.

## Run and verify

From `backend/`, run `npm run dev`. Check `/health` from a separate terminal, then follow the [login checklist](login.md#manual-verification). [Backend syntax checks](troubleshooting.md#verification-commands) validate parsing but do not prove SQL or authentication behavior.
