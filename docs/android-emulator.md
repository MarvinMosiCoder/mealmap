# Android emulator setup and recovery

Use Android Studio's Device Manager to create and start an Android Virtual Device. MealMap uses Expo SDK 55; open it with a compatible Expo client. See [Expo's emulator setup](https://docs.expo.dev/workflow/android-studio-emulator/).

## Start development

1. Start one emulator and wait for a responsive Android Home screen.
2. Check ADB from PowerShell:

   ```powershell
   adb devices -l
   ```

   The emulator should report `device`, not `offline`. Serial numbers vary.

3. Run the API with `npm run dev` inside `backend/`.
4. Set root `.env.local` to `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000`.
5. Run `npx expo start` at the project root, then press `a`.

If ADB is not on PATH, its usual Windows location is `$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe`. Confirm the actual SDK location in Android Studio.

## Check API access

On Windows:

```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/health'
```

Inside the emulator browser, open `http://10.0.2.2:3000/health`. Expected response includes `database: connected`. The emulator's `localhost` refers to itself, so use the [host alias](https://developer.android.com/studio/run/emulator-networking-address).

If the computer succeeds but the emulator fails, inspect the API address, configured port and local network/firewall rules. Expo's development server and the Express API are separate services.

## Offline or unresponsive device

Stop the emulator through Device Manager first. If ADB is unresponsive, run:

```powershell
adb kill-server
adb start-server
adb devices -l
```

Restart the intended AVD with Device Manager's Cold Boot option and wait for Android to finish loading. Restart Expo if its connection remains stale. Restarting ADB affects all attached devices; prefer doing this when no other device task is active.

Avoid Wipe Data as a routine recovery step: it clears emulator data and saved app sessions. Do not terminate every emulator process to resolve a single stuck AVD.

## What to inspect

Use the [login checklist](login.md#manual-verification), [preferences checklist](preferences.md#device-verification), [meal-log checklist](meal-logs.md#device-verification) and [Home summary checklist](daily-summary.md#device-verification) on the actual device. Check the raised Home button, safe-area spacing, long account names/emails, password keyboard behavior and whether logout, the final meal card and the fixed Add meal button can be reached above the tab bar. Exercise the timezone dropdown, date/time picker selection and cancellation, meal saving, history refresh and Home's live calorie count after returning. Test Home across midnight and foreground activation using the saved Profile timezone. Current app configuration requests a light interface; dark-mode testing needs an intentional configuration change first.

If a Fast Refresh update reports duplicate SVG views such as `RNSVGDefs`, fully close and reopen Expo Go first. This cleared the observed error on October 22, 2026, and the calorie ring rendered after reopening. See [SVG recovery steps](troubleshooting.md#duplicate-svg-view-registration) if it persists.
