const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const WhatsAppMessage = require("../models/WhatsAppMessage");
const {
  getWhatsAppConfig,
} = require("../utils/whatsappSender");
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
module.exports = router;


