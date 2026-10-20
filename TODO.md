# MealMap development checklist

Roadmap based on the product direction confirmed on October 15, 2026, with source status updated on October 20, 2026. Checked implementation items identify work present in the source and reviewed through source, type/syntax or isolated API/logic checks. Full device and live-database acceptance remains separate; use the linked verification checklists.

## Product goal

Users can track the calories they eat each day by entering a meal, choosing a photo or taking a picture. They review the food and portion, then confirm the entry to update their remaining daily calories.

Users can also generate suggested recipes from either available ingredients or a meal name/photo. They can save a recipe, plan it and log the portion they actually eat.

## Existing foundation

- [x] Set up the Expo SDK 55 application with NativeWind and Poppins.
- [x] Build the public Home screen and authentication guards for private tabs.
- [x] Connect native email/password login, saved sessions and logout.
- [x] Set up the Express/PostgreSQL backend with users and sessions migrations.
- [x] Build Profile, meal-category browsing and the updated login UI.
- [x] Add setup, authentication, navigation, database and troubleshooting documentation.

Manual meal creation and paginated meal history now use PostgreSQL. Home nutrition values and today's meals still use sample data. Photo analysis, recipe generation and the daily-summary integration remain planned.

## 1. Finish the account foundation

- [x] Return `name` and `username` consistently from both `/auth/login` and `/auth/me`. The current-user route queries all account fields using the ID supplied by session middleware.
- [x] Display a retry state when the initial session check fails, and keep startup loading feedback visible.
- [x] Add an authenticated profile/preferences API for the user's daily calorie goal and timezone.
- [x] Add a Profile form to enter and update a daily goal in kcal; do not assign an arbitrary calorie target to every user.
- [x] Require authentication and enforce user ownership on every new private API query.

Status on October 20, 2026: preferences GET/PATCH and the Profile goal/timezone form are implemented, including the native timezone picker. Preferences were checked in Postman during development; complete the separate [device verification checklist](docs/preferences.md#device-verification) for acceptance. Preference and meal-log queries use authenticated `req.user.id`; ownership remains a requirement for future private APIs.

## 2. Build manual calorie tracking first

- [x] Create a new migration for meal logs with user, meal name, meal category, serving quantity, kcal, source and eaten-at timestamp.
- [x] Add backend endpoints to create, list, edit and delete the signed-in user's meal logs.
- [x] Build a protected Add meal screen with name, breakfast/lunch/dinner/snacks, portion, total calories, native meal date/time and Save feedback.
- [x] Validate required fields, positive portions and nonnegative calorie values; clearly distinguish calories per serving from calories for the logged portion.
- [x] Display persisted meal history with focus refresh, pull-to-refresh, pagination and loading/empty/error states.
- [ ] Add calorie-goal history or daily goal snapshots before implementing historical summaries.
- [ ] Add a daily-summary API that calculates consumed and remaining calories from confirmed meal logs.
- [ ] Replace Home's sample calorie ring and today's meals with the signed-in user's actual data.
- [ ] Add edit/delete actions for logged meals and recalculate totals after each change.
- [ ] Support viewing past days and preserve their entries when a new day begins in the user's timezone.
- [ ] Show clear empty, loading and error states, plus an over-goal state when consumed calories exceed the goal.

Current scope: the API supports POST/GET/PUT/DELETE; mobile screens support creation and paginated history. Mobile edit/delete controls, selected-day filtering and over-goal presentation remain open. Entry/history display uses the device timezone; the saved Profile timezone does not yet drive diary-day boundaries. See [meal-log contracts and acceptance checks](docs/meal-logs.md). The form's local save lock prevents repeat taps and re-saving after confirmed success, but server idempotency for lost-response retries remains pending.

**Daily calculation**

```text
Consumed kcal = sum of confirmed meal entries for the selected local day
Remaining kcal = that day's calorie goal - consumed kcal
```

Keep calorie-goal history or a goal snapshot for each day so changing today's goal does not silently rewrite previous days. Derive totals from entries rather than permanently decrementing a counter. Creating a recipe or adding a planned meal does not count as eating it.

**Acceptance check:** adding an entry updates the summary once; editing it adjusts the difference; deleting it restores the previous total. Restarting the app preserves the result.

## 3. Add photo upload and camera capture

- [ ] Add an Add meal choice: Enter manually, Choose photo or Take photo.
- [ ] Install SDK-compatible image selection/capture support and configure the required permission messages.
- [ ] Handle permission denial, picker cancellation and unavailable camera access without losing the current form.
- [ ] Show a preview with Retake, Replace and Remove actions before uploading.
- [ ] Resize/compress images for upload and validate image type and size on the backend.
- [ ] Implement authenticated upload/storage access and associate each image with its owner.
- [ ] Provide upload progress, retry and cancellation states; clean up abandoned uploads and images when appropriate.

Start by reviewing [SDK 55 ImagePicker](https://docs.expo.dev/versions/v55.0.0/sdk/imagepicker/), which supports library selection and launching the system camera. Use [SDK 55 Camera](https://docs.expo.dev/versions/v55.0.0/sdk/camera/) if a custom camera view becomes necessary. These modules are not installed yet; select the approach before adding dependencies.

## 4. Estimate food and calories from photos

- [ ] Choose the food-recognition/AI service and nutrition-data source, comparing portion support, coverage and cost before integration.
- [ ] Build a backend analysis endpoint; keep provider credentials on the server.
- [ ] Define and validate the analysis response: identified foods, suggested portions, estimated kcal and fields that need user clarification.
- [ ] Support mixed dishes and multiple foods; ask about quantities, sauces or cooking details when they cannot be determined from the image.
- [ ] Build a review screen where users can correct food names, portions and estimated calories before logging.
- [ ] Recalculate the estimate when a serving amount changes and label photo-derived values as estimates.
- [ ] Handle non-food, unclear and unsupported images with retry and manual-entry options.
- [ ] Create the meal log only after confirmation; prevent duplicate entries from retries or repeated taps.
- [ ] Add analysis request limits, timeouts and useful failure messages.

**Acceptance check:** choosing or analyzing a photo alone does not change daily totals. Confirming the reviewed portion creates exactly one entry and updates the selected day's remaining calories.

## 5. Generate recipes from ingredients and meals

Confirmed scope: support **both** available ingredients and a meal name/photo.

- [ ] Create a recipe schema for owner, title, ingredients with quantities/units, steps, servings and nutrition estimates.
- [ ] Build an ingredient-entry form that supports adding, editing and removing ingredients and quantities.
- [ ] Add the alternative input flow: enter a meal name or choose/take a photo, then confirm the identified dish.
- [ ] Add optional preferences such as dietary choices, ingredients to exclude, preparation time and desired servings.
- [ ] Build a backend recipe-generation endpoint that validates inputs and the generated result.
- [ ] Display a suggested recipe with ingredient amounts, ordered steps, servings, preparation time and estimated kcal per serving.
- [ ] Treat a recipe generated from a meal photo as a suggestion users can review and edit.
- [ ] Let users change servings and recalculate ingredient quantities and nutrition consistently.
- [ ] Save generated recipes to the signed-in user's account and allow viewing and deleting them.
- [ ] Handle missing ingredients, incomplete generation and provider failures with clear correction/retry states.

**Acceptance check:** ingredients input and meal-name/photo input both produce a readable recipe. Users can save it, reopen it after restarting the app and change its serving size.

## 6. Connect Meals, Plan and Groceries

- [ ] Extend the implemented Meals history with saved recipes and category/search filters.
- [ ] Replace the Plan placeholder with a weekly calendar where saved recipes can be assigned to dates and meal categories.
- [ ] Add a Log as eaten action that asks for the actual portion and date before updating calories.
- [ ] Build Groceries from selected planned recipes; combine compatible quantities and allow manual items and checkboxes.
- [ ] Make Home, Profile and category-screen shortcuts open the corresponding implemented features.

Planned meals and generated recipes remain separate from the food diary until the user logs them as eaten.

## 7. Verify and prepare for release

- [ ] Test the daily calculation, portion scaling, goal history, over-goal display, timezone changes and dates around midnight.
- [ ] Test duplicate submissions, edit/delete recalculation, network failures and app restart during uploads/analysis.
- [ ] Test camera/photo flows on physical Android and iOS devices, including denied permissions and cancellation.
- [ ] Verify expired sessions and confirm one user cannot access another user's logs, photos or recipes.
- [ ] Evaluate photo estimates against meals with known ingredients and measured portions; improve review prompts where estimates vary.
- [ ] Add registration and the account-management flows required before public release; test with multiple independent accounts.
- [ ] Explain image use and retention before uploading photos to an external analysis service, and provide deletion controls.
- [ ] Test long meal names, large text, screen readers, keyboard overlap and smaller screens.
- [ ] Run lint, typecheck and backend checks, and add focused tests for calorie calculations and API ownership rules.
- [ ] Update the project guides as each feature moves from planned to implemented.

## Suggested implementation order

1. Finish device verification of the implemented goal/timezone Profile form and API.
2. Verify manual creation/history on devices, add mobile edit/delete actions, then implement goal history and the live daily summary.
3. Add photo capture/upload, estimation and confirmation.
4. Add recipe generation for both input flows.
5. Connect saved recipes, weekly planning and groceries.
6. Complete release checks.

The first usable milestone is **a user can set a goal, log a meal manually and see the correct remaining calories after reopening the app**. Build that before integrating AI so the calorie-tracking flow can be verified independently.

See [README.md](README.md) for the current implementation and [docs/troubleshooting.md](docs/troubleshooting.md) for verification commands.
