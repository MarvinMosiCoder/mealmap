# Daily summaries and Home

Implemented and reviewed on October 22, 2026. Signed-in Home displays today's live calorie summary. Its separate today's-meals list and featured dinner still contain sample content.

## Implementation map

| File | Responsibility |
| --- | --- |
| `backend/routes/daily-summary.routes.mjs` | Authenticated selected-date totals, timezone boundaries and recorded goal lookup |
| `backend/app.mjs` | Mounts the summary router at `/daily-summary` |
| `src/lib/daily-summary.ts` | Response types, selected-date request, timezone date formatting and today's-summary helper |
| `src/components/home-daily-summary.tsx` | Loading/retry, session recovery, focus/foreground/midnight refresh and obsolete-response guards |
| `src/components/nutrition-summary.tsx` | Live SVG calorie ring, goal/remaining/over-goal copy, count and Profile link |
| `src/app/(tabs)/index.tsx` | Renders `HomeDailySummary` only for signed-in users, keyed by `user.id` |

## Request

```http
GET /daily-summary?date=2026-10-22
Authorization: Bearer <token-from-login>
```

`date` is a required, single query parameter in exact `YYYY-MM-DD` form, with a real calendar date and year 0001–9999. It comes from the caller, not the server clock. Missing, repeated or malformed dates and unknown parameters such as `userId` return 400. Future dates are accepted and use entries and goal history present at request time.

The router is `backend/routes/daily-summary.routes.mjs`, mounted by `backend/app.mjs` before error handling. It applies `requireAuth`, scopes the query to `req.user.id`, and inherits `Cache-Control: no-store`. Invalid sessions or a missing account return 401. An unset Profile timezone returns 409 asking the user to set it in Profile. Unexpected database errors use the generic 500 handler.

## Day and goal rules

- Use the current saved Profile timezone for every requested date. Changing it can regroup past meals and change which recorded goal applies; this version does not preserve historical timezone settings.
- Convert the selected local midnight and the next local midnight separately with PostgreSQL `AT TIME ZONE`. Do not assume every day lasts 24 hours.
- Include entries at or after `startsAt`, and strictly before `endsAt`. An entry at the next midnight belongs to the next day.
- Sum each entry's `kcal` directly; it already describes the full logged portion. Do not multiply by serving quantity.
- Select the latest goal with `effective_at < endsAt`, ordered by `effective_at DESC, id DESC`. The last goal saved during a day applies to that whole day and carries forward until another change.
- A selected goal row with a null value is `unset`. No applicable row is `unknown`; do not substitute today's current preference.
- Compute remaining calories as goal minus consumed calories. Preserve negative values when over goal. When the goal is unset or unknown, remaining calories and over-goal status are `null`.

One SQL statement reads the Profile timezone, aggregates meals and selects goal history. Summaries are derived on each request, so creating, editing or deleting a meal changes the next response without updating a separate counter. No new migration is required beyond the existing preferences, meal-log and goal-history migrations.

## Response

Example values, not assigned defaults:

```json
{
  "summary": {
    "date": "2026-10-22",
    "timezone": "Asia/Manila",
    "startsAt": "2026-10-21T16:00:00.000Z",
    "endsAt": "2026-10-22T16:00:00.000Z",
    "consumedKcal": 500,
    "mealCount": 1,
    "dailyCalorieGoalKcal": 2000,
    "goalStatus": "set",
    "remainingKcal": 1500,
    "isOverGoal": false
  }
}
```

`goalStatus` is `set`, `unset` or `unknown`. The latter two return `null` for `dailyCalorieGoalKcal`, `remainingKcal` and `isOverGoal`. Empty days return zero calories and zero meals, retaining any applicable goal. Aggregate strings from PostgreSQL are converted to numbers and checked against JavaScript's safe integer range before responding.

## Where today's date comes from

`GET /daily-summary` requires a date supplied by its caller. Home uses `getTodaysSummary()` to load `GET /profile/preferences`, then formats the current device-clock instant in that saved timezone with `getDateInTimezone()`. For example, an instant of `2026-10-21T16:30:00.000Z` is October 22 in `Asia/Manila`, so Home requests `date=2026-10-22`. It does not use the device's local calendar date or hardcode the date.

The formatter builds `YYYY-MM-DD` from `Intl.DateTimeFormat().formatToParts()` using an ISO calendar and Latin digits. The backend then computes that date's boundaries using the account's current saved timezone. Home displays the returned `date` and `timezone` below the card.

An unset timezone raises a 409 `ApiError` before the summary request. After a response, the helper checks that its date is still today in the returned timezone. If midnight or a concurrent timezone change invalidated the requested date, it retries once using the returned timezone. A second mismatch displays an error asking the user to try again. Correct device time is required; this client does not synchronize its clock with the server.

## Home calorie card

`HomeDailySummary` passes a successful response to `NutritionSummary`. The card shows consumed kcal, the available goal, remaining or over-goal kcal, meal count, date and timezone. The ring represents `consumedKcal / dailyCalorieGoalKcal`, clamped between zero and one. An over-goal result fills the ring and uses red text with the amount over goal. Exact-goal results show zero remaining.

With no applicable goal, the ring has no progress arc and the card offers Open Profile. An `unset` goal says to set a goal; `unknown` says no goal was recorded for today. Neither state invents a target or hides the consumed calories and meal count. Empty days show zero kcal and zero meals. The ring has a spoken calorie label; its numeric text can shrink to fit.

The old sample macro bars were removed. The API has no macro totals. `TodaysMeals` remains an independent list of three sample entries, so those cards can disagree with the live count until the meal-list integration is implemented.

## Refresh and error behavior

- Load when Home gains focus, including after returning from Profile or meal creation.
- While Home is focused, reload when the app returns to the active state. Backgrounding invalidates pending results and clears the midnight timer.
- After a successful load, schedule a reload just after the returned `endsAt` instant. The timer uses the server's day boundary rather than assuming a 24-hour day.
- Ignore superseded results and clear listeners/timers when Home loses focus or unmounts. A busy ref prevents overlapping current loads; invalidation does not cancel HTTP requests already sent.
- Reset card state for another account through `key={user.id}`.

Each load replaces the old card with a spinner and clears the previous summary. Failures show the message and Try again. A 409 also shows Open Profile; a 401 asks AuthProvider to refresh the session. The screen does not poll or subscribe to backend changes while it stays active on the same day, and has no pull-to-refresh gesture. For an external Postman/database change, leave Home and return to reload. A failed load waits for Retry, focus or foreground activation; it does not schedule a midnight retry without a successful summary.

## Verification

The user reported completing the Postman checks during guided implementation. On October 22, 2026, 16 isolated checks of the actual handler, 15 PostgreSQL checks and six HTTP integration checks passed. PostgreSQL cases used read-only synthetic inputs; HTTP cases used the actual app/auth middleware with fixture queries. No live accounts, sessions or meals were mutated by those automated checks.

Checks covered arithmetic, empty days, unset/unknown goals, same-day goal changes and timestamp ties, exclusive midnight limits, 23-hour/25-hour days, timezone regrouping, account isolation, safe aggregate conversion, date validation, authentication and the unset-timezone response. The query was also parsed against the local database schema. Lint and typecheck passed.

During Home implementation, 15 isolated lifecycle checks and seven isolated calorie-card rendering checks passed. These exercised refresh guards/timers and card states with mocked dependencies; they do not establish native SVG rendering or actual device lifecycle timing.

On October 22, 2026, restarting Expo Go on the Android emulator cleared duplicate SVG view-registration errors during Fast Refresh. A fresh launch displayed the live zero-kcal/zero-meal card, an unset-goal message, the returned date/timezone and Open Profile. No source or dependency change was needed for that recovery. See [SVG troubleshooting](troubleshooting.md#duplicate-svg-view-registration).

Live acceptance remains separate: compare responses with the test account's actual meal/history rows and complete the checklist below. Mobile past-day controls, edit/delete actions and a live Home meal list remain pending.

## Device verification

- [ ] Sign in with a saved timezone and compare Home's date, goal, calories and count with the API response for that date.
- [ ] Save a meal for today, then return Home; confirm total kcal and count increase once. A backdated meal should affect only its corresponding summary date.
- [ ] Save a different goal or clear it in Profile, return Home and confirm the recorded goal or unset state.
- [ ] Clear the timezone, return Home and confirm the error, Try again and Open Profile. Save a timezone and return to recover.
- [ ] Compare zero, below-goal, exact-goal and over-goal days, plus a date with no applicable goal history through the API.
- [ ] Cross local midnight while Home is visible; confirm it reloads into the new day. Repeat with the app backgrounded across midnight and then foreground it.
- [ ] Change the saved timezone and check dates/totals near midnight, including when device and Profile timezones differ.
- [ ] Fail a load, restore connectivity and retry; blur or background Home during a slow request and confirm late results cannot overwrite a newer load.
- [ ] Test session expiry and account switching; confirm the previous account's summary does not remain visible.
- [ ] Restart the app and compare persisted totals. Verify meal edits/deletes through the API until mobile controls exist.
- [ ] Check Android and iOS, large calorie values, larger text, screen-reader labels and the ring's progress/color states.
