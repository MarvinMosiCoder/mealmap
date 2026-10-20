# Navigation and authentication guards

MealMap uses Expo Router from `src/app/`. Route group `(tabs)` organizes files without adding a URL segment. Home is `/`, not `/index`.

## Available routes

| Route | File under `src/app/` | Access |
| --- | --- | --- |
| `/` | `(tabs)/index.tsx` | Public Home |
| `/login` | `login.tsx` | Signed-out users |
| `/meal-category/[category]` | `meal-category/[category].tsx` | Public category inspiration; breakfast, lunch, dinner or snacks |
| `/meals` | `(tabs)/meals.tsx` | Authenticated users |
| `/add-meal` | `add-meal.tsx` | Authenticated users; native header, outside the tab navigator |
| `/plan` | `(tabs)/plan.tsx` | Authenticated users |
| `/groceries` | `(tabs)/groceries.tsx` | Authenticated users |
| `/profile` | `(tabs)/profile.tsx` | Authenticated users |

## Root guard

`RootLayout` loads fonts before mounting AuthProvider and `RootNavigator`. The child reads the shared session and displays a spinner while it is checked. An error with no user displays the retry screen; Try again calls `refreshSession()`. Once ready, it registers public `(tabs)` and the public category route, Add meal under `guard={!!user}`, and Login under `guard={!user}`. See [startup loading and retry](login.md#startup-loading-and-retry).

```tsx
<Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false }}>
  <Stack.Screen name="(tabs)" />
  <Stack.Screen name="meal-category/[category]" />
  <Stack.Protected guard={!!user}>
    <Stack.Screen
      name="add-meal"
      options={{ headerShown: true, title: "Add meal" }}
    />
  </Stack.Protected>
  <Stack.Protected guard={!user}>
    <Stack.Screen name="login" />
  </Stack.Protected>
</Stack>
```

After authentication, Login becomes unavailable and its navigation history entries are removed. Expo Router falls back to an available route, normally Home in this setup. The login handler currently also calls `router.replace("/")`; that is redundant with this guard. See [Expo protected routes](https://docs.expo.dev/router/advanced/protected/).

## Tabs and visibility

The tabs are ordered Meals, Plan, Home, Groceries and Profile. The existing `Tabs.Protected guard={!!user}` groups wrap Meals/Plan and Groceries/Profile. Home stays outside both groups. This preserves its public route and the centered Home button.

The separate style `display: user ? "flex" : "none"` hides the whole tab bar for guests. Guards enforce route availability even if a guest follows a direct link. Hiding the bar by itself would leave those routes accessible.

On logout, `user` becomes `null` and private tabs are removed. Profile's handler explicitly calls `router.replace("/login")` after awaiting `signOut()`, selecting Login as the destination. Home remains available to guests. Profile also has a defensive signed-out `<Redirect href="/login" />`; the handler's explicit navigation expresses the desired logout destination.

The bar uses absolute positioning and a transparent background around the raised Home button. Its lower background panel starts 32 pixels down. Home, Profile and the Meals FlatList account for the overlay with `useBottomTabBarHeight()` and bottom scroll padding. See [tab spacing](mobile-ui.md#tabs-and-safe-areas) before adding another scrollable tab.

The preferences form is embedded in `/profile`; it adds no mobile route. Its `/profile/preferences` path is an Express API endpoint. A preference 401 triggers `refreshSession(false)`, and existing guards respond if AuthProvider clears the session. Only deliberate logout explicitly selects `/login`. Profile also guards Logout while preferences are saving; see [preferences](preferences.md#profile-form-behavior).

## Meal entry and history

Meals links to `/add-meal` through `Link asChild` around a Pressable. Add meal belongs to the root authenticated stack, not the signed-out Login group. Its native header provides Back, it has no tab bar, and its safe area covers left/right/bottom while the header handles the top.

A successful Save stays on the form with `Meal saved.` and locked inputs; it does not navigate automatically. Back returns to the previous route, normally Meals. `MealLogList` uses `useFocusEffect` to reload the first page when Meals regains focus, and exposes pull-to-refresh and Load more. The parent keys the list by account ID to reset local data when accounts change. See [meal logs](meal-logs.md#mobile-creation-and-history).

Both the form and list request `refreshSession(false)` on a current request's 401. The root guard removes Add meal and private tabs when the session is cleared. Backend `/meal-logs` paths are API endpoints; they are not Expo screen routes. There are no mobile edit/detail routes yet.

## Category browsing

Guest Home renders `ExploreByMeal` with an `onSelect` callback that pushes `/meal-category/[category]` and the selected category ID. The route checks that ID against `src/data/meal-categories.ts`; invalid IDs redirect to `/`.

`MealCategoryContent` provides its own header, so the screen overrides the root's default category header with `headerShown: false`. It sits outside `(tabs)` and does not display the tab bar. Category chips replace the current category route rather than adding a history entry for every switch. Back returns to the previous screen when available, or replaces with Home. The bottom action links guests to Login and authenticated users to Plan.

## Extending navigation

Keep route files in `src/app/` and reusable components, providers and helpers outside it. Adding a file inside `(tabs)` can introduce another route, so explicitly decide its access and tab options. Wrap a private screen in a protected group once; avoid duplicate screen declarations.

Use `Link` for navigation controls and import router helpers from `expo-router`. Guard conditions must come from AuthProvider, not a second screen-local login flag. Call all React hooks before conditional returns.

## Backend access

Mobile guards control navigation. The backend's `requireAuth` validates a saved session and must protect each private API endpoint. Feature queries must also enforce ownership using authenticated `req.user.id`. Read [backend.md](backend.md) before adding data endpoints.
