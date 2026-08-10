# WhatsApp PDF Bill Sending

The Billing page now has a **Send Bill PDF** button. It creates the same invoice view as a PDF in the browser and sends that PDF to the selected customer's WhatsApp number through the backend and Meta WhatsApp Cloud API.

## Backend environment

Set these variables in the backend/Render environment:

```env
WHATSAPP_ACCESS_TOKEN=<your Meta WhatsApp Cloud API access token>
WHATSAPP_PHONE_NUMBER_ID=<your WhatsApp phone number ID>
WHATSAPP_API_VERSION=v26.0
```

For the current OM Tiffin WhatsApp number, the Phone Number ID is the value shown by Meta for the number; do not hard-code secrets into source code.

## Important WhatsApp policy behavior

The implementation sends a document message through the Cloud API. If the recipient is outside WhatsApp's customer-service window, Meta may require an approved message template instead of a free-form document message. In that case the backend returns Meta's error message so the UI can show the reason.

## Render deployment

Add the three WhatsApp variables above to the backend Render service's Environment settings and redeploy the backend.

Do **not** commit `.env` or expose the access token in frontend code.

## What changed

- Billing page: PDF generation using the existing `html2pdf.js` dependency.
- Billing page: **Send Bill PDF** button beside the existing WhatsApp sharing action.
- Backend: authenticated `POST /api/bills/send-whatsapp`.
- Backend: receives the PDF as `application/pdf`, uploads it to WhatsApp Cloud API, then sends it as a document.
- Backend: validates the bill and resolves the customer's phone number from MongoDB.
- Existing click-to-chat WhatsApp sharing remains unchanged.
