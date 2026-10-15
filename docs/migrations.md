# Database migrations and seeding

The backend uses PostgreSQL and `node-pg-migrate` 9. Commands below run inside `backend/` and load its `.env`. See [setup.md](setup.md) for connection settings.

## Current schema

| Table | Migration | Important fields |
| --- | --- | --- |
| `public.users` | `1791517085689_create-users.sql` | Identity bigint `id`, required `name`, `username`, `email`, `password_hash`, and creation timestamp |
| `public.sessions` | `1791522946123_create-sessions.sql` | Token hash primary key, user foreign key, expiry and creation timestamps |
| `public.pgmigrations` | Maintained by the migration tool | Applied migration history |

Email has a unique index on `LOWER(email)`. The current schema does not make usernames unique. Deleting a user cascades to their sessions. Session lookup uses the token hash; user and expiry indexes support session cleanup.

## Apply and inspect

```powershell
npm run migrate -- up
```

Run these read-only queries in pgAdmin on the same database:

```sql
SELECT current_database(), current_user;
SELECT name, run_on FROM public.pgmigrations ORDER BY run_on;
SELECT id, name, username, email FROM public.users;
SELECT user_id, created_at, expires_at FROM public.sessions;
```

Migrations create tables, not accounts. Empty users are expected before seeding; empty sessions are expected before login. See [create a test account](login.md#create-a-test-account). Refresh the database viewer after inserts.

If a seed succeeds but rows seem missing, compare `current_database()` and the connection host/port in your viewer with the runtime `PG*` settings. Avoid displaying passwords or token hashes while debugging.

## Add a schema change

Create a new migration rather than editing the history of a database that already applied the existing file:

```powershell
npm run migrate -- create describe-your-change --migration-file-language sql
```

Edit the generated file's `-- Up Migration` and `-- Down Migration` sections, review both, then apply `up`. Merely editing an applied file does not make the migration run again. Keep schema changes with the code that uses them. The installed CLI options are documented in the [version 9 reference](https://github.com/salsita/node-pg-migrate/blob/v9.0.0/docs/src/cli.md).

## Rollback behavior

`npm run migrate -- down` reverses the latest migration. With the two current migrations applied, this drops `sessions` and invalidates saved logins. Reversing the users migration drops accounts. Reapplying a migration recreates its schema without restoring deleted data. Inspect the SQL and back up needed data before intentionally rolling back.

## Common errors

| Symptom | Check |
| --- | --- |
| Missing `.env` | Run in `backend/` and configure that file |
| Connection refused/authentication failed | PostgreSQL service, port, role and password |
| Relation does not exist | Correct database and pending migrations |
| Required name/username is null | Seed must insert all required fields; current seed does |
| No pending migrations | Schema is already applied; run the seed separately to create an account |
| Seed account already exists | Existing password is unchanged |
