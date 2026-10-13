# Meal Map

An Expo SDK 55 / React Native mobile UI template for Meal Map. The Home dashboard uses a green palette, rounded cards, meal illustrations, and Poppins fonts. Screens and components use NativeWind 4 with Tailwind CSS 3; navigation uses Expo Router.

Home displays a featured dinner, a calorie and macro summary, and today's three meals. Five real tabs appear in this order: Meals, Plan, Home, Groceries, and Profile. The dark tab bar has a raised green Home button in the center. The other screens are placeholders; Profile currently uses an HTML element that needs conversion to React Native before mobile use.

The separate `/login` form validates its inputs and opens Home for preview. Meal values are hardcoded, and authentication, meal planning, and persistence remain to be implemented.

## Run locally

Install Node.js and npm, then run from the project root:

```sh
npm ci
npx expo start
```

Use the terminal options to open an Android emulator, iOS simulator on macOS, or web preview. Physical devices need a client compatible with Expo SDK 55. After changing Babel or NativeWind configuration, restart with `npx expo start --clear`.

## Edit the template

| File | Purpose |
| --- | --- |
| `src/app/(tabs)/index.tsx` | Home dashboard, logo, and search appearance |
| `src/app/(tabs)/_layout.tsx` | Five-tab navigator and custom center Home button |
| `src/app/(tabs)/meals.tsx`, `plan.tsx`, `groceries.tsx`, `profile.tsx` | Tab screen placeholders |
| `src/app/login.tsx` | Login layout and preview submit handler |
| `src/app/_layout.tsx` | Root stack for tabs and login, font loading, and global CSS |
| `src/components/featured-meal-card.tsx` | Featured dinner content and illustration |
| `src/components/nutrition-summary.tsx` | SVG calorie ring and macro bars |
| `src/components/todays-meals.tsx` | Sample meal list and thumbnails |
| `tailwind.config.js` | Colors, spacing, and Poppins font utilities |
| `assets/images/meals/` | Local meal illustrations |
| `assets/images/system/mealmap.png` | Home header logo |

See [template notes](docs/template.md) for styling and extension points. The retained Express/PostgreSQL backend is optional and disconnected from the UI; see [backend notes](docs/backend.md).

## Checks

```sh
npx expo lint
npx tsc --noEmit
```

Use `npx expo install <package>` when adding dependencies. Consult the [SDK 55 documentation](https://docs.expo.dev/versions/v55.0.0/) and [AGENTS.md](AGENTS.md) before changing Expo or React Native APIs.
