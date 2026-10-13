# Meal Map

An Expo SDK 55 / React Native UI starter with a login form and daily log inspired by the supplied reference. Layouts use NativeWind 4 and Tailwind CSS 3 utilities.

The daily log displays sample calories, macros, a week indicator, and four meal cards. The login form checks its inputs and opens the daily log for preview. You can implement authentication, food logging, and persistent data when ready.

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
| `src/app/index.tsx` | Daily log layout and sample values |
| `src/app/login.tsx` | Login layout and preview submit handler |
| `src/app/_layout.tsx` | Expo Router stack, font loading, and global CSS |
| `src/components/` | Calorie ring, meal cards, and decorative bottom navigation |
| `tailwind.config.js` | Colors, spacing, and Poppins font utilities |
| `assets/images/meals/` | Local meal illustrations |

See [template notes](docs/template.md) for styling and extension points. The retained Express/PostgreSQL backend is optional and disconnected from the UI; see [backend notes](docs/backend.md).

## Checks

```sh
npx expo lint
npx tsc --noEmit
```

Use `npx expo install <package>` when adding dependencies. Consult the [SDK 55 documentation](https://docs.expo.dev/versions/v55.0.0/) and [AGENTS.md](AGENTS.md) before changing Expo or React Native APIs.
