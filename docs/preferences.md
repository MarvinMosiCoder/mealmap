# Profile preferences

The signed-in user can load, edit and save a daily calorie goal and timezone from Profile. Calorie-goal history was added and reviewed on October 22, 2026; the mobile form was reviewed on October 20, 2026.

These are current account preferences, with goal changes also recorded in PostgreSQL. [Manual meal creation/history](meal-logs.md) and Home's live calorie ring use persisted data. Home reads the saved timezone and recorded goal through the [daily-summary integration](daily-summary.md); its separate today's-meals list remains sample content. Meal entry/history currently uses the device timezone.

## Implementation map

| File | Responsibility |
| --- | --- |
| `backend/migrations/1792461599770_add-user-preferences.sql` | Adds nullable preference columns and a positive-goal constraint to `public.users` |
| `backend/migrations/1792648862272_create-calorie-goal-history.sql` | Creates goal history and captures existing accounts' current goals from migration time onward |
| `backend/routes/profile.routes.mjs` | Authenticated GET/PATCH handlers, validation and transactional preference/history writes for the session's user |
| `backend/app.mjs` | Injects `pool` and `requireAuth` into the profile router and mounts it at `/profile` |
| `src/lib/auth.ts` | Exports `ApiError` and `authenticatedRequest()`; reads the saved native session token |
| `src/lib/preferences.ts` | Defines `ProfilePreferences` and the GET/PATCH client functions |
| `src/components/profile-preferences-form.tsx` | Loading, retry, goal input, native timezone Picker, validation, Save and feedback |
| `src/app/(tabs)/profile.tsx` | Embeds the form, resets it for a different user and coordinates saving with logout |

## Storage and authentication

Apply the [preferences and calorie-goal-history migrations](migrations.md#current-schema) before using these endpoints.

| API field | Database column | Value |
| --- | --- | --- |
| `dailyCalorieGoalKcal` | `daily_calorie_goal_kcal` | Positive integer from 1 to 2147483647, or `null` |
| `timezone` | `timezone` | Recognized PostgreSQL timezone name, or `null` |

Both columns start as `NULL` for existing and new accounts. There is no default calorie goal or automatically selected timezone. The goal's maximum is the PostgreSQL `INTEGER` storage limit.

The router factory accepts `{ pool, requireAuth }` and calls `router.use(requireAuth)` before registering its handlers. Both handlers use `WHERE id = $1` with `req.user.id`. A request cannot select an account through a body or URL user ID. Authentication also supplies `Cache-Control: no-store`.

The native client uses `authenticatedRequest()` to retrieve the existing `chartineer.session` token and attach an Authorization header. A missing token raises `ApiError` with status 401 before making the request. Server failures retain their HTTP status through the same error class. See [saved sessions](login.md#sign-in-and-session-restoration).

Preferences are fetched separately from account identity. `AuthUser`, `/auth/login` and `/auth/me` still contain `id`, `email`, `name` and `username`.

## GET preferences

```http
GET /profile/preferences
Authorization: Bearer <token-from-login>
```

A successful request returns 200 with the current values. For an unconfigured account:

```json
{
  "preferences": {
    "dailyCalorieGoalKcal": null,
    "timezone": null
  }
}
```

## PATCH preferences

Send a JSON object containing one or both supported fields:

```http
PATCH /profile/preferences
Authorization: Bearer <token-from-login>
Content-Type: application/json
```

```json
{
  "dailyCalorieGoalKcal": 2000,
  "timezone": "Asia/Manila"
}
```

The goal above is an example request value. Users choose their own goal.

PATCH returns 200 with the complete saved `{ preferences: { dailyCalorieGoalKcal, timezone } }` object.

| Input | Behavior |
| --- | --- |
| Field omitted | Preserve that column's existing value |
| Field explicitly `null` | Clear that column |
| Goal supplied as a number | Require a whole number within the positive integer range |
| Goal supplied as a string, zero, negative or fractional number | Return 400 |
| Timezone supplied as a string | Trim it; require 1–255 characters and an exact match in `pg_catalog.pg_timezone_names` |
| Empty timezone string or unrecognized name | Return 400; use `null` to clear a timezone |
| Empty object, array, missing body or unknown fields such as `userId` | Return 400 |

The handler uses `Object.hasOwn()` to distinguish omitted fields from `null`. After validation, it acquires a client with `pool.connect()`, begins a transaction and reads the authenticated user's current goal with `SELECT ... FOR UPDATE`. A parameterized UPDATE uses SQL `CASE` expressions to preserve omitted columns and `RETURNING` to read the saved values. An actual goal change is inserted into history before COMMIT. Every transaction query uses that same client, errors trigger ROLLBACK, and `finally` releases the client. Timezone validation completes before the transaction, so an invalid timezone saves neither preferences nor history.

Both endpoints return 401 for a missing, malformed, unknown, expired or revoked session, or if the account disappears before the preferences query. Invalid JSON returns 400, bodies over the app's 10 KB JSON limit return 413, and database failures reach the existing 500 error handler.

## Calorie-goal history

`public.users.daily_calorie_goal_kcal` remains the current value returned by the preferences API. `public.calorie_goal_history` stores the baseline and subsequent changes:

| Column | Meaning |
| --- | --- |
| `id` | Generated BIGINT identity primary key; breaks ties when ordering history |
| `user_id` | Required user foreign key; deleting the account cascades to its history |
| `daily_calorie_goal_kcal` | Positive INTEGER goal, or `NULL` for an unset goal |
| `effective_at` | TIMESTAMPTZ with a `clock_timestamp()` default, recording the insertion instant |

The index is `(user_id, effective_at DESC, id DESC)`. The migration inserts one baseline row for each account that exists when it runs, including unset goals. It does not reconstruct earlier changes or assign the current goal to past dates. Accounts created later with an unset goal have no baseline until an actual goal change is saved through PATCH; missing earlier history remains unknown.

| Save | History behavior |
| --- | --- |
| Goal changes to a different positive value | Insert the saved value |
| A set goal is cleared | Insert `NULL`; keep earlier records |
| The displayed goal is saved unchanged, including `NULL` to `NULL` | No additional row |
| Goal is omitted or only timezone changes | No additional row |
| Validation fails | No preference or history changes |
| A history insert fails | Roll back the current preference update as well |

The user-row lock serializes concurrent preference saves for the same account before comparing the old and new goals. Ownership for both the update and history insert comes from `req.user.id`. Existing history rows are not updated by the handler. The API response stays `{ preferences }`; there is no mounted history-read endpoint or mobile history screen.

This records goal changes, not daily goal snapshots. The [daily-summary API](daily-summary.md#day-and-goal-rules) uses the latest goal recorded before the next local midnight in the current saved timezone. A same-day goal change applies to that whole day; changing timezone can regroup past meals and change the applicable goal. A day before the first recorded goal is unknown, and an explicitly cleared goal stays unset. Neither receives zero or an arbitrary default goal.

## Goal-history verification

Use the signed-in test account's Bearer token with `PATCH /profile/preferences`, then compare `GET /profile/preferences` with a read-only SQL query in pgAdmin:

```sql
SELECT id, user_id, daily_calorie_goal_kcal, effective_at
FROM public.calorie_goal_history
ORDER BY effective_at DESC, id DESC;
```

| Check | Expected result |
| --- | --- |
| Save a goal different from the current value | 200; one new history row |
| Save that goal again | 200; no additional row |
| Clear the set goal with `null` | 200; one new row with a `NULL` goal |
| Clear it again | 200; no additional row |
| Change only timezone | 200; no additional history row |
| Save zero as the goal | 400; preferences and history remain unchanged |
| Compare current preference with the latest history row for the same account | Values match, including an explicit unset goal |

On October 22, 2026, the user reported completing this Postman/SQL sequence. A subsequent read-only database check found three history rows for the existing account, including one unset-goal row, and confirmed the latest goal matched the current preference. Fourteen isolated checks of the actual PATCH handler passed with a mock database, including change/unchanged/clear, timezone-only and combined saves, invalid inputs, missing-account handling and rollback after an insert failure. These checks do not establish live rollback or concurrent-request behavior. The [summary guide](daily-summary.md#verification) records the separate summary checks; full device acceptance and mobile past-day controls remain open.

## Profile form behavior

The form appears after the account card and before Your kitchen.

1. On mount, `getProfilePreferences()` loads the saved values. A spinner appears while loading; a failure displays its message and Try again.
2. The goal stays a string while editing; a saved `null` goal appears blank. The native timezone Picker starts at Not set when the saved timezone is `null`. No timezone is automatically assigned.
3. Save trims both values. A blank goal or the Not set timezone option becomes `null`. The goal must contain decimal digits and fit the same positive integer range as the API; the backend checks the timezone name.
4. During PATCH, the form disables editing and Save, displays a spinner and labels the button `Saving...`. A ref prevents repeated submissions before the next render.
5. On success, the form displays the server's saved values and Preferences saved. Editing either input clears old success/error feedback.
6. On failure, the form keeps the draft values and displays the error. A 401 triggers `refreshSession(false)`; the existing session check and navigation guards handle expiry.
7. `onSavingChange` disables Logout while saving. The form is disabled while logout is pending. `key={user.id}` resets form state for a different account.

Effect cleanup ignores late load results, and a mounted ref guards save-result state updates after unmount. These guards do not cancel an HTTP request already sent.

The installed `@react-native-picker/picker` version is 2.11.4. Starter options are `Asia/Manila`, `Asia/Singapore`, `Asia/Tokyo`, `Europe/London`, `America/New_York`, `Australia/Sydney` and `UTC`, plus Not set to clear. A saved timezone outside this shortlist is added as an option, so loading the form does not silently replace it. Android uses dropdown mode; iOS uses its native picker. The wrapper blocks pointer events and the picker disables during save/logout. This is a shortlist, not a searchable catalog of every timezone. See [SDK 55 Picker](https://docs.expo.dev/versions/v55.0.0/sdk/picker/).

Profile keeps the floating-tab bottom padding, uses `keyboardShouldPersistTaps="handled"` and enables `automaticallyAdjustKeyboardInsets` for iOS. Save calls `Keyboard.dismiss()`. Keyboard reachability still needs device checks on Android and iOS.

## API verification

Run both servers using [setup.md](setup.md). In Postman, use `http://localhost:3000` on Windows, log in with the existing `POST /auth/login` route and use its token as Bearer authorization.

| Check | Expected result |
| --- | --- |
| GET/PATCH without valid authorization | 401 |
| GET before preferences are configured | 200 with nullable fields |
| PATCH both valid fields, then GET | 200; GET returns the saved values |
| PATCH only a goal | Timezone stays unchanged |
| PATCH only a timezone | Goal stays unchanged |
| PATCH either or both fields as `null` | Only explicitly cleared fields become `null` |
| PATCH `[]`, `{}`, a string goal, zero/negative/fractional/out-of-range goal, invalid timezone or `userId` | 400; saved values stay unchanged |
| Restart the API, then GET with a valid session | Saved preferences remain in PostgreSQL |
| Save distinct preferences using two accounts and their own tokens | Each token can read/update only its own account |

These requests intentionally update the signed-in test account's preferences. Keep tokens and account credentials local to the API client.

## Device verification

Complete these checks before marking the Profile form acceptance work done:

- [ ] Open Profile while signed in; compare loaded values with GET in Postman.
- [ ] Save a goal and timezone; confirm success and the persisted GET response.
- [ ] Fully restart the app with the API available; confirm saved values load again.
- [ ] Clear the goal or choose Not set for timezone and save; confirm the corresponding `null` values after reopening.
- [ ] Try an invalid pasted goal; use Postman to test an invalid timezone, since the picker offers predefined choices.
- [ ] Save a valid timezone outside the shortlist through Postman, remount Profile and confirm it appears as an additional selected option.
- [ ] After the form loads, stop the API and save; confirm the draft survives the failure, then restart the API and retry Save.
- [ ] Fail an initial preferences load while the app is already signed in; restore connectivity and tap Try again.
- [ ] Tap Save repeatedly with a slow request; confirm one PATCH and disabled Logout until it finishes.
- [ ] Test an expired session and changing accounts; confirm guards and form state use the correct account.
- [ ] On Android and iOS, check small screens, large text, accessible labels and scrolling to Save with the keyboard open.

## Current limits

- Preferences load on mount and explicit load retry, not whenever a retained tab gains focus. A change made in Postman may require remounting Profile to appear.
- Saving is explicit. Unsaved drafts are not persisted across component unmounts.
- The form sends both displayed fields on Save, although the API supports partial updates.
- The timezone picker offers a small fixed shortlist plus the current saved value. It has no search/full catalog or automatic device-timezone selection. Its helper copy still says to leave a field blank; clearing timezone uses Not set.
- Goal changes are recorded from the initial baseline onward and used by the daily-summary API. Daily snapshots and historical timezone preservation are not implemented; earlier goals are unknown. The current timezone interprets all summary dates.
- Home reloads saved preferences and today's summary when it gains focus. Save before returning Home; unsaved Profile drafts do not affect the summary. Changes made externally while Home remains active appear on its next focus, foreground or midnight reload.

See [troubleshooting](troubleshooting.md#profile-preferences) for common failures, [meal logs](meal-logs.md) for the current tracking flow and [the roadmap](../TODO.md) for remaining work.
