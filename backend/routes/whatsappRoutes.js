const express = require("express");

const router = express.Router();
const WHATSAPP_GRAPH_VERSION = "v26.0";

// ===============================
// WhatsApp Webhook Verification
// ===============================

router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ WhatsApp Webhook Verified");
    return res.status(200).send(challenge);
  }

  console.log("❌ WhatsApp Webhook Verification Failed");
  return res.sendStatus(403);
});

// ===============================
// WhatsApp Incoming Webhook
// ===============================

router.post("/webhook", (req, res) => {
  console.log("📩 WhatsApp Webhook Received");
  console.log(JSON.stringify(req.body, null, 2));

  // Meta requires a quick 200 response
  res.sendStatus(200);
});

// =====================================================
// WhatsApp Cloud API - Send Template Message
// =====================================================

router.post("/send", async (req, res) => {
  try {
    // -------------------------------------------------
    // 1. Security check
    // -------------------------------------------------
    const sendSecret = req.headers["x-whatsapp-send-secret"];

    if (!process.env.WHATSAPP_SEND_SECRET) {
      console.error("❌ WHATSAPP_SEND_SECRET is not configured");
      return res.status(500).json({
        success: false,
        message: "WhatsApp send secret is not configured",
      });
    }

    if (sendSecret !== process.env.WHATSAPP_SEND_SECRET) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // -------------------------------------------------
    // 2. Check required environment variables
    // -------------------------------------------------
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken) {
      return res.status(500).json({
        success: false,
        message: "WHATSAPP_ACCESS_TOKEN is not configured",
      });
    }

    if (!phoneNumberId) {
      return res.status(500).json({
        success: false,
        message: "WHATSAPP_PHONE_NUMBER_ID is not configured",
      });
    }

    // -------------------------------------------------
    // 3. Get request data
    // -------------------------------------------------
    const {
      to,
      templateName = "3p_direct_integration_test_template",
      languageCode = "en_US",
    } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: "Recipient phone number (to) is required",
      });
    }

    // -------------------------------------------------
    // 4. Normalize phone number
    // -------------------------------------------------
    let normalizedTo = String(to).replace(/\D/g, "");

if (normalizedTo.length === 10) {
  normalizedTo = "91" + normalizedTo;
}

    if (!normalizedTo) {
      return res.status(400).json({
        success: false,
        message: "Invalid recipient phone number",
      });
    }

    // -------------------------------------------------
    // 5. Meta Graph API URL
    // -------------------------------------------------
    const url =
      `https://graph.facebook.com/${WHATSAPP_GRAPH_VERSION}/` +
      `${phoneNumberId}/messages`;

    // -------------------------------------------------
    // 6. WhatsApp template payload
    // -------------------------------------------------
    const payload = {
      messaging_product: "whatsapp",
      to: normalizedTo,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
      },
    };

    console.log("📤 Sending WhatsApp template:", {
      to: normalizedTo,
      templateName,
      languageCode,
    });

    // -------------------------------------------------
    // 7. Send request to Meta
    // -------------------------------------------------
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // -------------------------------------------------
    // 8. Handle Meta error
    // -------------------------------------------------
    if (!response.ok) {
      console.error("❌ WhatsApp API error:", data);

      return res.status(response.status).json({
        success: false,
        message: "WhatsApp API request failed",
        error: data,
      });
    }

    // -------------------------------------------------
    // 9. Success
    // -------------------------------------------------
    console.log("✅ WhatsApp message sent:", data);

    return res.status(200).json({
      success: true,
      message: "WhatsApp message sent successfully",
      data,
    });
  } catch (error) {
    console.error("❌ WhatsApp send error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while sending WhatsApp message",
      error: error.message,
    });
  }
});

module.exports = router;