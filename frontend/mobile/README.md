# Disaster Connect mobile

## Launch flow

Logo screen → Onboarding 1 → Onboarding 2 → Login ↔ Register → Home.

The logo is displayed during session restoration. Onboarding is shown once per installation and can be skipped. Registration creates an account and returns to Login with the email prefilled. Signed-in users reach the four tabs: Home, Map, Reports, Profile. Hardware Back cannot return to login after authentication. Profile includes logout.

## Authentication structure

```text
src/screens/auth/
  LogoScreen.js
  OnboardingScreen.js  Used by two separate navigation screens
  LoginScreen.js
  RegisterScreen.js
src/components/AuthUI.js Shared authentication layout and inputs
src/context/AuthContext.js Restore/login/logout and current user state
src/services/auth.js Authentication API calls
src/services/sessionStorage.js SecureStore token storage
src/services/api.js Central Axios instance and Bearer-token handling
src/utils/authValidation.cjs Mobile form validation
src/navigation/AppNavigator.js Conditional onboarding/authenticated routes
```

The signed-in user's name appears on Home and their account details appear in Profile. Tokens are kept in Expo SecureStore, not AsyncStorage. Passwords are never persisted. AsyncStorage is used for the onboarding flag and separate per-account report receipts. SecureStore handles session storage on Android/iOS; this authentication implementation is intended for Expo Go on a physical phone.

Session restoration checks `GET /auth/me`. Expired/revoked sessions return to Login. Connectivity failures show a retry screen and retain the stored token instead of treating network failure as invalid credentials. Logout contacts the backend to revoke the session, then clears local authentication. If the backend cannot be reached, logout reports an error so the server session is not silently left active.

## Run

Start the backend in another terminal and verify the LAN IPv4 address in `src/services/api.js` matches your computer. Keep the phone on the same network.

```powershell
cd D:\smart-disaster-management-system\frontend\mobile
npx expo start --clear
```

Use Expo Go to scan the QR code. After adding SecureStore, restart Metro rather than relying only on Fast Refresh.

## Report integration

Submission calls the authenticated `POST /reports` endpoint. The client no longer sends a temporary citizen ID. Report receipts are saved under the actual account ID; switching accounts resets in-memory report state and isolates persisted receipts. Earlier test-citizen receipts are not attributed to newly registered users.

My Reports and map markers still reflect receipts saved on this device. The backend does not yet provide report-list/detail retrieval or live verification updates. The current profile statistics are based on those receipts. Live alerts remain unavailable states, not fake warnings or an unverified all-clear. Optional photos accept hosted image URLs; gallery/camera uploads remain pending.

## Phone checks

1. First launch: logo, two onboarding screens, then Login. Confirm Skip works.
2. Register using your own name/email/password. Check required-field and confirm-password errors.
3. Log in with a wrong password, then the correct password. Confirm Home shows your name.
4. Submit a report with GPS coordinates; confirm it appears in My Reports and Atlas with your user ID.
5. Restart Expo Go and confirm the session restores while the backend is running.
6. Log out and confirm hardware Back cannot reopen Home.
7. Register/log in as a different citizen. Confirm the first account's report receipts are not shown.
8. Stop the backend and check connection errors and session restoration retry.

Live phone registration/report submission creates real Atlas records; automated tests do not.

## Checks

```powershell
npm run lint
npm test
npm run test:coverage
```

Logic tests cover form validation, UTF-8 password boundaries, report merging/timelines and account-isolated device storage. Coverage applies to these tested helper/service files, not rendered screens, native storage or map interactions. Android bundle compilation checks imports; phone checks remain necessary.

## Sources

Implementation follows [React Navigation's authentication flow](https://reactnavigation.org/docs/auth-flow/) and [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/). Maps use [Expo SDK 57 map support](https://docs.expo.dev/versions/v57.0.0/sdk/map-view/).

Emergency contacts were checked against the [DMC 117 service](https://117.dmc.gov.lk/) and [1990 Suwa Seriya](https://www.1990.lk/) on October 8, 2026. Preparedness information links to [Red Cross kit guidance](https://www.redcross.org/get-help/how-to-prepare-for-emergencies/survival-kit-supplies.html).
