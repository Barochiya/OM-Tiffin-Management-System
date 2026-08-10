const express = require("express");

const router = express.Router();

// ======================================================
// CREATE / PREPARE ANNOUNCEMENT
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

    // ------------------------------------------
    // Announcement data
    // ------------------------------------------

    const announcement = {
      title: title.trim(),
      message: message.trim(),
      audience: audience || "all",
      customerIds,
      totalCustomers: customerIds.length,
      createdAt: new Date(),
    };

    console.log("📢 Announcement Request");
    console.log(JSON.stringify(announcement, null, 2));

    // ------------------------------------------
    // IMPORTANT
    // ------------------------------------------
    // WhatsApp API sending will be connected
    // after Meta Production verification.
    //
    // DO NOT fake a WhatsApp success response.
    // ------------------------------------------

    return res.status(200).json({
      success: true,
      message:
        "Announcement prepared successfully. WhatsApp sending is pending Meta Production setup.",
      data: announcement,
      whatsappSent: false,
    });
  } catch (error) {
    console.error("❌ Announcement Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to prepare announcement.",
      error: error.message,
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