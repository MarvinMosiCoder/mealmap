# Manual meal logs

Signed-in users can create a meal from Meals > Add meal and browse their saved meal history. PostgreSQL stores the entries; the API also supports editing and deletion. Mobile edit/delete actions and daily calorie summaries are still pending. Source reviewed on October 20, 2026.

## Implementation map

| File | Responsibility |
| --- | --- |
| `backend/migrations/1792473191029_create-meal-logs.sql` | Meal-log table, ownership foreign key, constraints and user/time index |
| `backend/routes/meal-logs.routes.mjs` | Authenticated POST, GET, PUT and DELETE; shared create/update validation |
| `backend/app.mjs` | Injects `pool` and `requireAuth`, mounts `/meal-logs` before error handling |
| `src/lib/meal-logs.ts` | Types and authenticated create/list/update/delete helpers |
| `src/components/meal-log-form.tsx` | Draft inputs, validation, POST, save lock and feedback |
| `src/components/meal-date-time-field.tsx` | Native Android/iOS date/time selection in the device timezone |
| `src/components/meal-log-list.tsx` | Paginated FlatList, focus refresh, pull-to-refresh, loading, empty and error states |
| `src/app/add-meal.tsx` | Add meal route, safe area and keyboard-aware scrolling |
| `src/app/(tabs)/meals.tsx` | Add meal link and list keyed by account ID |
| `src/app/_layout.tsx` | Authenticated `/add-meal` stack route with a native header |

Apply all [migrations](migrations.md#apply-and-inspect) before using the feature. Accounts and sessions use the existing [login flow](login.md).

## Storage and calorie meaning

One row represents a logged portion that the user ate. `serving_quantity` is the number of servings eaten; `kcal` is the total for that entire portion. Two servings at 250 kcal each means quantity `2` and kcal `500`. The list displays 500 kcal; a future summary must sum `kcal` directly rather than multiply it by quantity again.

| Column | Storage and constraints |
| --- | --- |
| `id` | Generated identity BIGINT primary key; API returns a string |
| `user_id` | Required users foreign key with `ON DELETE CASCADE` |
| `meal_name` | Required text; trimmed name length 1 to 200 characters |
| `meal_category` | `breakfast`, `lunch`, `dinner` or `snacks` |
| `serving_quantity` | Positive `NUMERIC(10,3)`, with NaN excluded; API accepts 0.001 to 9999999.999 with at most three decimal places |
| `kcal` | Required nonnegative INTEGER; API range 0 to 2147483647 |
| `source` | `manual`, `photo` or `recipe`; default `manual`; creation endpoint explicitly sets `manual` |
| `eaten_at` | Required finite TIMESTAMPTZ for when the meal was eaten |
| `created_at`, `updated_at` | Required TIMESTAMPTZ, default NOW(); PUT explicitly refreshes `updated_at` |

The index is `(user_id, eaten_at DESC)`. `photo` and `recipe` are reserved schema values; their creation flows do not exist yet. Timestamps preserve an instant, not the originally selected timezone name. The current [account goal](preferences.md) remains nullable and is not copied onto meal logs.

## API contract

Every endpoint requires `Authorization: Bearer <token-from-login>`. The router applies `requireAuth` before its handlers and protected responses set `Cache-Control: no-store`.

| Method and path | Behavior | Success |
| --- | --- | --- |
| `POST /meal-logs` | Create one manual entry owned by `req.user.id` | 201 `{ mealLog }` |
| `GET /meal-logs?limit=20&offset=0` | List the authenticated user's history, newest eaten-at first | 200 `{ mealLogs, pagination }` |
| `PUT /meal-logs/:id` | Replace all five editable fields of an owned entry | 200 `{ mealLog }` |
| `DELETE /meal-logs/:id` | Delete an owned entry | 204 with no response body |

POST and PUT require a JSON object containing all five fields below. Unknown fields, including `userId`, `user_id` and `source`, are rejected with 400. PUT requires the complete editable input, not a partial update.

```json
{
  "mealName": "Chicken and rice",
  "mealCategory": "lunch",
  "servingQuantity": 2,
  "kcal": 500,
  "eatenAt": "2026-10-20T04:30:00.000Z"
}
```

| Field | Validation |
| --- | --- |
| `mealName` | String, trimmed, 1 to 200 Unicode code points, no null characters |
| `mealCategory` | One of the four category IDs |
| `servingQuantity` | Finite JSON number, positive, within the supported range and at most three decimal places |
| `kcal` | JSON number representing a whole number within the nonnegative INTEGER range |
| `eatenAt` | Real date/time in the exact UTC form `YYYY-MM-DDTHH:mm:ss.sssZ` |

`eatenAt` must include seconds, three millisecond digits and `Z`. A local timestamp without a zone, an offset timestamp such as `+08:00`, and an impossible calendar date receive 400. Convert a selected JavaScript Date with `toISOString()` before sending it. The example instant is 12:30 PM in Manila.

A meal response includes these fields:

```json
{
  "mealLog": {
    "id": "1",
    "mealName": "Chicken and rice",
    "mealCategory": "lunch",
    "servingQuantity": 2,
    "kcal": 500,
    "source": "manual",
    "eatenAt": "2026-10-20T04:30:00.000Z",
    "createdAt": "2026-10-20T04:31:00.000Z",
    "updatedAt": "2026-10-20T04:31:00.000Z"
  }
}
```

The ID and audit timestamps above are examples. SQL casts IDs to text and quantities to double precision for JSON. Keep IDs as strings in the app; BIGINT values can exceed JavaScript's safe integer range.

### Pagination

GET supports only `limit` and `offset`. Both must be single strings of decimal digits in the query. Limit defaults to 20 and must be 1 to 100; offset defaults to 0 and must be 0 to 2147483647. Unknown parameters, repeated parameters, fractional values and invalid ranges receive 400.

The query uses `WHERE user_id = $1`, orders by `eaten_at DESC, id DESC`, and fetches `limit + 1` rows. It returns at most `limit` entries and uses the extra row to determine `hasMore`:

```json
{
  "mealLogs": [],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

Request the next page using the previous `offset + limit`. This endpoint lists history across dates; it has no day, category or search filter. Offset pagination is not a snapshot: concurrent inserts/deletes can shift page boundaries. The mobile list deduplicates overlapping IDs and refreshes from the first page on focus or pull-to-refresh.

### Ownership and errors

POST gets ownership exclusively from the authenticated session. PUT and DELETE perform a single mutation with `WHERE id = $1 AND user_id = $2`. A missing entry and another user's entry both receive 404; a request cannot change the owner or source.

Path IDs must be positive decimal strings without leading zeros and no greater than `9223372036854775807`. Malformed/out-of-range IDs return 400. Missing, malformed, expired, unknown or revoked sessions return 401. Shared JSON parsing returns 400 for invalid JSON and 413 above 10 KB; unexpected database failures reach the generic 500 handler. Repeating a successful DELETE returns 404.

## Mobile creation and history

The Add meal link opens `/add-meal` under `Stack.Protected guard={!!user}`. The route is outside the tabs and shows a native Back header. Its ScrollView supports keyboard reachability; its safe area excludes the top already covered by the header.

The form starts with empty name, category, serving quantity and calorie inputs, plus the current date/time. It assigns no calorie value or category. Numeric drafts remain strings. Save trims the name, accepts a decimal point or comma for servings, validates the fields and sends numeric values plus `eatenAt.toISOString()`. Inputs such as `.5` and `1.` normalize to JSON numbers; blank kcal is invalid while an explicit `0` is valid.

Save dismisses the keyboard, sets a ref lock immediately and shows `Saving...`. Fields, the category picker and date/time picker are disabled. A successful POST displays `Meal saved.` and leaves the form and button locked as `Saved`; it does not automatically navigate or clear the form. Use the header Back button, then reopen Add meal for a new entry. On failure the draft remains, the lock is released and the error is displayed. A 401 requests `refreshSession(false)` through AuthProvider. Unmount guards suppress late state updates but do not cancel an already-sent request.

The Meals tab renders `MealLogList` with `key={user.id}`, so a different account gets fresh local list state. It fetches 20 rows on each focus, including returning from Add meal. Pull-to-refresh reloads the first page; Load more appends older entries. Request versions ignore superseded or blurred-screen responses, a busy ref blocks overlapping load-more requests, and a Map merges entries by ID. Loading, empty and retry states are explicit. Existing entries remain visible during refresh. FlatList content has `tabBarHeight + 24` bottom padding for the absolute tab bar.

### Timezone and native pickers

Entry and history display use the device timezone, which is labelled in the UI. They do not currently use the Profile timezone. That preference is intended for future daily-summary boundaries. Choosing an instant and grouping it into a diary day are separate operations; test differences around midnight when integrating summaries.

`@react-native-community/datetimepicker` 8.6.0 is installed for SDK 55 and registered in `app.json`. Android uses `DateTimePickerAndroid.open()` with separate date/time dialogs; iOS uses the compact combined datetime picker. The 8.6.0 callback is `onChange`; only `event.type === "set"` updates the value, so cancellation preserves it. See [SDK 55 picker documentation](https://docs.expo.dev/versions/v55.0.0/sdk/date-time-picker/) and [8.6.0 API types](https://github.com/react-native-datetimepicker/datetimepicker/blob/v8.6.0/src/index.d.ts).

The module is included in compatible Expo Go. Rebuild a custom development client after adding native dependencies/configuration. Date/time controls currently target Android/iOS; browser session storage and web date/time controls are not implemented.

## API verification

Use the [setup sequence](setup.md), log in through `/auth/login`, and apply the token as Bearer authorization in Postman. Use disposable test entries for mutation checks.

| Check | Expected |
| --- | --- |
| POST/GET/PUT/DELETE without valid authorization | 401 |
| POST the example body | 201; ID as a string, numeric quantity and kcal, `source: manual` |
| GET with the same account | Saved entry appears in that account's history |
| POST/PUT blank name, missing category, zero servings, string/fractional/negative kcal, invalid timestamp or unknown fields | 400; no mutation |
| GET invalid/repeated paging parameters or `userId` | 400 |
| Two owned entries with `limit=1`, offsets 0 and 1 | Different rows in descending eaten-at/ID order; correct `hasMore` |
| PUT an owned ID with all five fields | 200 with updated values and refreshed `updatedAt`; source/owner preserved |
| PUT/DELETE account A's ID using account B's token | 404; A's entry remains unchanged |
| PUT/DELETE malformed or out-of-range ID with otherwise valid input | 400 |
| DELETE an owned entry | 204, empty body; entry absent from subsequent GET |
| Repeat DELETE | 404 |
| Restart API/app and GET with a valid account | Persisted entries remain |

## Device verification

These are acceptance checks, not a record of completed device testing:

- [ ] Signed-in Meals > Add meal opens; signed-out direct access remains unavailable.
- [ ] Create an entry with two servings and 500 total kcal; confirm its fields with the same account's GET response.
- [ ] Check fractional servings, explicit zero kcal, required fields, pasted invalid values and numeric bounds.
- [ ] On Android and iOS, change the date and time independently, confirm the other part is preserved and check cancellation.
- [ ] Compare the device-local display with the UTC API timestamp, including a value near midnight.
- [ ] Rapid Save taps and taps after success create only one request from that form instance.
- [ ] With the API unavailable, confirm a visible error, preserved inputs and an enabled retry after failure.
- [ ] Return to Meals after a confirmed save; confirm focus reload and pull-to-refresh.
- [ ] With more than 20 entries, confirm Load more, its failure/retry path and no duplicate rendered IDs.
- [ ] Switch accounts; confirm old entries do not appear in the new account's list.
- [ ] Restart the app and confirm entries persist; test expired sessions and recovery.
- [ ] Check large text, keyboard overlap, native picker behavior and scrolling the final card/button above the tab bar.

## Remaining work

- Mobile edit/delete actions and confirmation/reload behavior; only the API and helpers currently support those mutations.
- Daily-summary endpoint, selected-day navigation, profile-timezone boundaries, goal history/snapshots and over-goal presentation.
- Replace Home's sample calorie ring and today's meals with live data. Saving a log does not currently change Home.
- Server idempotency for retries after a lost response or reopening the form. The local save lock does not guarantee exactly-once creation across requests.
- Photo/recipe logging, saved recipes, planning and groceries.

Earlier development checks exercised the backend with a mock database and the actual Save handler with a mocked API/state setters. Those checks do not establish live SQL persistence or native picker behavior. Run the API/device checklists and [project checks](troubleshooting.md#verification-commands) for acceptance.
