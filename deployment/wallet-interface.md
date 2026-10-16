# Wallet interface and statement

Admin uses `/customers?view=wallets` (existing Android allowlist compatible) or `/wallets`. The Customers shortcut and separate sidebar item lead to the same protected page. Customer dashboard opens only `/customer-portal/wallet`; customer tokens cannot read the admin list or other wallets.

Primary statements group meal events by service date before pagination. Amount is the current frozen charge; balance is the actual running balance after the latest update, not a sum of the filtered page. Original financial events remain in Detailed audit. Same-state saves produce no event; equal-price logical edits produce a zero-delta audit event.

Invoice generation stores a sequence/period checkpoint without a wallet mutation. Covered meal rows leave Current/unbilled; post-checkpoint edits reappear until regeneration. Payments, adjustments and opening balance remain visible. Legacy invoices without checkpoints archive only known covered opening-basis rows. Historic meals included in opening are display rows with no invented running balance or new debit. Incomplete legacy events remain in history/audit instead of being discarded. A compound sequence/identity cursor preserves tied opening rows across pages.

Validation: full PHP suite (wallet tests use synthetic in-memory records); calendar tests; frontend lint/build/prerender/SEO; `scripts/wallet-browser-regression.cjs` at 360/430/1280px with intercepted synthetic APIs and zero write requests. Set PLAYWRIGHT_MODULE and optionally CHROME_EXECUTABLE/WALLET_TEST_OUTPUT in environments without a local Playwright package.

This release performs no opening activation, advance credits, customer cleanup or data imports. Existing 38 wallets and approved historic resolutions are preserved. Native Android code is unchanged; no APK release required.
