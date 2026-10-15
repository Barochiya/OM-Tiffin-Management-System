# Wallet rollout

Wallet balances are integer paise. The database business lock serializes activation, meals, payments and adjustments. Ledger rows are append-only; daily edits use compensating differences, successful payments use a stable payment ID, and adjustments require a retained request ID and reason.

Opening balance is unused advance less non-carried invoice outstanding less unbilled meal charges. Historical payments are never replayed. Activation freezes entry pricing from stored invoice details where available and current rates for unbilled entries. Duplicate periods/days, broken carry links, missing source entries and mismatched quantities, extras or totals block activation. The saved proposal fingerprint must still match the live billing records.

Run from the exact installed release with OMTIFFIN_CONFIG set to the isolated OM Tiffin configuration:

    php wallet-audit.php audit /private/new-wallet-audit.json

Review the private report. Preserve a database backup, then activate only clean, unchanged proposals:

    php wallet-audit.php --activate /private/new-wallet-audit.json

Repeat activation is harmless. Review rows remain inactive; do not invent opening adjustments. A stale proposal needs a fresh audit. Existing bills/payments/advance are retained. New customer creation activates a zero opening wallet automatically. Bill generation does not post ledger entries; it uses frozen meal amounts. Mark Paid records a received Cash payment through the established payment/receipt path for activated wallets. Payments against carried invoices are rejected in favor of the current invoice.

Web/customer portal and native admin View Customer use the same server API. No APK is needed for this web content. Customer APIs derive the customer identity from authentication, never from a query parameter. Admin changes appear on the next refresh/focus or within 15 seconds.

After the first activation, do not roll back to pre-wallet billing code: that would stop recording meals and payments. For a code rollback preserve the wallet hooks or pause business writes first, back up, and reconcile before resuming. Never erase ledger entries to undo a correction.

Validation: synthetic wallet tests cover opening, rate snapshots, repeated entry/activation/payment, clear/restore, bill regeneration, negative balances, adjustment identity conflicts, rollback, new customers and Mark Paid. Existing PHP regression suite, frontend production build/lint, SEO checks and billing-calendar tests must pass. No customer messages are sent by tests.
