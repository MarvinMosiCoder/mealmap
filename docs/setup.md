# Setup and daily development

MealMap has two npm packages: the Expo application at the project root and the Express API in `backend/`. This guide reflects the source reviewed on October 20, 2026. Start with the [documentation index](../README.md) for other topics.

## Prerequisites

- Node.js and npm. The development machine uses Node 24.15.0 and npm 11.12.1.
- PostgreSQL, with pgAdmin or psql for database administration.
- Android Studio with a working emulator, or a compatible Expo client on a physical device.

The app uses Expo SDK 55, React Native 0.83 and React 19.2. Consult the [SDK 55 reference](https://docs.expo.dev/versions/v55.0.0/) before changing native APIs.

## First-time setup

Open PowerShell at the project root:

```powershell
cd 'C:\Users\Digits-User\Desktop\mealmap'
npm ci
```

Install the API dependencies in a second terminal:

```powershell
cd 'C:\Users\Digits-User\Desktop\mealmap\backend'
npm ci
```

Both packages have their own `package-lock.json`. Install new mobile packages with `npx expo install <package>` at the root. Server dependencies belong in `backend/`.

The root lockfile includes `@react-native-picker/picker` 2.11.4 for category/timezone selection and `@react-native-community/datetimepicker` 8.6.0 for Android/iOS meal date/time selection. `npm ci` installs them; there is no separate feature-install step for this checkout. The datetimepicker plugin is registered in `app.json`. Both modules are bundled in compatible Expo Go; rebuild custom development clients after native dependency/configuration changes. See [SDK 55 Picker](https://docs.expo.dev/versions/v55.0.0/sdk/picker/) and [DateTimePicker](https://docs.expo.dev/versions/v55.0.0/sdk/date-time-picker/).

## Database and server environment

For a new local PostgreSQL installation, create the application role in pgAdmin Query Tool as an administrator:

```sql
CREATE ROLE mealmap_app WITH LOGIN PASSWORD 'replace_with_your_own_password';
```

Run this separately with auto-commit enabled:

```sql
CREATE DATABASE mealmap OWNER mealmap_app;
```

Skip creation if the database and role already exist. `CREATE DATABASE` cannot run inside a transaction; see the [PostgreSQL reference](https://www.postgresql.org/docs/current/sql-createdatabase.html).

Create `backend/.env` with your local values:

```dotenv
PORT=3000
PGHOST=localhost
PGPORT=5432
PGDATABASE=mealmap
PGUSER=mealmap_app
PGPASSWORD="replace_with_your_own_password"
WEB_ORIGIN=http://localhost:8081
```

Runtime and seed pools use the `PG*` variables. The migration CLI also accepts `DATABASE_URL`; if supplied, it must target the same database. See [node-postgres connection settings](https://node-postgres.com/features/connecting).

## Mobile environment and API addresses

Create `.env.local` beside the root `package.json`:

```dotenv
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

| Client | API address for the default port |
| --- | --- |
| Windows terminal or browser | `http://localhost:3000` |
| Android Studio emulator | `http://10.0.2.2:3000` |
| Physical phone | `http://<computer-LAN-IPv4>:3000` on the same network |

`10.0.2.2` reaches the host computer from the Android emulator. See [Android network addresses](https://developer.android.com/studio/run/emulator-networking-address). A physical phone also needs network/firewall access to the API.

Expo loads public variables from root environment files; reload the app after changing them. `backend/.env` configures the server, not the mobile bundle. Keep database passwords out of public variables. See [Expo environment variables](https://docs.expo.dev/guides/environment-variables/). Both `backend/.env` and `.env.local` are ignored by Git.

## Migrate, seed and start

From `backend/`:

```powershell
npm run migrate -- up
```

The four current migrations create users and sessions, add nullable calorie goal/timezone columns, then create `public.meal_logs`. Existing installations need to apply both `1792461599770_add-user-preferences.sql` and `1792473191029_create-meal-logs.sql` if pending. New accounts have no assigned goal or timezone, and migrations do not create meals. See [migration history](migrations.md#current-schema).

Create a test account using [the seed instructions](login.md#create-a-test-account), then start the API:

```powershell
npm run dev
```

From another terminal, check connectivity:

```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/health'
```

Expected fields are `status: ok` and `database: connected`. Health checks connectivity, not user creation.

At the project root:

```powershell
npx expo start
```

Press `a` after the emulator finishes booting. Keep both servers running. Daily development only needs these two startup commands after initial setup; apply new migrations when they are added.

After signing in, open Profile to load and save a goal and timezone, then Meals > Add meal to log a portion and its total kcal. Save shows confirmation on the form; use Back to return to the refreshed history. Follow [preferences verification](preferences.md#device-verification) and [meal-log verification](meal-logs.md#device-verification) for persistence, errors, native pickers and keyboard behavior. Home's nutrition summary is still sample data.

## Checks

Run the [verification commands](troubleshooting.md#verification-commands) before finishing changes. For styling configuration changes, stop Expo and restart with `npx expo start --clear`.
