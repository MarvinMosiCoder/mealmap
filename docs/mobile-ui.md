# Mobile screens, tabs and styling

The UI uses Expo SDK 55, NativeWind 4.2.7, Tailwind CSS 3.4 and Poppins. Authentication, preferences, manual meal creation/history and Home's calorie summary are connected to the backend. Home's featured dinner/today's meal cards and category ideas remain sample data. Home integration and the Meals layout were reviewed on October 22, 2026.

## Screen map

| Screen | Current behavior |
| --- | --- |
| Home | Public sample featured dinner; guests see login links, an invitation and clickable meal categories; members see a live calorie summary, sample today's meals and a notification icon |
| Meal category | Public inspiration screen with category artwork, four category chips, sample meal ideas, a tip and a Login/Plan action |
| Login | Brand header, food hero, email/password form, visibility toggle, focus styles, submit spinner, errors and social availability notices |
| Profile | Name/email, initials, saved goal/native timezone Picker with loading/retry and Save, shortcuts and logout |
| Meals | Your Meals heading, device-timezone note, persisted history with focus/pull refresh and Load more, plus a fixed Add meal button below the list |
| Add meal | Protected stack screen with name, category, servings, total kcal, native date/time, validation and Save feedback |
| Plan | Basic `plan` text placeholder |
| Groceries | Heading placeholder |

See [navigation.md](navigation.md) for route files, guards and access. Profile displays name/email and derives initials from up to two name words, using email when the name is empty. The username is available through AuthProvider but is not currently displayed. Both [account endpoints](login.md#account-fields) now return the same profile fields.

## Reusable components

| Component | File | Content |
| --- | --- | --- |
| `FeaturedMealCard` | `src/components/featured-meal-card.tsx` | Sample salmon dinner and artwork |
| `HomeDailySummary` | `src/components/home-daily-summary.tsx` | Today's API summary, loading/retry and focus/foreground/midnight refresh |
| `NutritionSummary` | `src/components/nutrition-summary.tsx` | Live SVG calorie ring, goal/remaining/over-goal state, meal count, date/timezone and Profile action |
| `TodaysMeals` | `src/components/todays-meals.tsx` | Three sample meals |
| `ExploreByMeal` | `src/components/explore-by-meal.tsx` | Four category cards; clickable when an `onSelect` callback is supplied |
| `MealCategoryContent` | `src/components/meal-category-content.tsx` | Category header, artwork, chips, sample ideas, tip and destination action |
| `LoginContent` | `src/components/login-content.tsx` | Login UI, form validation, password visibility and authentication submission |
| `ProfilePreferencesForm` | `src/components/profile-preferences-form.tsx` | Saved goal/timezone inputs, loading/retry, validation, saving and feedback |
| `MealLogForm` | `src/components/meal-log-form.tsx` | Manual meal draft, numeric validation, POST, save lock and feedback |
| `MealDateTimeField` | `src/components/meal-date-time-field.tsx` | Device-local native Android/iOS date/time selection |
| `MealLogList` | `src/components/meal-log-list.tsx` | Owned meal history, paging, refresh, state feedback and tab spacing |

Home's calorie card reads saved preferences and meal totals through the daily-summary API. `TodaysMeals` still contains three independent sample entries, so its cards may differ from the live meal count. The old sample macro bars were removed; macro totals are not implemented. The Meals tab displays real database entries. Search appearance, the notification bell (`notifications-outline`) and the `See plan` label are decorative. Profile shortcuts and guest Home's category cards navigate to their corresponding routes. Category meal ideas are informational rows without recipe-detail actions.

Category content lives in `src/data/meal-categories.ts`: each entry defines its ID, title, description, image, icon, colors, tip and two sample meal names. The supported IDs are `breakfast`, `lunch`, `dinner` and `snacks`. `ExploreByMeal` has its own card definitions, so update both lists when adding a category. The route `src/app/meal-category/[category].tsx` validates the ID and passes its data to the reusable content component.

`src/app/login.tsx` is a small route wrapper around `LoginContent`. The form prevents repeated submissions, validates empty/invalid email input and displays request failures. Google and Apple buttons show an availability notice; email/password remains the implemented login method. Login's Back control falls back to Home, and Explore meals links to public Home.

## Home daily summary

The signed-in Home branch renders `HomeDailySummary` keyed by `user.id`. Its helper reads the saved Profile timezone, derives today's date from the device clock in that timezone and requests the summary. The card displays the returned date/timezone, calories, applicable recorded goal and meal count. Ring progress is capped at one; over-goal amounts and the arc use red. Unset/unknown goals keep the consumed total visible and offer Open Profile.

Home reloads on focus, on foreground activation while focused and just after the returned day's end. Loads show a spinner; failures replace the card with an error and Try again. Unset timezone errors also offer Open Profile, and 401 responses request a session refresh. Obsolete responses are ignored and timers/listeners are cleaned up on blur. It has no polling or pull-to-refresh; return to Home to fetch external changes. See [the daily-summary guide](daily-summary.md) for date rules, lifecycle details and acceptance checks.

## Profile preferences

Profile places `ProfilePreferencesForm` after the account card and before Your kitchen. `src/lib/preferences.ts` supplies its GET/PATCH functions through the saved native session. The form loads on mount or load retry and has no default goal or timezone. An unset goal is blank and an unset timezone selects Not set. The native timezone Picker has seven starter options and preserves a saved value outside that shortlist.

Save converts a blank goal or Not set timezone to `null`, validates the integer goal and timezone length, and lets the backend validate the timezone name. Inputs and Save disable during PATCH; errors preserve the draft and success uses the returned saved values. Editing clears old feedback. A ref prevents repeated saves, and lifecycle guards ignore late responses after unmount.

The parent keys the form by `user.id` and uses `onSavingChange` to disable/guard Logout while saving. Logout disables the form. Preference 401 responses request a session refresh through AuthProvider. See [the preferences guide](preferences.md) for the API contract, current limits and device checklist.

## Manual meal entry and history

`src/app/add-meal.tsx` renders `MealLogForm` in a ScrollView with keyboard tap handling and automatic iOS keyboard insets. Name/category/serving/kcal inputs start unset; date/time starts at the current instant. Numeric values remain strings while editing. Kcal means the total for the entire portion, with no multiplication by servings at Save.

`MealDateTimeField` uses `@react-native-community/datetimepicker` 8.6.0: separate Android dialogs and a compact combined iOS picker, with cancellation preserving the selection. The category and Profile timezone pickers use `@react-native-picker/picker` 2.11.4. Date/time entry and history labels use the device timezone, and POST receives UTC through `toISOString()`. Home and the [daily-summary API](daily-summary.md) use the saved Profile timezone for day selection and boundaries.

Save validates the draft and sends it through `createMealLog`. A ref blocks rapid repeated taps; pending and successful forms disable their controls. Success displays `Meal saved.` and `Saved`, with no automatic navigation/reset. Failures keep the draft and enable retry. Use the native Back header and reopen Add meal for a new entry.

Meals uses a centered container up to 480 pixels wide, with a Your Meals heading, decorative leaf icon and device-timezone note. Its bounded FlatList sits above a fixed Add meal button. The list reloads 20 entries on focus and pull-to-refresh, supports Load more, merges rows by ID and ignores obsolete response versions. It includes loading, empty and error/retry feedback and is keyed by `user.id`. Mobile edit/delete actions, recipe details, past-day controls and Home's live meal list remain pending. The empty-list copy still says to add a meal above, although the action is now below the list. See [meal-log contracts and verification](meal-logs.md).

## Tabs and safe areas

The order is Meals, Plan, Home, Groceries, Profile. The Home control is a custom 64-pixel circle with a six-pixel secondary-color border and a 26-pixel icon. Side icons use filled/outline variants for focus. Active color is `#0C7762` and inactive color is `#6D8580`.

In `src/app/(tabs)/_layout.tsx`, `tabBarStyle` uses `position: "absolute"`, `backgroundColor: "transparent"`, zero border/elevation/shadow opacity and a fixed height of `96`. The layout computes `bottomPadding = Math.max(insets.bottom, 12)` and applies it inside that height. Side items start 32 pixels down; Home starts at the top. `tabBarBackground` draws a `bg-background` panel from 32 pixels down, with a thin top border. The transparent area above that panel allows screen content to show around the raised Home button. The bar hides for guests and while the keyboard is open.

Home/Profile/Meals safe areas include top, left and right. Because the bar overlays the screen, their ScrollView/FlatList content uses `useBottomTabBarHeight()` from `@react-navigation/bottom-tabs` and bottom padding:

```tsx
// Call alongside the other hooks, before any conditional return.
const tabBarHeight = useBottomTabBarHeight();

// Home: guests have no visible tab bar.
contentContainerStyle={{ paddingBottom: user ? tabBarHeight + 24 : 24 }}

// Profile and meal history: authenticated content.
contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
```

The extra `24` provides space above the bar when scrolled to the end. This belongs on the scroll content so the final button/footer can move clear of the overlay. Home/Profile still contain fixed bottom-padding classes as well; their inline padding supplies the active value. For future edits, keep bottom padding in one place. Apply equivalent spacing to new scrollable tabs. Add meal, Category and Login sit outside the tab navigator and do not need its height hook. See [React Navigation's tab-height guidance](https://reactnavigation.org/docs/bottom-tab-navigator/#usebottomtabbarheight) and [SDK 55 safe-area context](https://docs.expo.dev/versions/v55.0.0/sdk/safe-area-context/).

The current Meals screen additionally gives its fixed Add meal footer a `mb-[100px]` margin. This is separate from the list's dynamic bottom padding; verify available list height and button clearance on smaller screens and different safe-area insets.

Profile's ScrollView also sets `keyboardShouldPersistTaps="handled"` and `automaticallyAdjustKeyboardInsets`, which adjusts insets around the iOS keyboard. Save dismisses the keyboard. Verify keyboard overlap and scrolling to Save on both platforms; the tab overlay padding is still required.

## NativeWind configuration

| File | Responsibility |
| --- | --- |
| `babel.config.js` | Expo preset with NativeWind JSX import source and Babel preset |
| `metro.config.js` | Expo Metro configuration wrapped with `withNativeWind` |
| `tailwind.config.js` | Scans `src/`, defines colors and font families |
| `src/styles/global.css` | Tailwind base, components and utilities |
| `nativewind-env.d.ts` | Types for `className` and related props |
| `src/app/_layout.tsx` | Loads global CSS and four Poppins weights |

Use `className` for native views and `contentContainerClassName` for ScrollView content. Navigator options still use style objects. Existing `expo-image` components use `cssInterop` for classes. Keep complete conditional class strings in files under the Tailwind content paths.

| Theme token | Value |
| --- | --- |
| `primary` | `#0C7762` |
| `secondary` | `#7FC8AE` |
| `background` | `#F3F8F5` |
| `surface` | `#FFFFFF` |
| `text` | `#173B35` |
| `muted` | `#6D8580` |
| `border` | `#E4EEEA` |

Font utilities are `font-poppins`, `font-poppins-semibold`, `font-poppins-bold` and `font-poppins-extrabold`. Stop Expo and use `npx expo start --clear` after changing Babel, Metro or Tailwind configuration.

## Theme, splash and assets

`app.json` currently sets `userInterfaceStyle: "light"`. Login contains dark utilities and a `useColorScheme()` palette, but automatic theme following is not enabled in app configuration. Do not assume Chartineer's automatic appearance settings apply here.

The splash plugin currently sets a white background and no custom splash image. Root layout hides the splash after fonts load or fail. Session loading then renders a spinner and `Checking your session...` on the app background. Initial check failures display the error and Try again; see [startup loading and retry](login.md#startup-loading-and-retry).

The header logo is `assets/images/system/mealmap.png`. Meal images are in `assets/images/meals/`; the featured dinner currently reuses `lunch.png`. The `@/` alias maps to `src/`, and `@/assets/` maps to the root assets folder. Original generated food-image prompts remain in [asset-prompts.json](asset-prompts.json).
