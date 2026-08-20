const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");

const Tiffin = require("../models/Tiffin");
const Bill = require("../models/Bill");
const AnnouncementDelivery = require("../models/AnnouncementDelivery");

const {
  sendWhatsAppTemplate,
} = require("../utils/whatsappSender");

// =====================================================
// SEND BULK PAYMENT REMINDERS
// =====================================================

router.post("/send-bulk", protect, async (req, res) => {
  try {
    console.log("========================================");
    console.log("Bulk Payment Reminder Started");
    console.log("========================================");

    // -------------------------------------------------
    // Get all customers having a phone number
    // -------------------------------------------------

    const customers = await Tiffin.find({
      phone: {
        $exists: true,
        $ne: "",
      },
    }).lean();

    if (!customers.length) {
      return res.status(200).json({
        success: true,
        message: "No customers found.",
        data: {
          totalCustomers: 0,
          pendingCustomers: 0,
          sent: 0,
          failed: 0,
          skipped: 0,
          results: [],
        },
      });
    }

    // -------------------------------------------------
    // Get latest bill for every customer
    // -------------------------------------------------

    const latestBills = await Bill.aggregate([
      {
        $sort: {
          createdAt: -1,
        },
      },

      {
        $group: {
          _id: "$customer",
          latestBill: {
            $first: "$$ROOT",
          },
        },
      },
    ]);

    const latestBillMap = new Map();

    latestBills.forEach((item) => {
      latestBillMap.set(
        String(item._id),
        item.latestBill
      );
    });

    // -------------------------------------------------
    // Find customers with actual pending amount
    // -------------------------------------------------

    const pendingCustomers = [];

    for (const customer of customers) {
      const latestBill = latestBillMap.get(
        String(customer._id)
      );

      const pendingAmount = Number(
        latestBill?.pendingAmount ??
          customer.pendingAmount ??
          0
      );

      if (pendingAmount <= 0) {
        continue;
      }

      pendingCustomers.push({
        customer,
        latestBill,
        pendingAmount,
      });
    }

    console.log(
      "Total Customers:",
      customers.length
    );

    console.log(
      "Pending Customers:",
      pendingCustomers.length
    );

    // -------------------------------------------------
    // Nothing pending
    // -------------------------------------------------

    if (!pendingCustomers.length) {
      return res.status(200).json({
        success: true,
        message:
          "No customers have pending payments.",
        data: {
          totalCustomers:
            customers.length,
          pendingCustomers: 0,
          sent: 0,
          failed: 0,
          skipped: customers.length,
          results: [],
        },
      });
    }

    // -------------------------------------------------
    // Send reminder customer by customer
    // -------------------------------------------------

    const results = [];

    for (const item of pendingCustomers) {
      const {
        customer,
        pendingAmount,
      } = item;

      let delivery = null;

      try {
        // ---------------------------------------------
        // Validate phone
        // ---------------------------------------------

        if (!customer.phone) {
          results.push({
            customerId:
              customer._id,
            customerName:
              customer.customerName,
            phone: null,
            pendingAmount,
            success: false,
            status: "skipped",
            error:
              "Customer phone number not found.",
          });

          continue;
        }

        // ---------------------------------------------
        // Create tracking record
        // ---------------------------------------------

        delivery =
          await AnnouncementDelivery.create({
            customer: customer._id,

            customerName:
              customer.customerName ||
              "Customer",

            phoneNumber:
              customer.phone,

            templateName:
              "om_tiffin_payment_reminder",

            title:
              "Payment Reminder",

            message:
              `Payment reminder for pending amount ₹${pendingAmount}`,

            status: "pending",
          });

        // ---------------------------------------------
        // Template variables
        //
        // {{1}} = Customer Name
        // {{2}} = Pending Amount
        // ---------------------------------------------

        const components = [
          {
            type: "body",

            parameters: [
              {
                type: "text",
                text:
                  String(
                    customer.customerName ||
                      "Customer"
                  ),
              },

              {
                type: "text",
                text:
                  String(
                    pendingAmount
                  ),
              },
            ],
          },
        ];

        // ---------------------------------------------
        // Send WhatsApp Template
        // ---------------------------------------------

        const response =
          await sendWhatsAppTemplate({
            to: customer.phone,

            templateName:
              "om_tiffin_payment_reminder",

            languageCode: "en_GB",

            components,
          });

        const messageId =
          response?.messages?.[0]?.id ||
          null;

        if (!messageId) {
          throw new Error(
            "WhatsApp API did not return a message ID."
          );
        }

        // ---------------------------------------------
        // Update delivery record
        // ---------------------------------------------

        delivery.status = "sent";

        delivery.whatsappMessageId =
          messageId;

        delivery.sentAt =
          new Date();

        await delivery.save();

        results.push({
          customerId:
            customer._id,

          customerName:
            customer.customerName,

          phone:
            customer.phone,

          pendingAmount,

          success: true,

          status: "sent",

          messageId,
        });

        console.log(
          "Payment reminder sent:",
          customer.customerName,
          pendingAmount
        );
      } catch (error) {
        // -------------------------------------------
        // Mark failed
        // -------------------------------------------

        if (delivery) {
          delivery.status =
            "failed";

          delivery.failureReason =
            error.meta?.message ||
            error.message ||
            "WhatsApp sending failed.";

          await delivery.save();
        }

        results.push({
          customerId:
            customer._id,

          customerName:
            customer.customerName,

          phone:
            customer.phone,

          pendingAmount,

          success: false,

          status: "failed",

          error:
            error.meta?.message ||
            error.message ||
            "WhatsApp sending failed.",
        });

        console.error(
          "Payment reminder failed:",
          customer.customerName,
          error.meta?.message ||
            error.message
        );
      }
    }

    // -------------------------------------------------
    // Final summary
    // -------------------------------------------------

    const sent =
      results.filter(
        (item) =>
          item.success === true
      ).length;

    const failed =
      results.filter(
        (item) =>
          item.status === "failed"
      ).length;

    const skipped =
      results.filter(
        (item) =>
          item.status === "skipped"
      ).length;

    console.log(
      "========================================"
    );

    console.log(
      "Bulk Payment Reminder Completed"
    );

    console.log({
      totalCustomers:
        customers.length,

      pendingCustomers:
        pendingCustomers.length,

      sent,

      failed,

      skipped,
    });

    console.log(
      "========================================"
    );

    return res.status(200).json({
      success: true,

      message:
        failed === 0
          ? "Payment reminders sent successfully."
          : "Payment reminders completed with some failures.",

      data: {
        totalCustomers:
          customers.length,

        pendingCustomers:
          pendingCustomers.length,

        sent,

        failed,

        skipped,

        results,
      },
    });
  } catch (error) {
    console.error(
      "Bulk Payment Reminder Error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        "Failed to send payment reminders.",
    });
  }
});

module.exports = router;