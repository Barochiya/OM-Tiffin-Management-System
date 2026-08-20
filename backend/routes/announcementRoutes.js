const express = require("express");
const router = express.Router();

const Tiffin = require("../models/Tiffin");
const AnnouncementDelivery = require(
  "../models/AnnouncementDelivery"
);

const {
  sendWhatsAppTemplate,
} = require("../utils/whatsappSender");

const buildAnnouncementTemplate =
  require("../utils/buildAnnouncementTemplate");

// =====================================================
// SEND ANNOUNCEMENT TO CUSTOMERS
// =====================================================

router.post("/send", async (req, res) => {
  try {
    const {
      templateType = "custom",
      title = "",
      message = "",
      audience,
      customerIds = [],

      // Template-specific data
      holidayDate,
      reason,
      resumeDate,
      festivalName,
      delayReason,
      expectedTime,
      breakfast,
      lunch,
      dinner,
    } = req.body;

    // ------------------------------------------
    // Validation
    // ------------------------------------------

    const allowedTemplateTypes = [
      "custom",
      "holiday",
      "festival",
      "delay",
      "menu",
    ];

    if (
      !allowedTemplateTypes.includes(
        templateType
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid announcement template type.",
      });
    }

    if (!Array.isArray(customerIds)) {
      return res.status(400).json({
        success: false,
        message:
          "customerIds must be an array.",
      });
    }

    if (customerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "No customers selected.",
      });
    }

    // Custom announcement requires message
    if (
      templateType === "custom" &&
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Announcement message is required.",
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
        message:
          "No selected customers found.",
      });
    }

    console.log(
      "Announcement Sending Started"
    );

    console.log({
      templateType,
      audience: audience || "all",
      requestedCustomers:
        customerIds.length,
      foundCustomers:
        customers.length,
    });

    // ------------------------------------------
    // Template Data
    // ------------------------------------------

    const templateData = {
      holidayDate,
      reason,
      resumeDate,
      festivalName,
      delayReason,
      expectedTime,
      breakfast,
      lunch,
      dinner,
      message: message.trim(),
    };

    // ------------------------------------------
    // Send To Every Customer
    // ------------------------------------------

    const results = [];

    for (const customer of customers) {
      if (!customer.phone) {
        results.push({
          customerId: customer._id,
          customerName:
            customer.customerName,
          phone: null,
          success: false,
          status: "failed",
          error:
            "Customer phone number not found.",
        });

        continue;
      }

      let delivery = null;

      try {
        // --------------------------------------
        // Build Template
        // --------------------------------------

        const builtTemplate =
          buildAnnouncementTemplate(
            templateType,
            customer,
            templateData
          );

        if (!builtTemplate) {
          throw new Error(
            "Failed to build WhatsApp template."
          );
        }

        // --------------------------------------
        // Create Initial Delivery Record
        // --------------------------------------

        delivery =
          await AnnouncementDelivery.create({
            customer: customer._id,
            customerName:
              customer.customerName ||
              "Customer",
            phoneNumber: customer.phone,
            templateName:
              builtTemplate.template,
            title:
              title.trim() ||
              builtTemplate.template,
            message:
              message.trim() ||
              builtTemplate.template,
            status: "pending",
          });

        // --------------------------------------
        // WhatsApp Template Components
        // --------------------------------------

        const components = [
          {
            type: "body",
            parameters:
              builtTemplate.variables.map(
                (value) => ({
                  type: "text",
                  text: String(
                    value ?? ""
                  ),
                })
              ),
          },
        ];

        // --------------------------------------
        // Send WhatsApp Template
        // --------------------------------------

        const result =
          await sendWhatsAppTemplate({
            to: customer.phone,

            templateName:
              builtTemplate.template,

            languageCode:
              builtTemplate.language,

            components,
          });

        const messageId =
          result?.messages?.[0]?.id ||
          null;

        if (!messageId) {
          throw new Error(
            "WhatsApp API did not return a message ID."
          );
        }

        // --------------------------------------
        // Update Delivery Record
        // --------------------------------------

        delivery.status = "sent";
        delivery.whatsappMessageId =
          messageId;
        delivery.sentAt = new Date();

        await delivery.save();

        results.push({
          customerId: customer._id,
          customerName:
            customer.customerName,
          phone: customer.phone,
          success: true,
          status: "sent",
          template:
            builtTemplate.template,
          messageId,
        });

        console.log(
          `Announcement sent to ${
            customer.customerName ||
            "Customer"
          }`
        );
      } catch (error) {
        // --------------------------------------
        // Mark Delivery Failed
        // --------------------------------------

        if (delivery) {
          delivery.status = "failed";

          delivery.failureReason =
            error.meta?.message ||
            error.message ||
            "WhatsApp sending failed.";

          await delivery.save();
        }

        results.push({
          customerId: customer._id,
          customerName:
            customer.customerName,
          phone: customer.phone,
          success: false,
          status: "failed",
          error:
            error.meta?.message ||
            error.message ||
            "WhatsApp sending failed.",
        });

        console.error(
          `Announcement failed for ${
            customer.customerName ||
            "Customer"
          }:`,
          error.meta?.message ||
            error.message
        );
      }
    }

    // ------------------------------------------
    // Final Result
    // ------------------------------------------

    const sent =
      results.filter(
        (item) =>
          item.success === true
      ).length;

    const failed =
      results.filter(
        (item) =>
          item.success === false
      ).length;

    console.log(
      "Announcement Sending Completed"
    );

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
        templateType,
        title: title.trim(),
        message: message.trim(),
        audience:
          audience || "all",

        totalCustomers:
          results.length,

        sent,
        failed,

        results,

        createdAt:
          new Date(),
      },

      whatsappSent:
        sent > 0,
    });
  } catch (error) {
    console.error(
      "Announcement Error:",
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

// =====================================================
// HEALTH CHECK
// =====================================================

router.get("/test", (req, res) => {
  return res.status(200).json({
    success: true,
    message:
      "Announcement API is working.",
  });
});

module.exports = router;