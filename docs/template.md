# Template guide

## Routes and navigation

The root layout in `src/app/_layout.tsx` loads global CSS and four Poppins weights, manages the splash screen, and defines a stack containing `(tabs)` and `login`. The initial screen is the tab group. Its content is centered within a maximum width of 480.

The `(tabs)` folder groups routes without adding a URL segment. `src/app/(tabs)/_layout.tsx` defines real Expo Router tabs in the following order, with Home selected initially:

| Tab | Route | Screen file | Current content |
| --- | --- | --- | --- |
| Meals | `/meals` | `src/app/(tabs)/meals.tsx` | Centered title |
| Plan | `/plan` | `src/app/(tabs)/plan.tsx` | Basic text placeholder |
| Home | `/` | `src/app/(tabs)/index.tsx` | Meal dashboard |
| Groceries | `/groceries` | `src/app/(tabs)/groceries.tsx` | Centered title |
| Profile | `/profile` | `src/app/(tabs)/profile.tsx` | HTML `<div>` placeholder |

The tab bar has a dark background, labels, bottom safe-area padding, and a custom raised green Home button using `PlatformPressable` and an Ionicons home icon. The other tabs currently have no custom icons. The bar hides when the keyboard opens.

Profile's `<div>` is a web element. Replace it with React Native components such as `View` and `Text` before using that screen on Android or iOS. Lint and typecheck do not verify native rendering.

`src/app/login.tsx` defines `/login` outside the tabs. It includes email/password fields, password visibility, keyboard handling, and local input validation. `handleLogin` calls `router.replace("/")` after checking the inputs. It sends no authentication request and stores no session. Back and Explore Meal Map open `/`. There is currently no link to `/login` from Home or the tab bar; the Profile tab opens `/profile`.

## Home dashboard

`src/app/(tabs)/index.tsx` places the Meal Map logo and wordmark, "Let's eat well today" heading, search appearance, and three reusable components inside a safe-area scroll view.

| Component | Source file | Sample content |
| --- | --- | --- |
| `FeaturedMealCard` | `src/components/featured-meal-card.tsx` | Tonight's dinner: Salmon grain bowl, 520 kcal, 38 g protein |
| `NutritionSummary` | `src/components/nutrition-summary.tsx` | 1,240 of 2,000 kcal; Protein 68 / 120 g, Carbs 140 / 220 g, Fat 38 / 65 g |
| `TodaysMeals` | `src/components/todays-meals.tsx` | Breakfast: Overnight oats with berries (340 kcal); Lunch: Chicken avocado salad (400 kcal); Dinner: Salmon grain bowl (520 kcal) |

The calorie ring shows 62% progress. Its progress, macro bar widths, labels, featured meal, and meal list are independent hardcoded values. Update them together when changing the sample data; the nutrition summary is not calculated from the listed meals.

The search circle, featured card, meal rows, and "See plan" text have no actions yet. The Plan tab exists, but "See plan" is not linked to it.

## NativeWind setup

Use `className` utilities for screen and component layouts and appearance. The current tab navigator also uses inline style objects in its options and a style array for `PlatformPressable`. No `StyleSheet.create` is used.

| File | Role |
| --- | --- |
| `tailwind.config.js` | Scans `src/`, includes the NativeWind preset, and defines theme tokens |
| `src/styles/global.css` | Tailwind base, components, and utilities directives |
| `babel.config.js` | Expo preset with NativeWind JSX integration |
| `metro.config.js` | NativeWind integration with the global CSS input |
| `nativewind-env.d.ts` | TypeScript support for NativeWind props |
| `src/app/_layout.tsx` | Imports CSS and loads four Poppins weights |

`FeaturedMealCard` and `TodaysMeals` use NativeWind's `cssInterop` to style `expo-image`. `NutritionSummary` draws its track and progress with `react-native-svg` circles; surrounding layout and labels use NativeWind classes.

The main theme tokens in `tailwind.config.js` are:

| Token | Color | Use |
| --- | --- | --- |
| `primary` | `#0C7762` | Featured card, highlights, and protein bar |
| `background` | `#F3F8F5` | Screen background |
| `surface` | `#FFFFFF` | Cards and search circle |
| `text` | `#173B35` | Main text |
| `muted` | `#6D8580` | Secondary text |
| `border` | `#E4EEEA` | Available border color |

The Poppins utilities are `font-poppins`, `font-poppins-semibold`, `font-poppins-bold`, and `font-poppins-extrabold`. Some logo, chart, and navigation colors are defined directly in their components, so editing theme tokens alone will not change every color.

## Assets

The Home header uses `assets/images/system/mealmap.png`. Meal artwork is stored in `assets/images/meals/`. The featured dinner currently reuses `lunch.png` as a placeholder. Today's meals use `breakfast.png`, `lunch.png`, and `dinner.png`; `snacks.png` is retained but unused. These illustrations may not match the displayed dish names.

The four food illustrations were generated with the built-in imagegen tool. Their complete prompt set is saved in [asset-prompts.json](asset-prompts.json). That prompt record covers the food illustrations, not the header logo.

## Extension points

- Edit the header and component order in `src/app/(tabs)/index.tsx`.
- Edit featured meal text, nutrition values, and the meal list in their respective component files.
- Build out the four placeholder tab screens, starting with native components for Profile.
- Adjust tab appearance and icons in `src/app/(tabs)/_layout.tsx`.
- Adjust theme tokens in `tailwind.config.js` and replace local artwork as needed.
- Add search and meal actions, link "See plan" to `/plan`, and connect `handleLogin` to authentication when implementing those features.

Keep screens in `src/app/` and reusable code outside it. The `@/` alias points to `src/`; `@/assets/` points to the root `assets/` folder. Run lint and typecheck after changes.

The optional authentication service is documented in [backend.md](backend.md). The frontend currently has no API calls, route guards, or persistent meal data.
