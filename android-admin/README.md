# OM Tiffin Admin for Android

First installable version (0.1.0), Android 8.0+ (API 26). A native Android shell opens the existing live admin website in WebView and adds a daily-work navigation bar. It shares the existing backend and stored records; there is no separate database or duplicated payment/billing logic. Website UI updates appear in the app as deployed. Data changes are available on the next data fetch/refresh; this version does not introduce real-time push synchronization.

Bottom navigation: Home, Customers, Scan, Billing and More. Pinned daily shortcuts: payment approval, announcements and Add Customer. More contains the remaining admin tools; the existing sidebar is retained. Navigation uses the existing SPA routes and warns before leaving unsaved meal entries. App-only mobile styling makes dashboard cards more compact.

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
