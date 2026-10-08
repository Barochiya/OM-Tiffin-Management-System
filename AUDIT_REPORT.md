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
