# Login, account details and saved sessions

The native app uses email/password login backed by PostgreSQL sessions. Home is public; the other tabs require authentication. See [navigation guards](navigation.md).

## Implementation map

| File | Responsibility |
| --- | --- |
| `src/app/login.tsx` | Login route entry; renders `LoginContent` |
| `src/components/login-content.tsx` | Form, input focus styles, password visibility, submit state and feedback |
| `src/lib/auth.ts` | HTTP requests, native token storage, `AuthUser`, exported `ApiError` and `authenticatedRequest()` |
| `src/lib/preferences.ts` | Preference types and authenticated GET/PATCH client functions |
| `src/lib/meal-logs.ts` | Typed authenticated create/list/update/delete helpers |
| `src/components/profile-preferences-form.tsx` | Preference loading/retry, editing, Save and feedback |
| `src/providers/auth-provider.tsx` | Shared user state, startup/resume checks, sign-in and sign-out |
| `src/app/_layout.tsx` | Font/splash startup, session loading/retry, signed-out Login and signed-in Add meal guards |
| `src/app/(tabs)/_layout.tsx` | Private tab guards and bar visibility |
| `src/app/(tabs)/profile.tsx` | Account display, preferences, shortcuts and save/logout coordination |
| `backend/routes/auth.routes.mjs` | Login, current-user and logout handlers |
| `backend/auth-middleware.mjs` | Validates sessions and populates `req.user` |

## Create a test account

Apply the [migrations](migrations.md) first. Then run this in PowerShell inside `backend/`:

```powershell
$env:SEED_EMAIL = Read-Host 'Test account email'
$seedPasswordInput = Read-Host 'Test password (15 or more characters)' -AsSecureString
try {
  $env:SEED_PASSWORD = [System.Net.NetworkCredential]::new('', $seedPasswordInput).Password
  node --env-file=.env seed-user.mjs
} finally {
  Remove-Item Env:SEED_EMAIL, Env:SEED_PASSWORD -ErrorAction SilentlyContinue
  $seedPasswordInput.Dispose()
}
```

The current seed assigns `Test User` and `testuser` to name and username. It inserts email and the generated password hash. Expected output is `Test account created.` Existing email conflicts produce `Account already exists; password unchanged.` This is not a password reset command.

The seed accepts at least eight characters, while its validation message says fifteen. Using fifteen or more satisfies both; aligning the rule and message remains cleanup.

## Sign-in and session restoration

1. The screen calls `useAuth().signIn(email, password)`.
2. The helper posts to `/auth/login` and stores the returned token in SecureStore.
3. AuthProvider stores the returned account in `user`.
4. Navigation guards update. Login currently also calls `router.replace("/")` after success; the root guard can already remove Login automatically.
5. On a later launch, `getCurrentUser()` reads the token and requests `/auth/me`. AuthProvider also checks the session when a signed-in app returns from the background.

A 401 during restoration removes the saved token and returns `null`. Other errors populate the provider's `error` without clearing an existing user. Requests time out after 15 seconds; network failures display the connection error from the auth helper.

## Startup loading and retry

The root layout keeps the native splash visible until fonts load or fail, then mounts AuthProvider. `RootNavigator` reads `user`, `isLoading`, `error` and `refreshSession`:

- While `isLoading` is true, it shows a green spinner and `Checking your session...` instead of mounting the navigator.
- If the check fails and there is no user, it shows `Could not check your session`, the provider error and a Try again button.
- Try again calls `refreshSession()`, clearing the old error and showing the loading state until that attempt finishes.
- No saved token, or a 401 from `/auth/me`, opens the public routes as a guest. These are signed-out results rather than retry errors.

On resume, `refreshSession(false)` checks a signed-in user's session without replacing the screen with startup loading. A connection failure keeps that user in memory; the root retry screen only appears when `error && !user`. The provider prevents overlapping session checks, login and logout requests.

## Account fields

`AuthUser` declares `id`, `email`, `name` and `username` as strings. Both `/auth/login` and `/auth/me` return all four fields. IDs are converted to text in SQL.

The middleware validates the saved session and selects only the ID and email into `req.user`. The current-user handler then queries the public account fields using `req.user.id`:

```sql
SELECT id::text, email, name, username
FROM public.users
WHERE id = $1
```

It returns `{ user: result.rows[0] }`, or 401 if that account no longer exists. This additional query is part of the current implementation. Returning `{ user: req.user }` alone would omit name and username. Neither endpoint exposes `password_hash`; keep explicit public fields when extending the contract. TypeScript does not validate JSON at runtime, so verify both responses when changing account details.

## Profile and logout

Profile displays `user.name` and `user.email`; its initials derive from up to two name words with an email fallback. It does not currently render the username, although `user.username` is available from both account endpoints.

The embedded [preferences form](preferences.md#profile-form-behavior) uses the same native session token through `authenticatedRequest()`. It loads/saves the goal and timezone separately from `AuthUser`. The helper throws `ApiError` with status 401 for a missing token and preserves error statuses from the server; a preferences 401 asks AuthProvider to `refreshSession(false)`. Token removal and user-state changes still happen through the existing session-restoration flow.

The [meal-log form and history](meal-logs.md#mobile-creation-and-history) reuse that helper and request a session refresh on 401. Add meal has its own authenticated root-stack guard; Meals remains a private tab and keys its list by account ID. The HTTP helper handles a successful 204 before attempting JSON parsing, which supports logout and meal deletion.

The Profile handler awaits `signOut()`, then calls `router.replace("/login")`. Sign-out calls the API, removes the token and clears provider state; private tab guards remove authenticated screens. The explicit replacement selects Login as the logout destination. The button disables repeated requests, displays a spinner and renders failures. A network/server failure keeps the local session so the user can retry; a logout 401 permits local cleanup.

Logout is also disabled and guarded while a preference save is pending. The form reports saving through `onSavingChange` and is disabled while logout is pending.

SecureStore is the native storage implementation. Its existing key is `chartineer.session`; changing that key requires deliberate session migration or a new login. Browser authentication needs a separate implementation. See [SDK 55 SecureStore](https://docs.expo.dev/versions/v55.0.0/sdk/securestore/).

## Manual verification

| Action | Expected result |
| --- | --- |
| Open Home without a session | Guest invitation and no tab bar |
| Launch with a saved token and an unreachable API | Session spinner, then error and Try again |
| Restore API access and tap Try again | Spinner while retrying, then the appropriate authenticated/guest routes |
| Submit empty or incorrect credentials | Visible error; no authenticated navigation |
| Sign in with the seeded account | Home shows nutrition/meals and the tab bar |
| Open Profile | Name/email, initials, goal/timezone preferences, shortcuts and logout |
| Save preferences | Feedback appears; Logout is disabled during the save. Complete the [device checklist](preferences.md#device-verification) for persistence and error paths |
| Fully reopen the app or background/resume | Session is checked; name and username remain in the restored account |
| Log out from Profile | Login opens and private tabs are removed |
| Follow a private route while signed out | Private screen remains unavailable; public Home is the guard fallback |
| Restore an expired or revoked token | Account is cleared after the API returns 401 |

Google/Apple login, registration, password reset and editing name/email/username are not implemented. Goal/timezone editing is available through Profile preferences. The social buttons display an availability notice directing users to email/password login.
