# Profile preferences

The signed-in user can load, edit and save a daily calorie goal and timezone from Profile. This guide reflects the source reviewed on October 20, 2026.

These are current account preferences. [Manual meal creation/history](meal-logs.md) now uses PostgreSQL, while Home's calorie ring and today's meals remain sample data. Daily summaries, goal history and profile-timezone diary boundaries remain planned. Meal entry/history currently uses the device timezone.

## Implementation map

| File | Responsibility |
| --- | --- |
| `backend/migrations/1792461599770_add-user-preferences.sql` | Adds nullable preference columns and a positive-goal constraint to `public.users` |
| `backend/routes/profile.routes.mjs` | Authenticated GET/PATCH handlers, validation and queries for the session's user |
| `backend/app.mjs` | Injects `pool` and `requireAuth` into the profile router and mounts it at `/profile` |
| `src/lib/auth.ts` | Exports `ApiError` and `authenticatedRequest()`; reads the saved native session token |
| `src/lib/preferences.ts` | Defines `ProfilePreferences` and the GET/PATCH client functions |
| `src/components/profile-preferences-form.tsx` | Loading, retry, goal input, native timezone Picker, validation, Save and feedback |
| `src/app/(tabs)/profile.tsx` | Embeds the form, resets it for a different user and coordinates saving with logout |

## Storage and authentication

Apply the [preferences migration](migrations.md#current-schema) before using these endpoints.

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

The handler uses `Object.hasOwn()` to distinguish omitted fields from `null`. One parameterized UPDATE uses SQL `CASE` expressions to preserve omitted columns and `RETURNING` to read the saved values. Timezone validation completes before the UPDATE, so an invalid timezone does not save an accompanying goal change.

Both endpoints return 401 for a missing, malformed, unknown, expired or revoked session, or if the account disappears before the preferences query. Invalid JSON returns 400, bodies over the app's 10 KB JSON limit return 413, and database failures reach the existing 500 error handler.

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
- Goal history and daily snapshots are not implemented. Add those before historical calorie summaries so changing a current goal cannot rewrite past totals.
- Saving preferences does not change Home's sample nutrition values.

See [troubleshooting](troubleshooting.md#profile-preferences) for common failures, [meal logs](meal-logs.md) for the current tracking flow and [the roadmap](../TODO.md) for remaining work.
