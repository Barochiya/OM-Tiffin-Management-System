const express = require("express");

const router = express.Router();

const {
  sendWhatsAppMessage,
  sendWhatsAppTemplate,
} = require("../utils/whatsappSender");
const Bill = require("../models/Bill");
// =====================================================
// WhatsApp Webhook Verification
// =====================================================

router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const verifyToken =
    process.env.WHATSAPP_VERIFY_TOKEN;

  if (
    mode === "subscribe" &&
    token &&
    verifyToken &&
    token === verifyToken
  ) {
    console.log(
      "✅ WhatsApp Webhook Verified"
    );

    return res
      .status(200)
      .send(challenge);
  }

  console.log(
    "❌ WhatsApp Webhook Verification Failed"
  );

  return res.sendStatus(403);
});

// =====================================================
// WhatsApp Incoming Webhook
// =====================================================

router.post("/webhook", async (req, res) => {
  console.log("📩 WhatsApp Webhook Received");

  try {
    const entry = req.body?.entry?.[0];

    const changes = entry?.changes?.[0];

        const statuses =
      changes?.value?.statuses;

      console.log(
        "statuses =",
        statuses
      );


    if (
  Array.isArray(statuses) &&
  statuses.length > 0
) {
  console.log(
    "Inside IF"
  );

  for (const status of statuses) {
  console.log(
    "Inside FOR"
  );

  console.log({
    id: status.id,
    status: status.status,
    recipient:
      status.recipient_id,
  });

 

const bill = await Bill.findOne({
  "whatsappDelivery.messageId":
    status.id,
});

console.log(
  "Bill =",
  bill
);

  if (!bill) {
    console.log(
      "❌ Bill not found for message:",
      status.id
    );

    continue;
  }

  console.log(
  "📦 Database Message ID:",
  bill?.whatsappDelivery?.messageId
);

  const update = {};

  if (status.status === "sent") {
    update["whatsappDelivery.status"] =
      "sent";

    update["whatsappDelivery.sentAt"] =
      new Date(
        Number(status.timestamp) *
          1000
      );

    update["whatsappDelivery.reason"] =
      "Message sent";
  }

  if (
    status.status === "delivered"
  ) {
    update["whatsappDelivery.status"] =
      "delivered";

    update[
      "whatsappDelivery.delivered"
    ] = true;

    update[
      "whatsappDelivery.deliveredAt"
    ] = new Date(
      Number(status.timestamp) *
        1000
    );

    update["whatsappDelivery.reason"] =
      "Message delivered";
  }

  if (status.status === "read") {
    update["whatsappDelivery.status"] =
      "read";

    update[
      "whatsappDelivery.delivered"
    ] = true;

    update["whatsappDelivery.readAt"] =
      new Date(
        Number(status.timestamp) *
          1000
    );

    update["whatsappDelivery.reason"] =
      "Message read";
  }

  if (status.status === "failed") {
    update["whatsappDelivery.status"] =
      "failed";

    update[
      "whatsappDelivery.failedAt"
    ] = new Date();

    update["whatsappDelivery.reason"] =
      status.errors?.[0]?.title ||
      "Message failed";
  }

  update["whatsappDelivery.meta"] =
    status;

  await Bill.findByIdAndUpdate(
    bill._id,
    {
      $set: update,
    }
  );

  console.log(
    "✅ Bill updated:",
    bill.invoiceNo
  );
}
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error(
      "Webhook Error:",
      error
    );

    return res.sendStatus(200);
  }
});

// =====================================================
// Send WhatsApp Message
// =====================================================

router.post("/send", async (req, res) => {
  try {
    // -------------------------------------------------
    // 1. Security check
    // -------------------------------------------------

    const sendSecret =
      req.headers["x-whatsapp-send-secret"];

    const configuredSecret =
      process.env.WHATSAPP_SEND_SECRET;

    if (!configuredSecret) {
      console.error(
        "❌ WHATSAPP_SEND_SECRET is not configured"
      );

      return res.status(500).json({
        success: false,
        message:
          "WhatsApp send secret is not configured",
      });
    }

    if (
      !sendSecret ||
      sendSecret !== configuredSecret
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // -------------------------------------------------
    // 2. Get request data
    // -------------------------------------------------

    const {
      to,
      type = "template",
      message,
      templateName,
      languageCode = "en_US",
      components,
      previewUrl = false,
    } = req.body || {};

    // -------------------------------------------------
    // 3. Basic validation
    // -------------------------------------------------

    if (!to) {
      return res.status(400).json({
        success: false,
        message:
          "Recipient phone number (to) is required",
      });
    }

    // -------------------------------------------------
    // 4. Send Text Message
    // -------------------------------------------------

    if (type === "text") {
      if (!message) {
        return res.status(400).json({
          success: false,
          message:
            "Message is required for text messages",
        });
      }

      const data =
        await sendWhatsAppMessage({
          to,
          message,
          previewUrl,
        });

      return res.status(200).json({
        success: true,
        message:
          "WhatsApp text message sent successfully",
        data,
      });
    }

    // -------------------------------------------------
    // 5. Send Template Message
    // -------------------------------------------------

    if (type === "template") {
      const finalTemplateName =
        templateName ||
        "3p_direct_integration_test_template";

      const data =
        await sendWhatsAppTemplate({
          to,
          templateName:
            finalTemplateName,
          languageCode,
          components,
        });

      return res.status(200).json({
        success: true,
        message:
          "WhatsApp template message sent successfully",
        data,
      });
    }

    // -------------------------------------------------
    // 6. Unsupported type
    // -------------------------------------------------

    return res.status(400).json({
      success: false,
      message:
        "Unsupported WhatsApp message type. Use 'text' or 'template'.",
    });
  } catch (error) {
    console.error(
      "❌ WhatsApp send error:",
      error
    );

    return res.status(
      error.status || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Internal server error while sending WhatsApp message",
      code: error.code || undefined,
      error: error.meta || undefined,
    });
  }
});

module.exports = router;