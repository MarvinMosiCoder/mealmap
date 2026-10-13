# Template guide

## Screens and behavior

`src/app/index.tsx` defines `/`. It displays sample values: 1,245 kcal left of 2,300, a five-day streak, and 97/120g for each macro. The week indicator and macro bars are presentation placeholders. Breakfast, Lunch, Dinner, and Snacks cards use local illustrations; their plus symbols are visual placeholders.

`src/app/login.tsx` defines `/login`. It includes email/password fields, password visibility, keyboard handling, and local input validation. `handleLogin` calls `router.replace("/")` after checking the inputs. It sends no authentication request and stores no session. Back and Explore Meal Map open `/`.

The daily log header and profile button open `/login`. Log, Meals, and Top in `TemplateNav` are decorative, without additional routes.

## NativeWind setup

Use `className` utilities for layouts and appearance; application components do not use `StyleSheet`.

| File | Role |
| --- | --- |
| `tailwind.config.js` | Scans `src/`, includes the NativeWind preset, and defines theme tokens |
| `src/styles/global.css` | Tailwind base, components, and utilities directives |
| `babel.config.js` | Expo preset with NativeWind JSX integration |
| `metro.config.js` | NativeWind integration with the global CSS input |
| `nativewind-env.d.ts` | TypeScript support for NativeWind props |
| `src/app/_layout.tsx` | Imports CSS and loads four Poppins weights |

`MealCard` uses NativeWind's `cssInterop` to style `expo-image`. `CalorieRing` uses SVG drawing attributes for its gradient and patterned track; surrounding layout and labels use NativeWind classes.

## Extension points

- Edit sample data and the card list in `src/app/index.tsx`.
- Adjust theme tokens in `tailwind.config.js`; replace illustrations in `assets/images/meals/`.
- Connect `handleLogin` to authentication when ready.
- Add meal card actions and navigation when implementing those features.

Keep screens in `src/app/` and reusable code outside it. The `@/` alias points to `src/`; `@/assets/` points to the root `assets/` folder. Run lint and typecheck after changes.

The four food illustrations in `assets/images/meals/` were generated with the built-in imagegen tool. Their complete prompt set is saved in [asset-prompts.json](asset-prompts.json).
