# Optional backend reference

`backend/` retains the existing Express 5/PostgreSQL authentication service. The Meal Map dashboard, tabs, and login template do not call it; the UI can be developed without running this service. The login form currently performs local validation and opens Home.

## Setup

Configure PostgreSQL and create `backend/.env` with the database settings described below. Then run from `backend/`:

```sh
npm ci
npm run migrate -- up
npm run dev
```

Both scripts read `backend/.env`. The runtime creates `new pg.Pool()` without a connection string, using PostgreSQL settings such as `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD`. The migration CLI also accepts `DATABASE_URL`; ensure migration and runtime settings target the same database. A `DATABASE_URL` alone is not explicitly passed to the application's pool.

`PORT` defaults to `3000`; the server listens on all network interfaces. `WEB_ORIGIN` controls CORS and defaults to `http://localhost:8081`. Keep real environment values out of source control and documentation.

## Endpoints

| Method and path | Behavior |
| --- | --- |
| `GET /health` | Checks the database connection; returns 200 or 503 |
| `POST /auth/login` | Accepts JSON email/password; returns token, expiry, and user |
| `GET /auth/me` | Returns the user for a valid bearer token |
| `POST /auth/logout` | Deletes the supplied token's session and returns 204 |

Send `Authorization: Bearer <token>`. Sessions expire after seven days. The database stores SHA-256 token hashes and scrypt password hashes. Failed logins are limited to five per 15-minute window; successful attempts do not count. No signup or meal API is implemented.

## Existing limitation

Migrations create `public.users` and `public.sessions`. Users require `name`, `username`, `email`, and `password_hash`. `seed-user.mjs` inserts only email and password hash, so it fails against this schema. Update the seed or implement account creation before testing login. Its password check also accepts eight characters while its error message says fifteen.

The existing backend has not been connected to or validated as part of this UI template.
