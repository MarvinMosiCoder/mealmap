# Database migrations and seeding

The backend uses PostgreSQL and `node-pg-migrate` 9. Commands below run inside `backend/` and load its `.env`. See [setup.md](setup.md) for connection settings.

## Current schema

| Table | Migration | Important fields |
| --- | --- | --- |
| `public.users` | `1791517085689_create-users.sql` | Identity bigint `id`, required `name`, `username`, `email`, `password_hash`, and creation timestamp |
| `public.sessions` | `1791522946123_create-sessions.sql` | Token hash primary key, user foreign key, expiry and creation timestamps |
| `public.users` preferences | `1792461599770_add-user-preferences.sql` | Nullable `daily_calorie_goal_kcal INTEGER` and `timezone TEXT`; positive-goal CHECK constraint |
| `public.meal_logs` | `1792473191029_create-meal-logs.sql` | User foreign key, meal name/category, positive serving quantity, nonnegative total kcal, source and eaten-at/audit timestamps |
| `public.pgmigrations` | Maintained by the migration tool | Applied migration history |

Email has a unique index on `LOWER(email)`. The current schema does not make usernames unique. Deleting a user cascades to their sessions and meal logs. Session lookup uses the token hash; user and expiry indexes support session cleanup.

The preferences migration alters the existing users table. Both new columns default to `NULL`; the goal constraint allows `NULL` or a value greater than zero. PostgreSQL's integer type supplies the upper storage limit. Timezone names are validated by the API against `pg_catalog.pg_timezone_names` rather than by a database constraint. See [preferences](preferences.md#storage-and-authentication).

The meal-log migration creates an identity BIGINT primary key and required columns. Serving quantity is `NUMERIC(10,3)` with positive/non-NaN checks, kcal is a nonnegative INTEGER, and category/source have allowed-value checks. `eaten_at` is a finite TIMESTAMPTZ; `created_at` and `updated_at` default to NOW(). The `(user_id, eaten_at DESC)` index supports owned history queries. The API additionally validates quantity precision, names and UTC input formatting, and explicitly updates `updated_at` on PUT. See [meal-log storage](meal-logs.md#storage-and-calorie-meaning).

## Apply and inspect

```powershell
npm run migrate -- up
```

Run these read-only queries in pgAdmin on the same database:

```sql
SELECT current_database(), current_user;
SELECT name, run_on FROM public.pgmigrations ORDER BY run_on;
SELECT id, name, username, email FROM public.users;
SELECT id, daily_calorie_goal_kcal, timezone FROM public.users;
SELECT user_id, created_at, expires_at FROM public.sessions;
SELECT id, user_id, meal_name, serving_quantity, kcal, source, eaten_at
FROM public.meal_logs
ORDER BY eaten_at DESC, id DESC
LIMIT 20;
```

Migrations create schema, not accounts or meals. Empty users are expected before seeding; empty sessions are expected before login; meal logs stay empty until entries are created. See [create a test account](login.md#create-a-test-account). Refresh the database viewer after inserts. These administrator queries span accounts; private API queries must enforce ownership separately.

If a seed succeeds but rows seem missing, compare `current_database()` and the connection host/port in your viewer with the runtime `PG*` settings. Avoid displaying passwords or token hashes while debugging.

## Add a schema change

Create a new migration rather than editing the history of a database that already applied the existing file:

```powershell
npm run migrate -- create describe-your-change --migration-file-language sql
```

Edit the generated file's `-- Up Migration` and `-- Down Migration` sections, review both, then apply `up`. Merely editing an applied file does not make the migration run again. Keep schema changes with the code that uses them. The installed CLI options are documented in the [version 9 reference](https://github.com/salsita/node-pg-migrate/blob/v9.0.0/docs/src/cli.md).

## Rollback behavior

`npm run migrate -- down` reverses the latest migration. With all four current migrations applied, the first down drops `public.meal_logs` and permanently removes its entries and index. The next down removes the preference columns/constraint and saved goals/timezones. Further rollback drops sessions, then users. Reapplying a migration recreates its schema without restoring deleted data. Inspect the SQL and back up needed data before intentionally rolling back.

## Migration recorded but columns missing

Save the Up SQL before first applying a migration. A generated empty migration can be recorded as applied; adding SQL afterward does not rerun it.

First compare database identity and migration history, then inspect the actual schema:

```sql
SELECT current_database(), current_user;
SELECT name, run_on FROM public.pgmigrations ORDER BY run_on DESC, id DESC;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;
```

For the specific local-development case where `1792461599770_add-user-preferences` is the latest applied migration and none of its schema changes exist, first save its correct SQL, then run these commands separately from `backend/`. This is not the normal current state: when the meal-log migration is latest, these commands would target that migration instead and do not repair preferences.

```powershell
npm run migrate -- down 1 --fake
npm run migrate -- up
```

The fake down removes only that migration's history record and skips its Down SQL; up then executes the saved Up SQL. This recovery applies to the verified empty-migration case. A partially applied migration or shared database needs a repair based on its actual schema, usually a new corrective migration. Refresh pgAdmin's Columns list after verifying the SQL query succeeds.

## Common errors

| Symptom | Check |
| --- | --- |
| Missing `.env` | Run in `backend/` and configure that file |
| Connection refused/authentication failed | PostgreSQL service, port, role and password |
| Relation does not exist | Correct database and pending migrations |
| Required name/username is null | Seed must insert all required fields; current seed does |
| No pending migrations | Schema is already applied; run the seed separately to create an account |
| Preferences migration is recorded but columns are absent | Follow [schema/history diagnosis](#migration-recorded-but-columns-missing); rerunning up alone will not rerun an applied file |
| Seed account already exists | Existing password is unchanged |
