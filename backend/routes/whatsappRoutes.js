const express = require("express");

const router = express.Router();

const {
  sendWhatsAppMessage,
  sendWhatsAppTemplate,
} = require("../utils/whatsappSender");

const Bill = require("../models/Bill");
const AnnouncementDelivery = require("../models/AnnouncementDelivery");

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
  console.log(
    "📩 WhatsApp Webhook Received"
  );

  console.log(
    JSON.stringify(req.body, null, 2)
  );

  try {
    const entries = Array.isArray(req.body?.entry)
      ? req.body.entry
      : [];

    // =================================================
    // Process ALL entries
    // =================================================

    for (const entry of entries) {
      const changes = Array.isArray(
        entry?.changes
      )
        ? entry.changes
        : [];

      // ===============================================
      // Process ALL changes
      // ===============================================

      for (const change of changes) {
        const statuses = Array.isArray(
          change?.value?.statuses
        )
          ? change.value.statuses
          : [];

        if (statuses.length === 0) {
          continue;
        }

        // =============================================
        // Process ALL statuses
        // =============================================

        for (const status of statuses) {
          console.log(
            "📦 WhatsApp Status:",
            {
              id: status.id,
              status: status.status,
              recipient:
                status.recipient_id,
              timestamp:
                status.timestamp,
            }
          );

          if (!status.id) {
            console.log(
              "⚠️ Status message ID missing"
            );

            continue;
          }

          // =========================================
          // Find Bill
          // =========================================

          const bill =
            await Bill.findOne({
              "whatsappDelivery.messageId":
                status.id,
            });

          // =========================================
          // Find Announcement Delivery
          // =========================================

          const announcementDelivery =
            await AnnouncementDelivery.findOne({
              whatsappMessageId:
                status.id,
            });

          console.log(
            "Announcement Delivery =",
            announcementDelivery?._id ||
              null
          );

          console.log(
            "Bill =",
            bill?._id || null
          );

          // =========================================
          // Nothing found
          // =========================================

          if (
            !bill &&
            !announcementDelivery
          ) {
            console.log(
              "❌ No Bill or AnnouncementDelivery found for message:",
              status.id
            );

            continue;
          }

          // =================================================
          // Announcement Delivery Status Tracking
          // =================================================

          if (announcementDelivery) {
            const announcementUpdate = {};

            if (status.status === "sent") {
              announcementUpdate.status =
                "sent";

              announcementUpdate.sentAt =
                new Date(
                  Number(
                    status.timestamp
                  ) * 1000
                );

              announcementUpdate.failureReason =
                "";
            }

            if (
              status.status ===
              "delivered"
            ) {
              announcementUpdate.status =
                "delivered";

              announcementUpdate.deliveredAt =
                new Date(
                  Number(
                    status.timestamp
                  ) * 1000
                );
            }

            if (
              status.status === "read"
            ) {
              announcementUpdate.status =
                "read";

              announcementUpdate.readAt =
                new Date(
                  Number(
                    status.timestamp
                  ) * 1000
                );
            }

            if (
              status.status ===
              "failed"
            ) {
              announcementUpdate.status =
                "failed";

              announcementUpdate.failureReason =
                status.errors?.[0]
                  ?.title ||
                status.errors?.[0]
                  ?.message ||
                "Message failed";
            }

            if (
              Object.keys(
                announcementUpdate
              ).length > 0
            ) {
              await AnnouncementDelivery.findByIdAndUpdate(
                announcementDelivery._id,
                {
                  $set:
                    announcementUpdate,
                }
              );

              console.log(
                "✅ AnnouncementDelivery updated:",
                {
                  id:
                    announcementDelivery._id,
                  messageId:
                    status.id,
                  status:
                    status.status,
                }
              );
            }
          }

          // =================================================
          // If this is only an announcement, continue
          // =================================================

          if (!bill) {
            continue;
          }

          // =================================================
          // Bill WhatsApp Status Tracking
          // =================================================

          const currentStatus =
            bill.whatsappDelivery
              ?.status || "pending";

          const statusPriority = {
            pending: 0,
            sent: 1,
            delivered: 2,
            read: 3,
          };

          const incomingStatus =
            status.status;

          // =================================================
          // FAILED
          // =================================================

          if (
            incomingStatus === "failed"
          ) {
            const failedUpdate = {
              "whatsappDelivery.status":
                "failed",

              "whatsappDelivery.failedAt":
                new Date(
                  Number(
                    status.timestamp
                  ) * 1000
                ),

              "whatsappDelivery.reason":
                status.errors?.[0]
                  ?.title ||
                status.errors?.[0]
                  ?.message ||
                "Message failed",

              "whatsappDelivery.meta":
                status,
            };

            await Bill.findByIdAndUpdate(
              bill._id,
              {
                $set: failedUpdate,
              }
            );

            console.log(
              "❌ Bill marked as FAILED:",
              bill.invoiceNo
            );

            continue;
          }

          // =================================================
          // Ignore unknown status
          // =================================================

          if (
            !Object.prototype.hasOwnProperty.call(
              statusPriority,
              incomingStatus
            )
          ) {
            console.log(
              "⚠️ Unknown WhatsApp status:",
              incomingStatus
            );

            continue;
          }

          // =================================================
          // Prevent status from going backwards
          // =================================================

          const currentPriority =
            Object.prototype.hasOwnProperty.call(
              statusPriority,
              currentStatus
            )
              ? statusPriority[
                  currentStatus
                ]
              : 0;

          const incomingPriority =
            statusPriority[
              incomingStatus
            ];

          if (
            incomingPriority <
            currentPriority
          ) {
            console.log(
              "⏭️ Ignoring older WhatsApp status:",
              {
                bill:
                  bill.invoiceNo,
                currentStatus,
                incomingStatus,
              }
            );

            continue;
          }

          // =================================================
          // Build Bill Update
          // =================================================

          const update = {
            "whatsappDelivery.status":
              incomingStatus,

            "whatsappDelivery.meta":
              status,
          };

          const eventDate =
            status.timestamp
              ? new Date(
                  Number(
                    status.timestamp
                  ) * 1000
                )
              : new Date();

          // =================================================
          // SENT
          // =================================================

          if (
            incomingStatus === "sent"
          ) {
            update[
              "whatsappDelivery.sentAt"
            ] = eventDate;

            update[
              "whatsappDelivery.reason"
            ] = "Message sent";

            console.log(
              "📤 BILL SENT:",
              bill.invoiceNo
            );
          }

          // =================================================
          // DELIVERED
          // =================================================

          if (
            incomingStatus ===
            "delivered"
          ) {
            update[
              "whatsappDelivery.delivered"
            ] = true;

            update[
              "whatsappDelivery.deliveredAt"
            ] = eventDate;

            update[
              "whatsappDelivery.reason"
            ] =
              "Message delivered";

            console.log(
              "✅ BILL DELIVERED:",
              bill.invoiceNo
            );
          }

          // =================================================
          // READ
          // =================================================

          if (
            incomingStatus === "read"
          ) {
            console.log(
              "👁️ READ EVENT RECEIVED:",
              bill.invoiceNo
            );

            update[
              "whatsappDelivery.delivered"
            ] = true;

            update[
              "whatsappDelivery.readAt"
            ] = eventDate;

            update[
              "whatsappDelivery.reason"
            ] = "Message read";

            console.log(
              "🔵 BILL READ:",
              bill.invoiceNo
            );
          }

          // =================================================
          // Save Bill
          // =================================================

          await Bill.findByIdAndUpdate(
            bill._id,
            {
              $set: update,
            }
          );

          console.log(
            "✅ Bill WhatsApp status updated:",
            {
              invoice:
                bill.invoiceNo,
              status:
                incomingStatus,
            }
          );
        }
      }
    }

    // =================================================
    // Always acknowledge Meta webhook
    // =================================================

    return res.sendStatus(200);
  } catch (error) {
    console.error(
      "❌ Webhook Error:",
      error
    );

    // Meta should still receive 200
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
      req.headers[
        "x-whatsapp-send-secret"
      ];

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
      code:
        error.code || undefined,
      error:
        error.meta || undefined,
    });
  }
});

module.exports = router;