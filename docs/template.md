# Template and artwork notes

MealMap has grown beyond its initial UI template: native authentication, session loading/retry, navigation guards, Profile preferences, manual meal creation/history, Home's daily calorie summary and category browsing are connected. See [mobile-ui.md](mobile-ui.md), [navigation.md](navigation.md), [login.md](login.md), [preferences.md](preferences.md), [meal-logs.md](meal-logs.md) and [daily-summary.md](daily-summary.md).

## Artwork

| Location | Use |
| --- | --- |
| `assets/images/system/mealmap.png` | Home header logo |
| `assets/images/meals/breakfast.png` | Sample breakfast artwork |
| `assets/images/meals/lunch.png` | Sample lunch and featured-card placeholder |
| `assets/images/meals/dinner.png` | Sample dinner artwork |
| `assets/images/meals/snacks.png` | Snacks category card and category hero |

The original food-image generation prompts remain in [asset-prompts.json](asset-prompts.json). That record covers the food illustrations, not the header logo. Image content may differ from the sample dish names.

## Sample content and extension points

- Edit the public/member Home branches in `src/app/(tabs)/index.tsx`.
- Edit featured meal text in `src/components/featured-meal-card.tsx`.
- Edit category copy, sample ideas and hero artwork in `src/data/meal-categories.ts`; keep the card definitions in `src/components/explore-by-meal.tsx` aligned with the supported IDs.
- Edit the login design and form behavior in `src/components/login-content.tsx`, with palette values in `src/styles/login-theme.ts`.
- Edit live calorie-card presentation in `src/components/nutrition-summary.tsx`; its `summary` prop supplies the values. Loading and refresh behavior live in `home-daily-summary.tsx`, with date/API helpers in `src/lib/daily-summary.ts`. The old sample macro bars were removed.
- Edit goal/timezone form behavior in `src/components/profile-preferences-form.tsx` and its API functions in `src/lib/preferences.ts`. Returning Home loads the saved timezone and applicable recorded goal.
- Extend the implemented meal form/list through `src/components/meal-log-form.tsx`, `meal-date-time-field.tsx` and `meal-log-list.tsx`, using `src/lib/meal-logs.ts` and the owned backend routes. Mobile edit/delete controls remain pending.
- Replace the three sample entries in `src/components/todays-meals.tsx` with owned entries for the same Profile-timezone day as the live summary. The current calorie ring already uses the [daily-summary API](daily-summary.md); the sample meal cards and featured dinner remain separate from it.
- Build the Plan and Groceries placeholders with native components and authenticated API endpoints.
- Add actions to the decorative search circle, notification bell and `See plan` label when those features exist.
- Keep Profile connected to AuthProvider; extend both login and session-restoration responses when adding account identity fields. Preferences use their separate GET/PATCH contract.
- Keep the transparent floating-tab background and bottom scroll padding aligned when changing navigation spacing.
- Change shared colors/fonts in `tailwind.config.js`; some icon and chart colors are defined directly in their components.

Reusable components and helpers belong outside `src/app/`. Use Expo Router for navigation and keep private screens inside the relevant guards. See [setup.md](setup.md) for running the app and [troubleshooting.md](troubleshooting.md) for current limitations.
