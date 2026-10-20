# MealMap

Expo SDK 55 / React Native meal-tracking and planning application with NativeWind styling, an Express 5 API and PostgreSQL persistence. Documentation reflects the source reviewed on October 20, 2026.

## Documentation

| Guide | Covers |
| --- | --- |
| [Product roadmap and checklist](TODO.md) | Daily calories, photo logging, recipe generation and implementation milestones |
| [Setup and daily development](docs/setup.md) | Dependencies, local database, environment files and both servers |
| [Mobile screens and styling](docs/mobile-ui.md) | Home, categories, Login, Profile, meal forms/history, floating tabs and theme |
| [Login and saved sessions](docs/login.md) | Test accounts, account fields, startup loading/retry, token storage and logout |
| [Profile preferences](docs/preferences.md) | Calorie goal and timezone storage, authenticated GET/PATCH, Profile loading/Save and verification |
| [Manual meal logs](docs/meal-logs.md) | Schema, authenticated CRUD, Add meal, native date/time selection, paginated history and verification |
| [Navigation guards](docs/navigation.md) | Public routes, private tabs/Add meal, category links and login/logout destinations |
| [Backend architecture](docs/backend.md) | Module responsibilities, endpoint contracts and private APIs |
| [Database migrations](docs/migrations.md) | Schema, migration history, seeding and rollback behavior |
| [Android emulator](docs/android-emulator.md) | Starting the device, API addresses and connection recovery |
| [Git workflow](docs/git.md) | Reviewing changes, commits, remotes and conflicts |
| [Troubleshooting and verification](docs/troubleshooting.md) | Common failures, known limitations and checks |
| [Template and artwork notes](docs/template.md) | Original assets and extension points |

## Start development

Complete [first-time setup](docs/setup.md#first-time-setup), configure both environment files, apply migrations and seed a test account first.

At the project root:

```powershell
npx expo start
```

In another terminal:

```powershell
cd backend
npm run dev
```

For the Android emulator, root `.env.local` uses `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000`. Test the API from Windows with `http://localhost:3000/health`. Database credentials belong in `backend/.env`.

## Current behavior

Home at `/` is public and hides the tab bar for guests. Guests can browse Breakfast, Lunch, Dinner and Snacks through `/meal-category/[category]`. Email/password login updates AuthProvider and opens Home; authenticated users can open Meals, Plan, Groceries and Profile. Profile shows account information, calorie goal/timezone preferences, kitchen shortcuts and logout. Successful logout explicitly opens `/login`.

Profile loads preferences through authenticated `GET /profile/preferences` and saves them with PATCH. Both values start unset; a blank goal or the timezone picker's Not set option clears the corresponding value. The form includes loading/retry, validation, save feedback and a logout lock while saving. Preferences are stored on the authenticated user's row in PostgreSQL; see [Profile preferences](docs/preferences.md).

Meals displays the signed-in user's persisted meal logs, with focus/pull-to-refresh, loading/empty/error states and Load more pagination. Meals > Add meal opens the protected `/add-meal` screen for name, category, servings, total kcal and date/time. Successful Save locks that form; use Back to return to the refreshed list. Entry/display times use the device timezone and the API receives UTC. The backend supports POST/GET/PUT/DELETE with ownership checks; mobile edit/delete actions remain pending. Apply all migrations, including `1792473191029_create-meal-logs.sql`. See [manual meal logs](docs/meal-logs.md).

Startup keeps the splash visible while fonts load, then shows a session-check spinner. A failed initial session check displays the error and a Try again button. The tab bar overlays authenticated screens with a transparent upper area around the raised Home button; Home, Profile and meal history include bottom scroll padding.

Home's calorie ring, macros, today's meals and category ideas remain sample data. A daily-summary API, goal history and Home integration are not implemented, so logging a meal does not change Home's displayed calories. Plan and Groceries remain placeholders. Registration, provider login, password reset, editing account identity fields and browser session storage are not implemented.

Both `/auth/login` and `/auth/me` return `id`, `email`, `name` and `username`. The current-user route uses the authenticated ID to query the full account details, so restoring a session retains the profile name. See the [account response contract](docs/login.md#account-fields) and [known limitations](docs/troubleshooting.md#known-limitations).

## Checks

Run from the project root:

```powershell
npx expo lint
npx tsc --noEmit
```

Also run the [backend syntax checks](docs/troubleshooting.md#verification-commands). These checks do not validate SQL execution or device behavior; use the [manual login checklist](docs/login.md#manual-verification), [preferences verification](docs/preferences.md#device-verification) and [meal-log checks](docs/meal-logs.md#device-verification).

Use `npx expo install <package>` for mobile dependencies. Read [AGENTS.md](AGENTS.md) and the [SDK 55 docs](https://docs.expo.dev/versions/v55.0.0/) before changing Expo APIs.
