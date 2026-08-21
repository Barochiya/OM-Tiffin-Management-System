const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const WhatsAppMessage = require("../models/WhatsAppMessage");
const Bill = require("../models/Bill");

 const {
  getWhatsAppConfig,
  sendWhatsAppMessage,
} = require("../utils/whatsappSender");

// =====================================================
// Get Pending WhatsApp Payment Reviews
// =====================================================

router.get(
  "/payment-reviews",
  protect,
  async (req, res) => {
    try {
      const messages =
        await WhatsAppMessage.find({
          direction: "incoming",
          paymentStatus: "pending_review",
        })
          .populate(
            "customer",
            "customerName phone address advanceBalance"
          )
          .populate(
            "linkedBill",
            "invoiceNo month year cycle totalAmount paidAmount pendingAmount status"
          )
          .sort({
            createdAt: -1,
          });

      const data = await Promise.all(
        messages.map(async (message) => {
          let pendingBills = [];

          if (message.customer?._id) {
            pendingBills =
              await Bill.find({
                customer: message.customer._id,
                pendingAmount: {
                  $gt: 0,
                },
              })
                .select(
                  "invoiceNo month year cycle totalAmount paidAmount pendingAmount status"
                )
                .sort({
                  year: -1,
                  month: -1,
                  cycle: -1,
                });
          }

          return {
            ...message.toObject(),
            pendingBills,
          };
        })
      );

      return res.json({
        success: true,
        count: data.length,
        data,
      });
    } catch (error) {
      console.error(
        "WhatsApp Payment Review Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load payment reviews.",
      });
    }
  }
);
// =====================================================
// Get WhatsApp Inbox
// =====================================================
router.get("/", protect, async (req, res) => {
  try {
    const messages =
      await WhatsAppMessage.find({
        direction: "incoming",
      })
        .populate(
          "customer",
          "customerName phone address"
        )
        .populate(
          "linkedBill",
          "invoiceNo totalAmount paidAmount pendingAmount status"
        )
        .populate(
          "linkedPayment",
          "amount paymentMethod paymentDate status"
        )
        .sort({
          createdAt: -1,
        });
    return res.json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    console.error(
      "WhatsApp Inbox Error:",
      error
    );
    return res.status(500).json({
      success: false,
      message:
        "Failed to load WhatsApp inbox.",
    });
  }
});
// =====================================================
// Get Unread Messages
// =====================================================
router.get(
  "/unread",
  protect,
  async (req, res) => {
    try {
      const messages =
        await WhatsAppMessage.find({
          direction: "incoming",
          inboxStatus: "unread",
        })
          .populate(
            "customer",
            "customerName phone address"
          )
          .sort({
            createdAt: -1,
          });
      return res.json({
        success: true,
        count: messages.length,
        data: messages,
      });
    } catch (error) {
      console.error(
        "WhatsApp Unread Inbox Error:",
        error
      );
      return res.status(500).json({
        success: false,
        message:
          "Failed to load unread messages.",
      });
    }
  }
);
// =====================================================
// Mark Message as Read
// =====================================================
router.put(
  "/:id/read",
  protect,
  async (req, res) => {
    try {
      const message =
        await WhatsAppMessage.findByIdAndUpdate(
          req.params.id,
          {
            $set: {
              inboxStatus: "read",
            },
          },
          {
            new: true,
          }
        );

      if (!message) {
        return res.status(404).json({
          success: false,
          message:
            "WhatsApp message not found.",
        });
      }

      return res.json({
        success: true,
        message:
          "WhatsApp message marked as read.",
        data: message,
      });
    } catch (error) {
      console.error(
        "WhatsApp Mark Read Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to mark WhatsApp message as read.",
      });
    }
  }
);
// =====================================================
// Delete WhatsApp Message
// =====================================================
router.delete(
  "/:id",
  protect,
  async (req, res) => {
    try {
      const message =
        await WhatsAppMessage.findByIdAndDelete(
          req.params.id
        );
      if (!message) {
        return res.status(404).json({
          success: false,
          message:
            "WhatsApp message not found.",
        });
      }
      return res.json({
        success: true,
        message:
          "WhatsApp message deleted successfully.",
      });
    } catch (error) {
      console.error(
        "WhatsApp Delete Error:",
        error
      );
      return res.status(500).json({
        success: false,
        message:
          "Failed to delete WhatsApp message.",
      });
    }
  }
);

// =====================================================
// Get WhatsApp Media
// =====================================================

router.get(
  "/media/:id",
  protect,
  async (req, res) => {
    try {
      const message =
        await WhatsAppMessage.findById(
          req.params.id
        );

      if (!message) {
        return res.status(404).json({
          success: false,
          message:
            "WhatsApp message not found.",
        });
      }

      if (!message.mediaId) {
        return res.status(404).json({
          success: false,
          message:
            "No media found for this message.",
        });
      }

      const {
        accessToken,
        baseUrl,
      } = getWhatsAppConfig();

      // Get media information from Meta
      const mediaInfoResponse =
        await fetch(
          `${baseUrl}/${message.mediaId}`,
          {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
          }
        );

      const mediaInfo =
        await mediaInfoResponse.json();

      if (!mediaInfoResponse.ok) {
        console.error(
          "WhatsApp Media Info Error:",
          mediaInfo
        );

        return res.status(500).json({
          success: false,
          message:
            "Failed to get WhatsApp media information.",
        });
      }

      const mediaUrl =
        mediaInfo?.url;

      const mimeType =
        mediaInfo?.mime_type ||
        message.mediaMimeType ||
        "application/octet-stream";

      if (!mediaUrl) {
        return res.status(500).json({
          success: false,
          message:
            "WhatsApp media URL not found.",
        });
      }

      // Download media from Meta
      const mediaResponse =
        await fetch(mediaUrl, {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
        });

      if (!mediaResponse.ok) {
        console.error(
          "WhatsApp Media Download Error:",
          mediaResponse.status
        );

        return res.status(500).json({
          success: false,
          message:
            "Failed to download WhatsApp media.",
        });
      }

      const buffer =
        Buffer.from(
          await mediaResponse.arrayBuffer()
        );

      res.setHeader(
        "Content-Type",
        mimeType
      );

      res.setHeader(
        "Content-Length",
        buffer.length
      );

      return res.send(buffer);

    } catch (error) {
      console.error(
        "WhatsApp Media Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load WhatsApp media.",
      });
    }
  }
);

// =====================================================
// Reply to WhatsApp Message
// =====================================================

router.post(
  "/:id/reply",
  protect,
  async (req, res) => {
    try {
      const {
        message: replyMessage,
      } = req.body || {};

      // ---------------------------------------------
      // Validate message
      // ---------------------------------------------

      if (
        !replyMessage ||
        !String(replyMessage).trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Reply message is required.",
        });
      }

      // ---------------------------------------------
      // Find original incoming message
      // ---------------------------------------------

      const originalMessage =
        await WhatsAppMessage.findById(
          req.params.id
        );

      if (!originalMessage) {
        return res.status(404).json({
          success: false,
          message:
            "WhatsApp message not found.",
        });
      }

      if (
        !originalMessage.phoneNumber
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Customer phone number not found.",
        });
      }

      // ---------------------------------------------
      // Send WhatsApp message
      // ---------------------------------------------

      const whatsappResponse =
        await sendWhatsAppMessage({
          to: originalMessage.phoneNumber,
          message:
            String(replyMessage).trim(),
        });

      // ---------------------------------------------
      // Get WhatsApp Message ID
      // ---------------------------------------------

      const outgoingWhatsAppId =
        whatsappResponse?.messages?.[0]?.id ||
        `outgoing_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2)}`;

      // ---------------------------------------------
      // Save outgoing message
      // ---------------------------------------------

      const savedReply =
        await WhatsAppMessage.create({
          customer:
            originalMessage.customer ||
            null,

          phoneNumber:
            originalMessage.phoneNumber,

          whatsappMessageId:
            outgoingWhatsAppId,

          type: "text",

          message:
            String(replyMessage).trim(),

          mediaId: null,

          mediaMimeType: null,

          mediaFilename: null,

          mediaCaption: "",

          whatsappTimestamp:
            new Date(),

          direction: "outgoing",

          inboxStatus: "read",

          paymentStatus:
            "not_payment_related",

          linkedBill:
            originalMessage.linkedBill ||
            null,

          linkedPayment:
            originalMessage.linkedPayment ||
            null,
        });

      // ---------------------------------------------
      // Mark original message as read
      // ---------------------------------------------

      await WhatsAppMessage.findByIdAndUpdate(
        originalMessage._id,
        {
          $set: {
            inboxStatus: "read",
          },
        }
      );

      // ---------------------------------------------
      // Response
      // ---------------------------------------------

      return res.status(200).json({
        success: true,

        message:
          "WhatsApp reply sent successfully.",

        data: {
          whatsappResponse,
          reply: savedReply,
        },
      });

    } catch (error) {
      console.error(
        "WhatsApp Reply Error:",
        error
      );

      return res.status(
        error.status || 500
      ).json({
        success: false,

        message:
          error.message ||
          "Failed to send WhatsApp reply.",

        error:
          error.meta ||
          undefined,
      });
    }
  }
);
module.exports = router;