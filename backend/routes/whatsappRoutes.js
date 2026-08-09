const express = require("express");

const router = express.Router();

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

module.exports = router;