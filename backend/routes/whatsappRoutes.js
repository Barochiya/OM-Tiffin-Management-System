const express = require("express");

const router = express.Router();

const {
  sendWhatsAppMessage,
  sendWhatsAppTemplate,
} = require("../utils/whatsappSender");

const Bill = require("../models/Bill");
const AnnouncementDelivery = require("../models/AnnouncementDelivery");
const WhatsAppMessage = require("../models/WhatsAppMessage");
const CustomerOtp = require("../models/CustomerOtp");
const Tiffin = require("../models/Tiffin");
const CustomerModificationWhatsAppAction = require("../models/CustomerModificationWhatsAppAction");
const { normalizeIndianPhone } = require("../utils/whatsappSender");
const { approveCustomerModificationRequest } = require("../services/customerModificationApprovalService");

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
      "âœ… WhatsApp Webhook Verified"
    );

    return res
      .status(200)
      .send(challenge);
  }

  console.log(
    "âŒ WhatsApp Webhook Verification Failed"
  );

  return res.sendStatus(403);
});

// =====================================================
// WhatsApp Incoming Webhook
// =====================================================

router.post("/webhook", async (req, res) => {
  console.log(
    "ðŸ“© WhatsApp Webhook Received"
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

        // =================================================
// Incoming WhatsApp Messages
// =================================================

const incomingMessages = Array.isArray(
  change?.value?.messages
)
  ? change.value.messages
  : [];

// =================================================
// Save Incoming WhatsApp Messages
// =================================================

for (const incoming of incomingMessages) {
  try {
    console.log(
      "ðŸ“© Incoming WhatsApp Message:",
      JSON.stringify(incoming, null, 2)
    );

    console.log("WEBHOOK INCOMING TYPE CHECK:", incoming?.type, incoming?.button?.payload || "");
    const phoneNumber =
      incoming?.from || null;

    const whatsappMessageId =
      incoming?.id || null;

    // =================================================
    // Customer Modification WhatsApp Approve Callback
    // =================================================
    const modificationButtonPayload =
      incoming?.type === "button"
        ? incoming?.button?.payload ||
          incoming?.button?.text ||
          ""
        : incoming?.type === "interactive"
          ? incoming?.interactive?.button_reply?.id ||
            incoming?.interactive?.button_reply?.title ||
            ""
          : "";
    const isModificationApproval =
      String(modificationButtonPayload)
        .trim()
        .toUpperCase() === "APPROVE";
    console.log("MODIFICATION APPROVAL CHECK:", { incomingType: incoming?.type, buttonPayload: modificationButtonPayload, isModificationApproval, phoneNumber, contextMessageId: incoming?.context?.id || null });
    if (isModificationApproval) {
      try {
        const normalizedAdminPhone = normalizeIndianPhone(phoneNumber);
        const originalMessageId =
          incoming?.context?.id || null;
        if (!originalMessageId) {
          console.log(
            "Customer modification approval callback missing context message ID."
          );
        } else {
          const action =
            await CustomerModificationWhatsAppAction.findOne({
              whatsappMessageId: originalMessageId,
              adminPhone: normalizedAdminPhone,
              action: "APPROVE",
              status: "PENDING",
            });
          if (!action) {
            console.log(
              "Customer modification approval mapping not found:",
              {
                originalMessageId,
                adminPhone: normalizedAdminPhone,
              }
            );
          } else {
            const approvalResult =
              await approveCustomerModificationRequest({
                requestId: action.request,
                reviewedBy: null,
                source: "WHATSAPP",
              });
            if (
              approvalResult.approved ||
              approvalResult.alreadyApproved
            ) {
              action.status = "USED";
              action.usedAt = new Date();
              await action.save();
              console.log(
                "Customer modification approved from WhatsApp:",
                {
                  requestId: action.request,
                  adminPhone: normalizedAdminPhone,
                  originalMessageId,
                }
              );
            }
          }
        }
      } catch (approvalError) {
        console.error(
          "Customer modification WhatsApp approval failed:",
          approvalError.message
        );
      }
    }

    if (!phoneNumber || !whatsappMessageId) {
      console.log(
        "âš ï¸ Incoming message missing phone or message ID"
      );

      continue;
    }

    // ---------------------------------------------
    // Find Customer
    // ---------------------------------------------

    const phoneDigits =
  String(phoneNumber).replace(/\D/g, "");

const normalizedPhone =
  phoneDigits.length >= 10
    ? phoneDigits.slice(-10)
    : phoneDigits;

const customer =
  await Tiffin.findOne({
    phone: normalizedPhone,
  });

    // ---------------------------------------------
    // Message Data
    // ---------------------------------------------

    let messageType = "unknown";
    let messageText = "";
    let mediaId = null;
    let mediaMimeType = null;
    let mediaFilename = null;
    let mediaCaption = "";

    if (incoming.type === "text") {
      messageType = "text";

      messageText =
        incoming?.text?.body || "";
    }

    if (incoming.type === "image") {
      messageType = "image";

      mediaId =
        incoming?.image?.id || null;

      mediaMimeType =
        incoming?.image?.mime_type || null;

      mediaCaption =
        incoming?.image?.caption || "";

      messageText = mediaCaption;
    }

    if (incoming.type === "document") {
      messageType = "document";

      mediaId =
        incoming?.document?.id || null;

      mediaMimeType =
        incoming?.document?.mime_type || null;

      mediaFilename =
        incoming?.document?.filename || null;

      mediaCaption =
        incoming?.document?.caption || "";

      messageText = mediaCaption;
    }

    if (incoming.type === "audio") {
      messageType = "audio";

      mediaId =
        incoming?.audio?.id || null;

      mediaMimeType =
        incoming?.audio?.mime_type || null;
    }

    if (incoming.type === "video") {
      messageType = "video";

      mediaId =
        incoming?.video?.id || null;

      mediaMimeType =
        incoming?.video?.mime_type || null;

      mediaCaption =
        incoming?.video?.caption || "";

      messageText = mediaCaption;
    }

    if (incoming.type === "sticker") {
      messageType = "sticker";

      mediaId =
        incoming?.sticker?.id || null;

      mediaMimeType =
        incoming?.sticker?.mime_type || null;
    }

    // ---------------------------------------------
    // Payment Review Detection
    // ---------------------------------------------

     const paymentKeywords = [
      "payment",
      "paid",
      "pay",
      "payment Done",
      "payment done",
      "payment screenshot",
      "screenshot",
      "upi",
      "àªªà«‡àª®à«‡àª¨à«àªŸ",
      "àªªà«‡àª®à«‡àª¨à«àªŸ àª•àª°à«àª¯à«àª‚",
      "àªªà«‡àª®à«‡àª¨à«àªŸ àª•àª°à«àª¯à«",
      "àªªà«‡àª®à«‡àª¨à«àªŸ àª¸à«àª•à«àª°à«€àª¨àª¶à«‹àªŸ",
      "àª­àª°à«àª¯à«àª‚",
      "àª­àª°à«àª¯à«",
    ];

    const searchableText =
      `${messageText} ${mediaCaption}`.toLowerCase();

    const isPaymentRelated =
      paymentKeywords.some(
        (keyword) =>
          searchableText.includes(
            keyword.toLowerCase()
          )
      ) ||
      messageType === "image";

    // ---------------------------------------------
    // Save Message
    // ---------------------------------------------

    const savedMessage =
      await WhatsAppMessage.create({
        customer:
          customer?._id || null,

        phoneNumber:
          normalizedPhone,

        whatsappMessageId,

        type: messageType,

        message:
          messageText || "",

        mediaId,

        mediaMimeType,

        mediaFilename,

        mediaCaption,

        whatsappTimestamp:
          incoming.timestamp
            ? new Date(
                Number(
                  incoming.timestamp
                ) * 1000
              )
            : new Date(),

        direction: "incoming",

        inboxStatus: "unread",

        paymentStatus:
          isPaymentRelated
            ? "pending_review"
            : "not_payment_related",
      });

    console.log(
      "âœ… Incoming WhatsApp message saved:",
      {
        id: savedMessage._id,
        customer:
          customer?.customerName ||
          "Unknown Customer",
        phone:
          normalizedPhone,
        type: messageType,
        paymentRelated:
          isPaymentRelated,
      }
    );
  } catch (incomingError) {
    console.error(
      "âŒ Incoming WhatsApp message processing failed:",
      incomingError.message
    );
  }
}
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
            "ðŸ“¦ WhatsApp Status:",
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
              "âš ï¸ Status message ID missing"
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
      // =========================================
      // Find Customer OTP
      // =========================================
      const customerOtp =
        await CustomerOtp.findOne({
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
        !announcementDelivery &&
        !customerOtp
      ) {
            console.log(
              "âŒ No Bill or AnnouncementDelivery found for message:",
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
                "âœ… AnnouncementDelivery updated:",
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
          // =================================================      // =================================================
      // Customer OTP WhatsApp Status Tracking
      // =================================================
      if (customerOtp) {
        const otpUpdate = {};
        if (status.status === "sent") {
          otpUpdate.whatsappStatus = "sent";
          otpUpdate.whatsappSentAt =
            new Date(Number(status.timestamp) * 1000);
        }
        if (status.status === "delivered") {
          otpUpdate.whatsappStatus = "delivered";
          otpUpdate.whatsappDeliveredAt =
            new Date(Number(status.timestamp) * 1000);
        }
        if (status.status === "read") {
          otpUpdate.whatsappStatus = "read";
          otpUpdate.whatsappReadAt =
            new Date(Number(status.timestamp) * 1000);
        }
        if (status.status === "failed") {
          otpUpdate.whatsappStatus = "failed";
          otpUpdate.whatsappFailedAt =
            new Date(Number(status.timestamp) * 1000);
          otpUpdate.whatsappFailureReason =
            status.errors?.[0]?.title ||
            status.errors?.[0]?.message ||
            "WhatsApp delivery failed.";
        }
        if (Object.keys(otpUpdate).length > 0) {
          await CustomerOtp.updateOne(
            { _id: customerOtp._id },
            { $set: otpUpdate }
          );
          console.log(
            "Customer OTP WhatsApp Status Updated:",
            {
              id: customerOtp._id,
              messageId: status.id,
              status: status.status,
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
              "âŒ Bill marked as FAILED:",
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
              "âš ï¸ Unknown WhatsApp status:",
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
              "â­ï¸ Ignoring older WhatsApp status:",
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
              "ðŸ“¤ BILL SENT:",
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
              "âœ… BILL DELIVERED:",
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
              "ðŸ‘ï¸ READ EVENT RECEIVED:",
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
              "ðŸ”µ BILL READ:",
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
            "âœ… Bill WhatsApp status updated:",
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
      "âŒ Webhook Error:",
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
        "âŒ WHATSAPP_SEND_SECRET is not configured"
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
      "âŒ WhatsApp send error:",
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
