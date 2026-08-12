const express = require("express");
const router = express.Router();

const Tiffin = require("../models/Tiffin");

const {
  sendWhatsAppMessage,
} = require("../utils/whatsappSender");

// ======================================================
// SEND ANNOUNCEMENT TO CUSTOMERS
// ======================================================

router.post("/send", async (req, res) => {
  try {
    const {
      title,
      message,
      audience,
      customerIds = [],
    } = req.body;

    // ------------------------------------------
    // Validation
    // ------------------------------------------

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Announcement title is required.",
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Announcement message is required.",
      });
    }

    if (!Array.isArray(customerIds)) {
      return res.status(400).json({
        success: false,
        message: "customerIds must be an array.",
      });
    }

    if (customerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No customers selected.",
      });
    }

    // ------------------------------------------
    // Find Customers
    // ------------------------------------------

    const customers = await Tiffin.find({
      _id: { $in: customerIds },
    });

    if (!customers.length) {
      return res.status(404).json({
        success: false,
        message: "No selected customers found.",
      });
    }

    // ------------------------------------------
    // Announcement Message
    // ------------------------------------------

    const whatsappMessage =
      `📢 *${title.trim()}*\n\n` +
      `${message.trim()}\n\n` +
      `Thank you for choosing OM TIFFIN SERVICE. 🙏`;

    console.log("📢 Announcement Sending Started");

    console.log({
      audience: audience || "all",
      requestedCustomers: customerIds.length,
      foundCustomers: customers.length,
    });

    // ------------------------------------------
    // Send To Every Customer
    // ------------------------------------------

    const results = [];

    for (const customer of customers) {
      if (!customer.phone) {
        results.push({
          customerId: customer._id,
          customerName: customer.customerName,
          phone: null,
          success: false,
          error: "Customer phone number not found.",
        });

        continue;
      }

      try {
        const result = await sendWhatsAppMessage({
          to: customer.phone,
          message: whatsappMessage,
        });

        results.push({
          customerId: customer._id,
          customerName: customer.customerName,
          phone: customer.phone,
          success: true,
          messageId:
            result?.messages?.[0]?.id || null,
        });

        console.log(
          `✅ Announcement sent to ${customer.customerName || "Customer"}`
        );
      } catch (error) {
        results.push({
          customerId: customer._id,
          customerName: customer.customerName,
          phone: customer.phone,
          success: false,
          error:
            error.meta?.message ||
            error.message ||
            "WhatsApp sending failed.",
        });

        console.error(
          `❌ Announcement failed for ${customer.customerName || "Customer"}:`,
          error.meta?.message || error.message
        );
      }
    }

    // ------------------------------------------
    // Final Result
    // ------------------------------------------

    const sent = results.filter(
      (item) => item.success
    ).length;

    const failed = results.filter(
      (item) => !item.success
    ).length;

    console.log("📢 Announcement Sending Completed");

    console.log({
      total: results.length,
      sent,
      failed,
    });

    return res.status(200).json({
      success: true,

      message:
        failed === 0
          ? "Announcement sent successfully to all customers."
          : "Announcement sending completed with some failures.",

      data: {
        title: title.trim(),
        message: message.trim(),
        audience: audience || "all",
        totalCustomers: results.length,
        sent,
        failed,
        results,
        createdAt: new Date(),
      },

      whatsappSent: sent > 0,
    });
  } catch (error) {
    console.error(
      "❌ Announcement Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to send announcement.",
    });
  }
});

// ======================================================
// HEALTH CHECK
// ======================================================

router.get("/test", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Announcement API is working.",
  });
});

module.exports = router;