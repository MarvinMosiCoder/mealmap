# Template and artwork notes

MealMap has grown beyond its initial UI template: native authentication, session loading/retry, navigation guards, Profile and category browsing are connected. The current implementation is documented in [mobile-ui.md](mobile-ui.md), [navigation.md](navigation.md) and [login.md](login.md).

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
- Edit calorie/macro values in `src/components/nutrition-summary.tsx` and meal entries in `src/components/todays-meals.tsx`. These are independent sample values, not live calculations.
- Build the Meals, Plan and Groceries placeholders with native components and authenticated API endpoints.
- Add actions to the decorative search circle, notification bell and `See plan` label when those features exist.
- Keep Profile connected to AuthProvider; extend both login and session-restoration responses when adding account fields.
- Keep the transparent floating-tab background and bottom scroll padding aligned when changing navigation spacing.
- Change shared colors/fonts in `tailwind.config.js`; some icon and chart colors are defined directly in their components.

Reusable components and helpers belong outside `src/app/`. Use Expo Router for navigation and keep private screens inside the relevant guards. See [setup.md](setup.md) for running the app and [troubleshooting.md](troubleshooting.md) for current limitations.
