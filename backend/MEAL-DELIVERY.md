# Meal delivery rollout

Admin route: /meal-deliveries. One record per customer, IST date and Lunch/Dinner. Dispatch is required before delivery. Repeated Delivered requests do not resend notifications. Delivery marks never modify DailyEntry quantities or bills.

Meal entry from native Android sends deliveryCheck=true. Missing delivered marks return 409 DELIVERY_NOT_CONFIRMED. The app asks for explicit confirmation before saving an unverified entry. Existing website entry requests remain compatible.

Dinner is the default from 17:00 Asia/Kolkata; Lunch before that. Admin may change the meal. Only today's active, subscribed customers can be marked. Customer dashboard integration is deferred at the user's request.

WhatsApp adapter uses the existing server-side sender and credentials. It is disabled by default. After Meta approval, set WHATSAPP_DELIVERY_TEMPLATE, WHATSAPP_DELIVERY_LANGUAGE and WHATSAPP_DELIVERY_ENABLED=true. Required body parameter order: customer name, meal, YYYY-MM-DD date. Template must match this contract. Provider acceptance is recorded as accepted, never delivered. Ambiguous failures are unknown; there is no automatic resend.

Tests: node backend/tests/meal-delivery.test.cjs (fake database/provider; no customer messages). Android assembleDebug, testDebugUnitTest and lintDebug pass. Browser demo tests cover state transitions, confirmations, template-off status and 320-430px widths. Production frontend route and unauthenticated backend route checked. Authenticated live delivery writes have not been performed on customer data.