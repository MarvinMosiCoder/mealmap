# Troubleshooting and verification

Commands use PowerShell. Expo commands run at the project root; API and migration scripts run in `backend/`. See [setup.md](setup.md) for the full startup sequence.

## Login and account details

| Symptom | What to check |
| --- | --- |
| Clicking Login appears to do nothing | `onPress={handleLogin}`, provider `signIn`, visible `errorMessage`, and submit state |
| Missing API URL message | Root `.env.local` must define `EXPO_PUBLIC_API_URL`; reload the app |
| Cannot reach the server | Start API separately; test `/health` on the computer and emulator |
| Wrong email/password | Use the seeded account; rerunning the seed does not reset its password |
| HTTP 429 | Current failed-attempt limit is five per IP per 15-minute window |
| Name disappears after reopening | Both endpoints now return name/username; restart the API after route changes and inspect the `/auth/me` response against the [account contract](login.md#account-fields) |
| Startup shows Could not check your session | Restore API/device connectivity, then tap Try again; see [startup retry](login.md#startup-loading-and-retry) |
| Property name/username is missing in TypeScript | Update `AuthUser` and actual API responses together |
| `await` syntax error in a route | Put `async` on the callback containing `await`; run backend syntax checks |
| User query returns nothing | Middleware sets `req.user.id`, not `req.user.user_id` |
| JSON contains rows/fields metadata | Return `result.rows[0]` under `user`, not the entire pg query result |

Login and session restoration both send `id`, `email`, `name` and `username`. Middleware still selects only ID/email; `/auth/me` obtains the complete account using an additional query keyed by `req.user.id`. Do not assume a successful TypeScript check establishes the runtime JSON contract.

## Database and seed

| Symptom | Action |
| --- | --- |
| `.env` missing | Configure `backend/.env` and run backend commands in that directory |
| Connection refused | Check PostgreSQL service, host and port |
| Password authentication failed | Match PGUSER/PGPASSWORD to the database role |
| Database or relation does not exist | Check PGDATABASE and apply the existing migrations |
| Migration succeeds but users are empty | Migrations create schema; run `seed-user.mjs` separately |
| Seed says account exists | Its password is unchanged; use the existing credentials |
| Seed succeeds but viewer shows no rows | Refresh and compare database, server, port and schema |
| Required name/username missing | Include all required columns in the seed; the current seed already does |

Read-only verification:

```sql
SELECT current_database(), current_user;
SELECT id, name, username, email FROM public.users;
SELECT name, run_on FROM public.pgmigrations ORDER BY run_on;
```

See [migrations.md](migrations.md) before changing schema history. A working `/health` response confirms connectivity, not successful seeding or login.

## Navigation and styling

Home is `/` in `(tabs)/index.tsx`; there is no separate `/index` route. Keep Login outside `(tabs)`. Private screens belong inside `Tabs.Protected`, while Home stays public. Bar visibility and route availability have separate controls; see [navigation.md](navigation.md).

| Symptom | What to check |
| --- | --- |
| Light rectangular strip behind the raised Home button | Keep `tabBarStyle` absolute and transparent; only the lower `tabBarBackground` panel should fill the bar, starting at 32 pixels |
| Log out or the last meal is covered by the bar | Add `tabBarHeight + 24` to ScrollView content bottom padding; Home uses 24 alone for guests. See [tab spacing](mobile-ui.md#tabs-and-safe-areas) |
| Hook-order error after adding tab height | Call `useBottomTabBarHeight()` before loading/redirect returns, alongside the other hooks |
| Logout opens Home instead of Login | Profile's handler should await `signOut()` and then call `router.replace("/login")`; the guard alone leaves Home available |
| Category link opens Home | The route redirects unsupported IDs; use breakfast, lunch, dinner or snacks |
| Category cards do not respond | Pass `onSelect` to `ExploreByMeal`; without it the component renders static cards |
| Notification bell does nothing | It is currently decorative; no notification screen/action is implemented |

For unresolved component imports, match both filename and named export. The existing meal-list component is `TodaysMeals` from `@/components/todays-meals`, not `TodayMealPlan`. React component function names must start with an uppercase letter when using hooks.

If classes stop applying, inspect Babel, Metro, Tailwind and the global CSS import using [mobile-ui.md](mobile-ui.md#nativewind-configuration). Stop Expo and restart with:

```powershell
npx expo start --clear
```

Generated route types are under `.expo/types/`. Confirm real screen files before trusting a cached route type; restart Expo after adding or renaming routes. Keep helpers outside `src/app/`.

## Browser and physical-device access

The native auth helper uses SecureStore and has no web storage path. Browser login needs an implementation change even when API connectivity works. `WEB_ORIGIN` must match the browser's exact origin; restart the API after changing it. Native requests do not use browser CORS checks.

A phone uses the computer's LAN address, not emulator-only `10.0.2.2`. Keep both devices on a reachable network and check the API from the phone browser. See [Android recovery](android-emulator.md) for offline emulators.

## Known limitations

- A background session-check network error leaves the existing user in memory and does not display the initial retry screen. A 401 clears the saved session.
- Home/Profile still declare fixed bottom-padding classes alongside their dynamic inline padding; keep future spacing changes in one place.
- `app.json` requests light appearance; login's dark styles are not an enabled automatic-theme feature.
- Social login, registration, password reset and editing account details are not implemented. Social buttons display an availability notice.
- Meal data is static; Meals, Plan and Groceries are placeholders. There are no meal-data API endpoints yet.
- Seed password validation accepts eight characters while its message says fifteen.
- The SecureStore key retains the name `chartineer.session`. Renaming it without migration would require signing in again.

## Verification commands

Run at the project root:

```powershell
npx expo lint
npx tsc --noEmit
Get-ChildItem -LiteralPath backend -Recurse -Filter *.mjs |
  Where-Object { $_.FullName -notmatch '[\\/]node_modules[\\/]' } |
  ForEach-Object {
    node --check $_.FullName
    if ($LASTEXITCODE -ne 0) { throw "Syntax check failed: $($_.FullName)" }
  }
```

TypeScript does not check these backend `.mjs` files. Syntax checks do not execute SQL. Use `/health` for connectivity and the [manual login checklist](login.md#manual-verification) for device behavior.

Verification on October 15, 2026: `npm run typecheck` and all backend `.mjs` syntax checks passed during this documentation update. `npm run lint` completed with no errors and one existing unused-import warning: `StatusBar` in `src/app/_layout.tsx`. Local documentation links and section anchors were checked after the guide updates.

This documentation update did not run migrations, create accounts or change application code. Database and emulator behavior were not re-tested for this update; use the manual checklist to verify them after implementation changes.
