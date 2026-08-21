const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const WhatsAppMessage = require("../models/WhatsAppMessage");

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

router.get("/unread", protect, async (req, res) => {
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
});

module.exports = router;