# OM Tiffin Admin for Android

Current preview version (0.3.0, Android version code 3), Android 8.0+ (API 26). A native Android shell opens the existing live admin website in WebView and adds a daily-work navigation bar. It shares the existing backend and stored records; there is no separate database or duplicated payment/billing logic. Website UI updates appear in the app as deployed. Data changes are available on the next data fetch/refresh; this version does not introduce real-time push synchronization.

The APK has a separate daily home screen: meals recorded today, collections today, scan action, six daily tools, payment approvals, tiffin requests, inbox and business overview. Revenue reports retain the existing dashboard filters. One bottom navigation row provides Home, Customers, Scan, Billing and More. More groups every existing admin tool and includes search, refresh and sign out. The website sidebar is hidden inside the APK; its routing remains available to the navigation bridge. Navigation retains the unsaved-entry warning.

App-only presentation lives in `app/src/main/assets/app-workspace.js` and `app-workspace.css`, installed by `MainActivity`. Home values come from the existing rendered analytics, with loading/error states and no separate calculation or API writes. The app restyles login, forms, lists and reports. No frontend or backend files were changed for this redesign; the ordinary website keeps its own presentation.

Admin login and logout use the existing website session. Public and customer portal routes are excluded from app navigation. Camera access is requested only for scanning. PDF bill/receipt downloads pass existing canonical bytes to Android's document picker; native printing and file selection are supported. The native message bridge accepts only the trusted website's main frame. HTTPS certificate errors are blocked; cleartext access and device/cloud backups are disabled. No credentials are embedded in the APK.

## Build

Install JDK 17 or 21 and Android SDK platform/build tools 35, set JAVA_HOME and ANDROID_HOME, then run from this directory:

```powershell
.\gradlew.bat assembleDebug testDebugUnitTest lintDebug
```

Output: app/build/outputs/apk/debug/app-debug.apk. The Gradle 8.11.1 wrapper distribution is checksum-pinned. Release signing keys are intentionally not stored in Git. The delivered APK is a debug-signed test version, not a Play Store release.

## Validation

Build, three native route/security tests and Android lint pass (zero errors; compatibility, translation and drawing warnings remain). Browser fixtures verify native route observation, PDF byte transfer and print callbacks. A screenshot instrumentation runner uses local frontend build assets and intercepted demo APIs; it sends no live messages or payments. Run a frontend production build first, then assembleDebugAndroidTest. Screenshots are explicitly marked as demo data. Physical-phone login, camera scanning and document-picker testing remain required before a release.

References: [Android WebView messaging](https://developer.android.com/develop/ui/views/layout/webapps/native-api-access-jsbridge), [camera permission requests](https://developer.android.com/reference/android/webkit/PermissionRequest).

## Expo EAS internal distribution

Project: https://expo.dev/accounts/om-tiffin-admin/projects/om-tiffin-admin

Run `npx eas-cli@latest build --platform android --profile preview` from android-admin. This uses a custom EAS workflow to build the existing native Java app; no Expo Go runtime or business-logic migration is needed. The preview APK is debug-signed for test installation. The custom workflow runs native unit tests and lint before uploading the APK. The first submitted cloud build is https://expo.dev/accounts/om-tiffin-admin/projects/om-tiffin-admin/builds/eb91201d-ef38-4b2c-8a32-1ee5600e3a22 (queued at submission).


## UI redesign verification â€” 9 October 2026

- EAS build `16069ed6-ccee-4083-9de7-99dc71eb34d5`: FINISHED. `assembleDebug`, `testDebugUnitTest` and `lintDebug` passed; 47 tasks executed.
- Downloaded APK manifest verified: `com.omtiffin.admin`, version `0.2.0`, version code `2`. Packaged UI assets match the reviewed source exactly.
- Browser checks against local React screens and intercepted demo APIs passed: home analytics mapping, navigation, report filters, notifications, refresh, logout, website isolation, no business API writes, home widths 320/360/390/430, and mobile Customers, Daily Entry, Billing, Payments, Barcode Entry, Add Customer and Announcements. Screenshots show the WebView area using demo data; they are not physical-phone screenshots.
- Physical-phone camera, native More dialog, keyboard and PDF picker remain to be checked on the device.
- The new preview APK's debug signing certificate differs from the earlier preview. Uninstall the old preview before installing this one, then sign in again. These unsigned-credential preview workflows do not guarantee a stable update signer; establish a persistent release signing configuration before production distribution.

Build: https://expo.dev/accounts/om-tiffin-admin/projects/om-tiffin-admin/builds/16069ed6-ccee-4083-9de7-99dc71eb34d5

APK SHA-256: `d899768cc924dca67bfd8d22508e57a0ac573c561b744daa334f57e548d75190`


## Phone unlock — version 0.3.0

Sign in with the existing admin credentials once, then accept **Use your phone to unlock?**. Android handles fingerprint or the device's PIN/pattern/password. The app never receives or stores a phone PIN, biometric data or account password. More contains a setting to enable/disable phone unlock. A secure phone screen lock must already be configured.

The existing server JWT is encrypted using AES-GCM and a user-authentication-required Android Keystore key. Only IV/ciphertext are persisted in private preferences; backups remain disabled. The Keystore authentication window is 30 seconds, and the application separately requests Android authentication each time its remembered workspace is reopened. Strong biometrics or device credentials are accepted on Android 11+; older devices use strong fingerprint where available, with a phone credential fallback.

The server's token lifetime is not extended. Expired, nearly expired, missing-expiry or malformed tokens cannot be remembered/restored. Existing server API authentication remains authoritative for signature/account validity. Explicit sign out waits for native remembered-session deletion before running the existing React sign-out handler. A server 401/token removal clears the native session. On cancellation the workspace stays locked; account-password login is always available. Cold-start restoration only populates the WebView after successful phone authentication; backgrounding cancels a pending restoration. File/document picker round trips preserve the already-authorized action.

Verification: final EAS build **bfdd6289-7023-4d39-a943-cb9b381eb7d4** is FINISHED; native unit tests (including token expiry/malformed input), assembleDebug and lintDebug passed. Browser session tests cover token capture, logout/clear, native-before-web sign-out acknowledgment, duplicate installation and unrelated storage exclusion. Existing app UI/navigation checks also passed with the new session hook. APK manifest version 0.3.0/code 3, bundled JS/CSS/session assets and native authentication classes were checked after downloading.

Physical-phone tests are still required: first enrollment, fingerprint success/failure/cancel, phone PIN fallback, background/reopen and cold restart, sign out, screen-lock removal, and expired-session fallback. These were not represented as hardware-tested results.

The preview's signer differs from version 0.2.0. Uninstall the earlier preview and install this APK, then sign in and enable phone unlock. A stable release signing configuration is still needed for future production updates without uninstalling.

Build: https://expo.dev/accounts/om-tiffin-admin/projects/om-tiffin-admin/builds/bfdd6289-7023-4d39-a943-cb9b381eb7d4

APK SHA-256: `e91d781faf9aaa15e260af49628d42fec661cbb1465091e5be10c7f9826ccea6`

Platform references: https://developer.android.com/identity/sign-in/biometric-auth and https://developer.android.com/reference/android/security/keystore/KeyGenParameterSpec.Builder

## 0.3.1 startup investigation (2026-10-09)
- Existing 0.3.0 APK reached the real production login on Android 15 emulator / WebView 124. Phone-specific white loading screen remains unconfirmed.
- A transient TLS connection reset appeared in emulator logs; live Chrome login and assets loaded successfully. This does not establish the phone's root cause.
- Startup now goes directly to canonical www host (avoids redirect); both HTTPS origins retain native bridge trust.
- Main-frame loading has a 30-second watchdog and explicit retry. Main-frame network/HTTP/SSL errors show a reconnect message; SSL verification remains enforced.
- Version 0.3.1 (4): local assembleDebug, testDebugUnitTest, lintDebug passed.
- Offline Android emulator test displayed network error -2 and TRY AGAIN.
- Expo upload was blocked by automatic approval review pending explicit source/destination approval. No new hosted APK URL exists yet.
- Local debug APK uses local signing; it cannot update an APK signed with a different EAS debug certificate. Preview reinstall resets local login/phone-unlock setup; server data is unaffected.

## Expo 0.3.1 distribution verified
User explicitly approved uploading android-admin build source to Expo EAS om-tiffin-admin.
Build f44ba516-f50f-45e0-b873-065618704ce9 FINISHED; version 0.3.1 (4).
APK: https://expo.dev/artifacts/eas/N4dJDyxh1QODdDEMkSZ8bCJgZn7TJ39Pa0Q2vXHGfRc.apk
Downloaded artifact manifest/assets/authentication classes verified.
SHA256: ff7e0546fbad3d5e14c0e4c0b2c3feb5652ac3650ffc05a4578d893ed75f52e8
Signer differs from 0.3.0, so direct update is incompatible; preview reinstall requires login and phone unlock enrollment again. Phone-specific startup root cause remains unconfirmed; local equivalent 0.3.1 login and offline reconnect were verified in Android emulator.
