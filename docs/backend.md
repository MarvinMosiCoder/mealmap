# Backend routes and authentication middleware

The API provides native email/password authentication, account preferences with calorie-goal history and private meal-log CRUD. It runs separately from Expo, using the package and environment file in `backend/`. See [setup.md](setup.md).

## Module responsibilities

| File under backend/ | Responsibility |
| --- | --- |
| `server.mjs` | Creates the pool/app and listens on all interfaces; PORT defaults to 3000 |
| `app.mjs` | Configures CORS and JSON, mounts routers, then registers error handling |
| `db.mjs` | Creates a pg pool with a five-second connection timeout and idle-pool error logging |
| `auth-middleware.mjs` | Parses Bearer tokens, hashes tokens and validates sessions |
| `routes/auth.routes.mjs` | Login, current-user and logout endpoints |
| `routes/health.routes.mjs` | Database connectivity endpoint |
| `routes/profile.routes.mjs` | Authenticated calorie goal/timezone reads, validation and transactional preference/history updates |
| `routes/meal-logs.routes.mjs` | Authenticated meal-log create/list/update/delete and shared POST/PUT validation |
| `routes/daily-summary.routes.mjs` | Authenticated selected-day totals and historical goal lookup using Profile timezone boundaries |
| `middleware/error-handler.mjs` | Invalid JSON, oversized bodies and generic server errors |
| `passwords.mjs` | Salted scrypt password hashing and timing-safe verification |
| `seed-user.mjs` | Creates a local test account |

`createApp({ pool })` is asynchronous because authentication setup derives a dummy password hash. JSON bodies are limited to 10 KB. CORS permits `WEB_ORIGIN`, defaulting to `http://localhost:8081`; it does not authenticate requests.

Dependencies are passed through factory arguments: `server.mjs` creates one pool and passes it to `createApp`, which creates `requireAuth` and supplies both to the Profile, meal-log and daily-summary router factories. They mount at `/profile`, `/meal-logs` and `/daily-summary` before the error handler. All three routers call `router.use(requireAuth)` before their private handlers. This is manual dependency injection; routers reuse the supplied pool and authentication middleware.

## Endpoint contracts

All paths below are relative to the configured API base URL.

| Method and path | Request | Response |
| --- | --- | --- |
| `GET /health` | No credentials | 200 `{ status: "ok", database: "connected" }`; 503 when the DB query fails |
| `POST /auth/login` | JSON `{ email, password }` | Token, expiry and user details; 400 invalid input, 401 wrong credentials, 429 throttled |
| `GET /auth/me` | Authorization Bearer token | 200 `{ user: { id, email, name, username } }`; 401 for invalid/expired sessions or a missing account |
| `POST /auth/logout` | Authorization Bearer token | 204 after deleting the matching token hash; 401 for a missing/malformed token |
| `GET /profile/preferences` | Authorization Bearer token | 200 `{ preferences: { dailyCalorieGoalKcal, timezone } }`; 401 for an invalid session or missing account |
| `PATCH /profile/preferences` | Bearer token and JSON with one or both preference fields | 200 with the saved preferences; 400 invalid input, 401 invalid session/missing account |
| `POST /meal-logs` | Bearer token and all five editable meal fields | 201 `{ mealLog }`; server sets owner and `source: manual` |
| `GET /meal-logs?limit=20&offset=0` | Bearer token; optional limit/offset | 200 `{ mealLogs, pagination: { limit, offset, hasMore } }` |
| `PUT /meal-logs/:id` | Bearer token and all five editable meal fields | 200 `{ mealLog }`; 404 for missing/unowned entries |
| `DELETE /meal-logs/:id` | Bearer token; no body needed | 204 empty response; 404 for missing/unowned entries |
| `GET /daily-summary?date=YYYY-MM-DD` | Bearer token and required real calendar date | 200 `{ summary }`; 400 invalid query, 401 invalid session/missing account, 409 unset timezone |

Login and current-user responses both include `id`, `email`, `name` and `username`. Middleware selects ID/email to authenticate the session; `/auth/me` then queries all four account fields with `WHERE id = $1` and `[req.user.id]`. It returns the first row under `user`, not pg query metadata. See [account fields](login.md#account-fields).

Database errors reach the Express error handler as 500 responses. Invalid JSON returns 400 and oversized JSON returns 413. SQL errors are not returned directly to the client. See [Express async error handling](https://expressjs.com/en/guide/error-handling/).

Preferences are separate from login/current-user JSON. The goal is `null` or a positive integer up to 2147483647; the timezone is `null` or a trimmed name of 1–255 characters found in `pg_catalog.pg_timezone_names`. PATCH rejects empty objects, unknown fields and invalid types. Omitted fields stay unchanged; explicit `null` clears a field. After validation, PATCH uses one checked-out client for a transaction: lock the account row with `SELECT ... FOR UPDATE`, update with `CASE`/`RETURNING`, insert an actual goal change into `public.calorie_goal_history`, then commit. Both writes use authenticated `req.user.id`; an error rolls back both. Unchanged goals and timezone-only saves add no history. Apply the history migration before using this handler. The JSON response is unchanged, and there is no mounted raw history-read endpoint. See [the complete contract](preferences.md) and [goal-history verification](preferences.md#goal-history-verification).

Meal POST/PUT require `mealName`, `mealCategory`, `servingQuantity`, `kcal` and `eatenAt`, and reject unknown fields. PUT replaces all five editable values. Kcal is the total for the logged portion, and `eatenAt` must use the exact UTC millisecond format produced by `Date.toISOString()`. List requests accept limit 1–100 (default 20) and offset 0–2147483647 (default 0), order by `eaten_at DESC, id DESC` and fetch an extra row for `hasMore`. IDs remain strings. See [meal-log validation, JSON examples and errors](meal-logs.md#api-contract).

The daily-summary query computes both local-midnight boundaries using the authenticated user's current saved timezone. One SQL statement sums owned entries in `[startsAt, endsAt)` and selects the last goal recorded before `endsAt`, ordered by effective timestamp then ID descending. Empty days have zero consumed calories and meals. Unset and unknown goals are distinguished by `goalStatus`, and both yield `null` remaining/over-goal values. Above-goal remaining calories stay negative. No totals are persisted. See [daily summaries](daily-summary.md).

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

Use parameterized SQL and authenticated `req.user.id` when selecting or modifying user-owned rows. Meal creation takes its owner from the session; listing filters by `user_id`, and PUT/DELETE match both the entry ID and owner in the mutation itself. Summary meals and goal history are scoped to the account selected by `req.user.id`. Never accept a client-supplied user ID as the sole ownership check. There is no role/permission model.

## Run and verify

From `backend/`, run `npm run dev`. Check `/health` from a separate terminal, then follow the [login checklist](login.md#manual-verification), [preferences API checks](preferences.md#api-verification) and [meal-log API checks](meal-logs.md#api-verification). [Backend syntax checks](troubleshooting.md#verification-commands) validate parsing but do not prove SQL or authentication behavior.
