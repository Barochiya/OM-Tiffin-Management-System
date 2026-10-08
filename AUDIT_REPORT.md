# Website and admin audit

Implemented /admin dashboard alias and session-safe authentication redirects; professional notifications and confirmations; normalized API URLs; functional bill PDF download/print/WhatsApp controls; canonical server-rendered receipt PDF for mobile and desktop; Gujarati receipt fonts; correct price response/loading guards; resolved barcode display; IST default business dates; Both-menu Lunch/Dinner validation; reusable professional invoice presentation and refined exported PDF styling.

Billing calculations, stored amounts, meal pricing, payment bank/UPI details and confirmation decisions are preserved. No migration, seeding or live data changes were performed. Existing local backup/reference files are excluded from the commit.

Validation: frontend production build passed; lint has no errors (existing warnings remain). Offline audit: 16 groups including 91 service operations under four API-base formats, authorization, PDF generation and unchanged data. Isolated JSX flow tests: 7 groups and 125 internal links. Headless Chrome: 10 groups including 46 route smoke checks, session handling, confirmations, desktop/mobile receipts and invoice layout. Fixture PDF render review verified Gujarati glyphs, multipage invoice last-day rows and stored totals.

Tests run with intercepted/stubbed APIs. Live MongoDB, Razorpay transactions and actual WhatsApp delivery were not exercised. External service availability and deployed production behavior require deployment verification.

## Repeat checks

Install frontend/backend dependencies first. From repository root: npm run test:audit and npm run test:flows. Browser tests require Playwright with Chrome installed; npm run test:browser. PLAYWRIGHT_MODULE can point to an available Playwright installation. AUDIT_ARTIFACT_DIR can point to a writable fixture-output directory. Run tests from a directory without a real .env; dummy test credentials and blocked database writes are used by the offline audit. Never run backend/server.js as part of these checks.

## System-wide UI and loading refinement

A shared scoped design system now styles every admin/customer route, all public website pages, cart/order screens, login/account setup and both account-recovery pages. It unifies navy/blue branding, sidebar active states, readable cards and tables, form focus states, responsive spacing and receipt presentation. Authentication screens add a desktop brand panel with the original form controls intact. Invoice/receipt export logic and all backend business rules remain unchanged.

Performance: page modules load by route with a skeleton fallback. The main production JavaScript chunk decreased from 2,817.34 kB (739.81 kB gzip) to 302.75 kB (94.79 kB gzip). Billing's route chunk is now 32.10 kB (9.70 kB gzip); its 982.64 kB PDF renderer loads only when export is requested. These are bundle measurements, not claims about live server response times. Concurrent settings reads are shared per session only while pending; completed/failed requests expire immediately, preserving fresh reads and retries.

Validation: production build passed, lint has zero errors with existing warnings. All 46 defined non-login routes rendered on desktop and mobile Chrome with intercepted API fixtures; authentication and existing action tests also passed. Final targeted reviews covered nine representative routes including recovery/setup screens, login, receipt and invoice actions. Existing 16 offline API/PDF groups and seven component/flow groups pass. New loading regression checks verify concurrent reads, freshness, failed-read retry, session isolation, route splitting and deferred PDF renderer. Principal screenshots were reviewed and the customer welcome-card contrast corrected.

Run npm run test:loading for performance behavior checks. The browser suite defaults to all routes; AUDIT_QUICK_REVIEW=1 selects nine representative routes for targeted visual iterations. Live production network/database latency and deployment have not been measured; no live data or external messages were changed.

Final targeted browser run passed 12 groups, including actual on-demand bill PDF rendering, fixture WhatsApp submission and file download. The generated preview is retained after temporary PDF rendering so Print/Download controls remain visible; this changes UI state only and performs no additional billing writes.

## Single customer meal-row save

Saving one date now updates only that row from the existing save response instead of reloading the full list. Unrelated drafts (meal quantities, extras and remarks), edits made while the request is pending and failed-save values are preserved. Rows now save independently; only the pending row has its Save button disabled. Backend save logic and payload calculations are unchanged. Eight component regression groups pass, including the new multi-row draft-preservation checks; production build and lint pass.

Per-row save refinement: separate pending-row state permits rapid saves across different dates, synchronously blocks duplicate clicks on the same row, and clears only the completed request. Nine component regression groups pass, including out-of-order parallel completion, independent failures and draft preservation. Build and lint passed.

## Admin route loading refinement

Layout-level Suspense boundaries retain sidebar/header while page modules load. Customers is available in the main bundle, removing its route-module waterfall; barcode modal/library is loaded only when requested. Removed an unused barcode effect whose ref was never attached. Main JS is now 318.76 kB (97.87 kB gzip), a small tradeoff for immediate Customers availability. Slow-module Chrome test confirms navigation stays visible. Thirteen browser regression groups, nine component groups, loading regression, build and lint passed. A read-only production static check returned Customers HTML in 303 ms and main JS in 100 ms on this connection; this does not measure user-network or authenticated API latency. No backend/data changes.

## WhatsApp conversation inbox

Inbox groups stored messages by normalized phone number, displays contacts ordered by latest message, supports name/phone/full-history text search and chronological incoming/outgoing bubbles. Conversation drafts survive contact switching and background refresh. Read/Delete use existing APIs and confirmations; reply uses the latest incoming message as its existing API anchor. Mobile uses contact-list/chat views with a Back control. Media previews load only for the selected chat. Full-history retrieval is opt-in via includeOutgoing=true; default incoming-only, unread and payment-review queries remain unchanged. Seventeen offline regression groups and fifteen Chrome groups pass with no live messages sent, including chat grouping, search, draft retention, reply/read/delete and mobile behavior. Build/lint passed; screenshots reviewed. Live deployment verification is recorded separately after push.

## Dashboard reporting and action notifications (2026-10-08)
- Successful payments are reported by paymentDate (createdAt fallback) in Asia/Kolkata. Calendar month/year filters apply to revenue and top customers; customer counts and pending balances remain current. Monthly chart separates years and includes December for January comparisons. Partial/future periods and zero baselines are labeled explicitly.
- Removed invented KPI growth. Active customers show active share; historical pending/active status snapshots do not exist, so historical growth is not fabricated.
- Independent dashboard reads run concurrently. Refresh/filter updates preserve the existing report; stale responses cannot replace newer selections.
- Protected action notifications aggregate pending website orders/reviews, modification requests, payment screenshots, unread messages and bill/announcement deliveries. Pending payment screenshots are excluded from unread-message count to avoid duplication. Partial category failures are visible.
- Added admin website orders destination using existing order status API. Sign-out retains existing session/logout behavior with refined UI.
- Offline reporting tests validate IST/leap-year/year boundaries, success-only revenue, zero/negative growth, security and notification partial failures. Existing 17 audit groups, 9 flow groups, loading checks and 16 browser groups pass; build passes and lint has no errors. No live record writes or actual messaging performed.
- WhatsApp chat frontend and backend commit 8316729 verified deployed; backend X-OM-Revision matches.

### Notification read state
- Added per-admin, per-category server read checkpoints. Opening a category reduces unread badge; Mark all as read clears displayed alerts. Payment/bill/order/approval records are not deleted or auto-approved. New/updated events after the snapshot become unread again. Failed read requests retain existing counts; stale polling responses cannot undo a successful read. Live test alerts were not generated by our tests.

## Admin Android app and test-alert cleanup
- Added android-admin native shell (Android 8+) with Home/Customers/Scan/Billing/More and pinned Approval/Announcement/Add Customer. It uses the live admin website and the same backend; records become visible on normal data refresh. No separate billing/payment logic or database.
- Camera runtime permissions, trusted-origin/main-frame bridge, canonical PDF saving through Android document picker, printing, file chooser, guarded unsaved-entry navigation, offline retry and modern back handling added.
- APK build, 3 native tests, Android lint (0 errors) and 17 browser groups pass. Physical-device authentication/camera/document-picker checks remain pending; APK is debug signed.
- Identified and archived 34 old System Review Test announcement alerts dated before 2026-10-08. Only notificationArchived metadata changed; no records were deleted, no delivery statuses/payments/bills changed. Rollback IDs/previous archive state are stored in the chat workspace test-notification-archive.json. Notifications exclude these archived tests while delivery history remains available.

- Archived test alerts are hidden from the normal announcement delivery list; Show archived test alerts restores their history. Search and status controls use the same filtered records. This behavior and the app bridge pass the expanded 18 browser regression groups.
