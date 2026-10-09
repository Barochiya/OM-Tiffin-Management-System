# Meal delivery rollout

Admin route: /meal-deliveries. One record per customer, IST date and Lunch/Dinner. Dispatch is required before delivery. Repeated Delivered requests do not resend notifications. Delivery marks never modify DailyEntry quantities or bills.

Meal entry from native Android sends deliveryCheck=true. Missing delivered marks return 409 DELIVERY_NOT_CONFIRMED. The app asks for explicit confirmation before saving an unverified entry. Existing website entry requests remain compatible.

Dinner is the default from 17:00 Asia/Kolkata; Lunch before that. Admin may change the meal. Only today's active, subscribed customers can be marked. Customer dashboard integration is deferred at the user's request.

WhatsApp adapter uses the existing server-side sender and credentials. It is disabled by default. After Meta approval, set WHATSAPP_DELIVERY_TEMPLATE, WHATSAPP_DELIVERY_LANGUAGE and WHATSAPP_DELIVERY_ENABLED=true. Required body parameter order: customer name, meal, DD/MM/YYYY date. Template must match this contract. Provider acceptance is recorded as accepted, never delivered. Ambiguous failures are unknown; there is no automatic resend.

Tests: node backend/tests/meal-delivery.test.cjs (fake database/provider; no customer messages). Android assembleDebug, testDebugUnitTest and lintDebug pass. Browser demo tests cover state transitions, confirmations, template-off status and 320-430px widths. Production frontend route and unauthenticated backend route checked. Authenticated live delivery writes have not been performed on customer data.
## Prepared Meta templates (English UK)

- Out for delivery: `om_tiffin_out_for_delivery`
- Delivered: `om_tiffin_delivered`
- Language: `en_GB`; body parameters: customer name, Lunch/Dinner, DD/MM/YYYY date.

Names/language are preconfigured in `backend/config/mealDeliveryWhatsApp.json`. Sending is disabled (`enabled:false`). After verifying BOTH templates are approved in the same WhatsApp Business Account used by the backend credentials, set Render backend environment `WHATSAPP_DELIVERY_ENABLED=true`. To stop notices, set it to `false`. Existing `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are reused; do not copy secrets into Android or frontend code. Optional overrides: `WHATSAPP_DISPATCH_TEMPLATE`, `WHATSAPP_DELIVERY_TEMPLATE`, `WHATSAPP_DELIVERY_LANGUAGE`.

Dispatch and delivery save separate notification results (`dispatchNotification` and `notification`). Status transitions are saved before requesting WhatsApp. Duplicate/concurrent marks cannot trigger another send for the same transition; notifications are not sent retroactively for existing marks. Provider `accepted` only means Meta accepted the request, not that the customer's phone received it. Failed/ambiguous sends are shown in the app and never automatically retried. Approval checks and a real opted-in test recipient are required before claiming live delivery success.

Run `node backend/tests/meal-delivery.test.cjs` and `node backend/tests/meal-delivery-whatsapp.test.cjs`. Both use fake data/providers and never message customers.
