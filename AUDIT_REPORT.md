# Website and admin audit

Implemented /admin dashboard alias and session-safe authentication redirects; professional notifications and confirmations; normalized API URLs; functional bill PDF download/print/WhatsApp controls; canonical server-rendered receipt PDF for mobile and desktop; Gujarati receipt fonts; correct price response/loading guards; resolved barcode display; IST default business dates; Both-menu Lunch/Dinner validation; reusable professional invoice presentation and refined exported PDF styling.

Billing calculations, stored amounts, meal pricing, payment bank/UPI details and confirmation decisions are preserved. No migration, seeding or live data changes were performed. Existing local backup/reference files are excluded from the commit.

Validation: frontend production build passed; lint has no errors (existing warnings remain). Offline audit: 16 groups including 91 service operations under four API-base formats, authorization, PDF generation and unchanged data. Isolated JSX flow tests: 7 groups and 125 internal links. Headless Chrome: 10 groups including 46 route smoke checks, session handling, confirmations, desktop/mobile receipts and invoice layout. Fixture PDF render review verified Gujarati glyphs, multipage invoice last-day rows and stored totals.

Tests run with intercepted/stubbed APIs. Live MongoDB, Razorpay transactions and actual WhatsApp delivery were not exercised. External service availability and deployed production behavior require deployment verification.

## Repeat checks

Install frontend/backend dependencies first. From repository root: npm run test:audit and npm run test:flows. Browser tests require Playwright with Chrome installed; npm run test:browser. PLAYWRIGHT_MODULE can point to an available Playwright installation. AUDIT_ARTIFACT_DIR can point to a writable fixture-output directory. Run tests from a directory without a real .env; dummy test credentials and blocked database writes are used by the offline audit. Never run backend/server.js as part of these checks.
