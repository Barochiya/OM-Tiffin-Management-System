# BigRock `4692404` workflow reference

The deployed `index-Bf6IPQiN.js` → `FullApp-DX50fYFs.js` → `CustomerDirectory-CekKZ-hP.js` resolves `WalkInCustomers-Bz6drrh8.js` and `WalletTopUps-OTeAaG3m.js`. The workspace's `om-tiffin-dev` repository contains the exact release revision `469240453a1103124417bc91a67d2122dd55a73e`. Its PHP source matches the downloaded production files by SHA-256. Use that human-authored source instead of translating the minified bundles. The separate live admin CSS hotfix remains bundled through the compatibility commit.

## Walk-in Customers

Admin navigation is `/customers?view=walk-ins`. `GET /walk-ins` returns `{ data: rows }`, newest first by server `createdAt`, with no pagination or client reordering. The client reads `_id`, `customerName`, `phone`, `payments` (or legacy `payment`), `orderPaymentStart`, `totalPaise`, `whatsappStatus`, `reviewStatus` and `reviewSubmitted`. History reads `requestId`, `receiptNo`, `amount`, `paymentMethod` and `paymentDate`. Client search is a trimmed case-insensitive name substring or formatted phone substring after normalizing to digits against `91` plus the stored number. The All and Pending / balance due filter uses the current order's payment slice, with the pending count computed across all rows. Fully paid, partially paid, pending payment and no-order labels reflect those same fields.

| Method and path | Body and handling |
| --- | --- |
| `POST /walk-ins` | `{name, phone}`. Name required, max 120 in the UI. Phone required, validated and deduplicated by the server. Clear the form and refresh on success. |
| `POST /walk-ins/:id/payment` | `{newOrder, amount, total, type, method, reference, requestId}`. Inline edit/cancel, UUID per opened form, Full/Partial/Pending types, Cash/UPI/Bank Transfer. Existing order total is read-only. Full amount follows outstanding amount. Pending is allowed only for a new unpaid order and carries zero, with reference cleared. Positive amounts, decimal limits and references are validated by the server. Successful submission opens payment history. |
| `POST /walk-ins/:id/payment/send` | `{receiptNo, format}` with `message` or `receipt`. Explicit delivery action for an existing receipt. |
| `POST /walk-ins/:id/review` | `{requestId}`. Reads `data.results[0].status` for queued, cooldown, already received or fallback. Hidden after review submission. |

The list uses cards, native expandable history, an inline form, wrapping action groups and a one/two/three-column responsive payment form. There is no detail sub-route or external link. Initial empty, search empty, action busy, success and API/fallback errors match the deployed screen. Payment recording commits only via the authorized backend; pending orders do not create a payment or send a receipt. The backend prevents overpayment, duplicate references and divergent request-ID reuse.

## Wallet Payment Approvals and customer top-ups

Admin navigation is `/customers?view=wallet-payment-approvals`. Customers reach the same shared component from their own wallet dialog. `GET /wallet-top-ups` (admin) and `GET /customer-portal/wallet/top-ups` (customer) use separate authenticated clients. Both consume `{data: rows}` sorted newest-first on the server. There is no search, manual sort, pagination or client status filter. Admin counts total, pending, rejected and approved amount. The server hides pending admin rows until eligible incoming evidence exists. The client renders `_id`, `amountPaise`, `createdAt`, `status`, `name`, `userId`, `phone`, `reference`, `rejectionReason`, `whatsappStatus`, `failureReason`, and `screenshots[]._id` and `whatsappTimestamp`.

| Method and path | Body and handling |
| --- | --- |
| `GET /whatsapp-inbox/media/:id` | Admin-authenticated blob. Only JPEG, PNG and WebP previews; inline open/close and object URL cleanup. Approval remains disabled until an image has loaded for that row. No credit or upload request is made during preview. |
| `POST /wallet-top-ups/:id/decision` | `{action, detail, proofMessageId}` with `approved` or `rejected`; undefined optional fields are omitted. Rejection needs a nonblank reason. Approval needs evidence and a separate bank/UPI check by the admin. The server rejects already-reviewed requests, verifies evidence ownership, derives the proof hash and rejects reused payment evidence. Only that approval path credits wallets and settles bills. |
| `POST /customer-portal/wallet/top-ups` | `{amount, requestId}`. ₹1–₹50,000, two decimals, preset amounts and UUID reuse for retries at the same amount. Creates a pending request only. |
| `POST /customer-portal/wallet/top-ups/:id/whatsapp` | `{}`. Requests payment details; reloads list and surfaces actual delivery success or failure. Retry offered only for pending rows with absent or failed WhatsApp status. |

The live screen uses responsive summary tiles and wrapping cards, no modal or QR display in either role, an inline evidence preview, disabled actions during requests, a no-pending message and service-error feedback. Closed rows are history only. Browser tests intercept all APIs, including actions and evidence reads. PHP tests use synthetic stores and fake provider transport.

## Compatibility checks

- The candidate retains all 178 live PHP method/path/access entries. The only additions are four analytics endpoints and the read-only customer ranking endpoint already on the feature branch.
- The restored Walk-in and Wallet React files and financial runtime are from the exact live Git revision. The recovered entry, app root, customer directory, Walk-in and Wallet chunks match the local live-release ZIP byte for byte.
- `npm run test:browser` exercises both admin routes and customer top-ups using intercepted requests. Setting `AUDIT_LIVE_WEB_ROOT` to an extracted local live `web/` directory with the verified live CSS and HTML runs the same compatibility cases against the built live reference. Both modes block service workers and intercept or abort all external requests.
- The wallet test checks that opening and closing evidence or entering a rejection reason makes no write request. It verifies the explicit decision payloads and the backend rule that missing or foreign evidence cannot approve or credit a request. The customer test checks that requesting payment details leaves the top-up pending and the displayed wallet credit unchanged.
