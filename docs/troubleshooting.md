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

## Profile preferences

Read [preferences.md](preferences.md) for the contract and [device verification](preferences.md#device-verification) for acceptance checks.

| Symptom | What to check |
| --- | --- |
| Preferences query reports missing columns or the form receives 500 after the API update | Apply `1792461599770_add-user-preferences.sql` to the same database used by the API; inspect [schema/history](migrations.md#migration-recorded-but-columns-missing) |
| Cannot find name Keyboard | Include `Keyboard` in the `react-native` import in `profile-preferences-form.tsx` |
| PATCH with an array returns 500 | The body guard must call `res.status(400).json(...)`; `res.status.json(...)` throws at runtime |
| API rejects a goal | Send a JSON number, `null` or omit it; valid numbers are positive integers up to 2147483647 |
| API rejects a timezone | Use an exact PostgreSQL timezone name such as `Asia/Manila`; an empty string is invalid and `null` clears it |
| Clearing a preference removes its saved value | A blank calorie goal or the timezone's Not set option submits `null` |
| Loading preferences fails | The card has its own Try again button; check API connectivity separately from the startup session check |
| Save fails | The draft stays in the fields. Correct input or restore connectivity, then press Save again |
| A Postman change is not visible in an already open Profile tab | Preferences load on mount/retry, not every tab focus; remount Profile to load external changes |
| Logout is disabled | Wait for the preference save to finish; `onSavingChange` coordinates the two actions |
| Preferences receive 401 | The form asks AuthProvider to refresh the session. Check token expiry and the existing guards |
| Preferences save but Home's calorie ring stays the same | Home still uses sample data; the daily-summary integration remains planned |

The form keeps values as strings while editing, converts a valid goal to a number for PATCH and uses the exported `authenticatedRequest()` helper for the native session token. TypeScript does not validate the server's JSON at runtime.

## Meal logs

Read [meal-logs.md](meal-logs.md) for the API contract, [API verification](meal-logs.md#api-verification) and [device verification](meal-logs.md#device-verification).

| Symptom | What to check |
| --- | --- |
| Meal requests report a missing table | Apply `1792473191029_create-meal-logs.sql` to the API's database; check migration history and `public.meal_logs` |
| A handler reports body is not defined | After extracting shared validation, read the validated fields from `res.locals.mealLog`; do not reference an old local `body` variable |
| A successful delete causes a JSON parsing error | DELETE returns 204 with no body; `authenticatedRequest()` must handle 204 before parsing JSON |
| API rejects eatenAt | Send a real date in exact UTC format, such as `2026-10-20T04:30:00.000Z`; offsets and timestamps without milliseconds are rejected |
| Editing only one field returns 400 | PUT requires all five editable fields; it is a full update, not a partial PATCH |
| Calories seem multiplied by servings | `kcal` is the total for the logged portion; neither the form nor API multiplies it by `servingQuantity` |
| Save stays disabled after success | The form locks the confirmed entry to prevent repeated submission. Go back, then open Add meal for another entry |
| Save fails | The draft stays available for correction or retry. A 401 asks AuthProvider to refresh the session |
| Saved meal does not appear immediately | Return to Meals to trigger its focus reload, or pull to refresh; a backdated meal may be beyond the first page |
| Only 20 meals are visible | The default page size is 20. Use Load more; date filters are not implemented yet |
| Update/delete returns 404 | Missing entries and entries owned by another user share the same response. Check the authenticated owner and the meal ID |
| API rejects an ID | Use the returned string ID: positive decimal digits, no leading zeros, within PostgreSQL BIGINT range |
| Picker callback is missing from TypeScript types | Installed DateTimePicker 8.6.0 uses `onChange`; examples for newer releases may use a different callback |
| A native picker is unavailable in a custom development build | Rebuild that client after adding native dependencies or changing native configuration. Both picker packages are included in compatible Expo Go |
| Meal times differ from the Profile timezone | Entry and history currently use the device timezone; Profile's saved timezone is reserved for future day boundaries |
| Saved meal does not change Home | Home still uses sample meals and nutrition totals; the daily-summary API and Home integration remain pending |

Saving successfully keeps the form on Add meal; navigation back is manual. The history reloads on focus and pull-to-refresh, ignores stale requests and merges additional pages by ID. Offset pagination can still shift when entries change between requests; refresh to reload from the first page.

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

Home is `/` in `(tabs)/index.tsx`; there is no separate `/index` route. Login and Add meal are outside `(tabs)`: root `Stack.Protected` groups use `!user` for Login and `!!user` for Add meal. Private tabs use `Tabs.Protected`, while Home stays public. Bar visibility and route availability have separate controls; see [navigation.md](navigation.md).

| Symptom | What to check |
| --- | --- |
| Light rectangular strip behind the raised Home button | Keep `tabBarStyle` absolute and transparent; only the lower `tabBarBackground` panel should fill the bar, starting at 32 pixels |
| Log out or the last meal is covered by the bar | Add `tabBarHeight + 24` to ScrollView or FlatList content bottom padding; Home uses 24 alone for guests. See [tab spacing](mobile-ui.md#tabs-and-safe-areas) |
| Add meal opens Home instead | Check that `/add-meal` is registered in the root authenticated `Stack.Protected guard={!!user}` group |
| Meal history is blank despite a successful request | Give the Meals parent and FlatList bounded height with `flex: 1`; keep the list out of another vertical ScrollView |
| Hook-order error after adding tab height | Call `useBottomTabBarHeight()` before loading/redirect returns, alongside the other hooks |
| Logout opens Home instead of Login | Profile's handler should await `signOut()` and then call `router.replace("/login")`; the guard alone leaves Home available |
| Category link opens Home | The route redirects unsupported IDs; use breakfast, lunch, dinner or snacks |
| Category cards do not respond | Pass `onSelect` to `ExploreByMeal`; without it the component renders static cards |
| Notification bell does nothing | It is currently decorative; no notification screen/action is implemented |

For unresolved component imports, match both filename and named export. Home's sample list is `TodaysMeals` from `@/components/todays-meals`; persisted history is `MealLogList` from `@/components/meal-log-list`. React component function names must start with an uppercase letter when using hooks.

If classes stop applying, inspect Babel, Metro, Tailwind and the global CSS import using [mobile-ui.md](mobile-ui.md#nativewind-configuration). Stop Expo and restart with:

```powershell
npx expo start --clear
```

Generated route types are under `.expo/types/`. Confirm real screen files before trusting a cached route type; restart Expo after adding or renaming routes. Keep helpers outside `src/app/`.

## Browser and physical-device access

The native auth helper uses SecureStore and has no web storage path. Browser login needs an implementation change even when API connectivity works. Meal date/time controls currently support Android and iOS; the component does not render web date/time inputs. `WEB_ORIGIN` must match the browser's exact origin; restart the API after changing it. Native requests do not use browser CORS checks.

A phone uses the computer's LAN address, not emulator-only `10.0.2.2`. Keep both devices on a reachable network and check the API from the phone browser. See [Android recovery](android-emulator.md) for offline emulators.

## Known limitations

- A background session-check network error leaves the existing user in memory and does not display the initial retry screen. A 401 clears the saved session.
- Home/Profile still declare fixed bottom-padding classes alongside their dynamic inline padding; keep future spacing changes in one place.
- `app.json` requests light appearance; login's dark styles are not an enabled automatic-theme feature.
- Social login, registration, password reset and editing account name/email/username are not implemented. Goal/timezone preferences are implemented. Social buttons display an availability notice.
- Preferences offer seven timezone choices and preserve a saved value outside that shortlist. There is no full searchable timezone catalog, automatic detection, goal history or preference reload on every tab focus. Saving is explicit, and unmounted drafts are discarded.
- Manual meal creation and paginated history persist through authenticated API routes. Update/delete endpoints exist, but mobile edit/delete actions, daily summaries, day filters and over-goal UI remain pending. Home uses sample data; Plan and Groceries remain placeholders.
- Meal entry and history use the device timezone rather than the saved Profile timezone.
- The form prevents repeat taps and another save after confirmed success. There is no server idempotency key to prevent duplicates if a response is lost and the request is retried.
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

TypeScript does not check these backend `.mjs` files. Syntax checks do not execute SQL. Use `/health` for connectivity, the [manual login checklist](login.md#manual-verification), [preferences device checklist](preferences.md#device-verification) and [meal-log checks](meal-logs.md#device-verification) for device behavior.

Verification on October 20, 2026: `npx expo lint`, `npx tsc --noEmit` and all backend `.mjs` syntax checks passed during this documentation update. Local documentation links and section anchors were checked after the guide updates.

The preferences API was tested in Postman during development. Earlier isolated checks exercised backend validation/authentication and the meal Save handler. This documentation update did not run migrations, create accounts, change application code or repeat live API/database or emulator/device tests. The device checklists record acceptance work to complete; they are not passed test records.
