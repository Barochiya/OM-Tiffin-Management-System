const Bill = require("../models/Bill");
const DailyEntry = require("../models/DailyEntry");
const Price = require("../models/Price");
const Tiffin = require("../models/Tiffin");
const applyAdvance = require("../utils/advanceHelper");
const {
  sendPdfBillWhatsApp,
  sendBillTemplateWithPdf,
} = require("../utils/whatsappSender");
const generateBillPdf = require("../utils/billPdfGenerator");

// =======================================
// Generate Bill
// =======================================

const generateBill = async (req, res) => {
  try {
    const { customer, month, year, cycle } = req.body;

    // ===============================
    // Validate Request
    // ===============================
    if (!customer || !month || !year || !cycle) {
      return res.status(400).json({
        success: false,
        message: "Customer, month, year and billing cycle are required.",
      });
    }

    if (!["1", "2"].includes(String(cycle))) {
      return res.status(400).json({
        success: false,
        message: "Invalid billing cycle. Use 1 or 2.",
      });
    }

    // ===============================
    // Billing Period
    // ===============================
    let startDate;
    let endDate;

    if (String(cycle) === "1") {
      // 1st to 15th
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month - 1, 16);
    } else {
      // 16th to month end
      startDate = new Date(year, month - 1, 16);
      endDate = new Date(year, month, 1);
    }

    // ===============================
    // Get Daily Entries
    // ===============================
    const entries = await DailyEntry.find({
      customer,
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    }).sort({ date: 1 });

    console.log("===== DAILY ENTRIES =====");

    entries.forEach((entry) => {
      console.log({
        date: entry.date,
        breakfastQty: entry.breakfastQty,
        lunchQty: entry.lunchQty,
        dinnerQty: entry.dinnerQty,
        extraItems: entry.extraItems,
      });
    });

    // ===============================
    // Get Price
    // ===============================
    const price = await Price.findOne().sort({
      createdAt: -1,
    });

    if (!price) {
      return res.status(404).json({
        success: false,
        message: "Price settings not found",
      });
    }

    // ===============================
    // Remove Empty Days
    // ===============================
    const filteredEntries = entries.filter((entry) => {
      const breakfastQty = Number(entry.breakfastQty || 0);
      const lunchQty = Number(entry.lunchQty || 0);
      const dinnerQty = Number(entry.dinnerQty || 0);

      const extraItems = Array.isArray(entry.extraItems)
        ? entry.extraItems
        : [];

      return (
        breakfastQty > 0 ||
        lunchQty > 0 ||
        dinnerQty > 0 ||
        extraItems.some((item) => Number(item?.amount || 0) > 0)
      );
    });

    // ===============================
    // Date-Wise Details
    // ===============================
    const dailyDetails = filteredEntries.map((entry) => {
      const breakfastQty = Number(entry.breakfastQty || 0);
      const lunchQty = Number(entry.lunchQty || 0);
      const dinnerQty = Number(entry.dinnerQty || 0);

      const breakfastAmount =
        breakfastQty * Number(price.breakfast || 0);

      const lunchAmount =
        lunchQty * Number(price.lunch || 0);

      const dinnerAmount =
        dinnerQty * Number(price.dinner || 0);

      const extraItems = Array.isArray(entry.extraItems)
        ? entry.extraItems.map((item) => ({
            description: item?.description || "",
            amount: Number(item?.amount || 0),
          }))
        : [];

      const extraAmount = extraItems.reduce(
        (total, item) => total + Number(item.amount || 0),
        0
      );

      const dailyTotal =
        breakfastAmount +
        lunchAmount +
        dinnerAmount +
        extraAmount;

      return {
        date: entry.date,

        breakfastQty,
        lunchQty,
        dinnerQty,

        breakfastAmount,
        lunchAmount,
        dinnerAmount,

        extraItems,
        extraAmount,

        dailyTotal,

        remark: entry.remark || "",
      };
    });

    // ===============================
    // Total Quantity
    // ===============================
    let breakfastQty = 0;
    let lunchQty = 0;
    let dinnerQty = 0;
    let totalExtraAmount = 0;

    filteredEntries.forEach((entry) => {
      const breakfast = Number(entry.breakfastQty || 0);
      const lunch = Number(entry.lunchQty || 0);
      const dinner = Number(entry.dinnerQty || 0);

      breakfastQty += breakfast;
      lunchQty += lunch;
      dinnerQty += dinner;

      const extraItems = Array.isArray(entry.extraItems)
        ? entry.extraItems
        : [];

      const extra = extraItems.reduce(
        (sum, item) => sum + Number(item?.amount || 0),
        0
      );

      totalExtraAmount += extra;
    });

    // ===============================
    // Overall Amount
    // ===============================
    const breakfastAmount =
      breakfastQty * Number(price.breakfast || 0);

    const lunchAmount =
      lunchQty * Number(price.lunch || 0);

    const dinnerAmount =
      dinnerQty * Number(price.dinner || 0);

    const totalAmount =
      breakfastAmount +
      lunchAmount +
      dinnerAmount +
      totalExtraAmount;

    // ===============================
    // Customer
    // ===============================
    const customerData = await Tiffin.findById(customer);

    if (!customerData) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

    // ===============================
    // Don't Generate Empty Bill
    // ===============================
    if (totalAmount === 0) {
      return res.status(400).json({
        success: false,
        message: "No meals found for selected billing cycle.",
      });
    }

    // ===============================
    // Existing Bill
    // ===============================
    let bill = await Bill.findOne({
      customer,
      month,
      year,
      cycle: String(cycle),
    });

    // ===============================
    // Generate Invoice Number
    // Only for New Bill
    // ===============================
    let invoiceNo;

    if (!bill) {
      const monthText = String(month).padStart(2, "0");
      const prefix = `OMTS-${year}${monthText}`;

      const lastInvoice = await Bill.findOne({
        invoiceNo: { $regex: `^${prefix}-` },
      }).sort({ createdAt: -1 });

      if (lastInvoice?.invoiceNo) {
        const parts = lastInvoice.invoiceNo.split("-");
        const lastNumber = parseInt(parts[2], 10);

        invoiceNo = `${prefix}-${String(
          Number.isNaN(lastNumber) ? 1 : lastNumber + 1
        ).padStart(4, "0")}`;
      } else {
        invoiceNo = `${prefix}-0001`;
      }
    }

    // ===============================
    // Update Existing Bill
    // ===============================
    if (bill) {
      bill.breakfastQty = breakfastQty;
      bill.lunchQty = lunchQty;
      bill.dinnerQty = dinnerQty;

      bill.breakfastAmount = breakfastAmount;
      bill.lunchAmount = lunchAmount;
      bill.dinnerAmount = dinnerAmount;

      bill.extraAmount = totalExtraAmount;

      // IMPORTANT:
      // Save complete date-wise details
      bill.dailyDetails = dailyDetails;

      bill.totalAmount = totalAmount;

      // Keep existing paid amount and apply advance
      applyAdvance(customerData, bill);

      bill.pendingAmount = Math.max(
        0,
        totalAmount - Number(bill.paidAmount || 0)
      );

      if (bill.pendingAmount <= 0) {
        bill.pendingAmount = 0;
        bill.status = "Paid";
      } else if (Number(bill.paidAmount || 0) > 0) {
        bill.status = "Partial";
      } else {
        bill.status = "Pending";
      }
    } else {
      // ===============================
      // Create New Bill
      // ===============================
      bill = new Bill({
        invoiceNo,

        customer,
        month,
        year,
        cycle: String(cycle),

        breakfastQty,
        lunchQty,
        dinnerQty,

        breakfastAmount,
        lunchAmount,
        dinnerAmount,

        extraAmount: totalExtraAmount,

        // IMPORTANT:
        // Save date-wise details
        dailyDetails,

        totalAmount,

        paidAmount: 0,
        pendingAmount: totalAmount,
        status: "Pending",
      });

      // Apply customer advance
      applyAdvance(customerData, bill);

      bill.pendingAmount = Math.max(
        0,
        totalAmount - Number(bill.paidAmount || 0)
      );

      if (bill.pendingAmount <= 0) {
        bill.pendingAmount = 0;
        bill.status = "Paid";
      } else if (Number(bill.paidAmount || 0) > 0) {
        bill.status = "Partial";
      } else {
        bill.status = "Pending";
      }
    }

    // ===============================
    // Save Customer Advance Changes
    // ===============================
    if (customerData.isModified()) {
      await customerData.save();
    }

    // ===============================
    // Save Bill
    // ===============================
    await bill.save();

    // ===============================
    // Response
    // ===============================
    await bill.populate("customer");
    return res.json({
      success: true,
      data: bill,
    });
  } catch (error) {
    console.error("Generate Bill Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================================
// Get Latest Bill of Customer
// =======================================

const getLatestBill = async (req, res) => {
  try {
    const { customerId } = req.params;

    const bill = await Bill.findOne({
      customer: customerId,
    }).sort({ createdAt: -1 });

    if (!bill) {
      return res.json({
        success: true,
        data: null,
      });
    }

    return res.json({
      success: true,
      data: bill,
    });
  } catch (error) {
    console.error("Get Latest Bill Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =======================================
// Send Generated Bill PDF via WhatsApp
// =======================================

const sendBillWhatsApp = async (req, res) => {
  try {
    const billId = req.body.billId;

    if (!billId) {
      return res.status(400).json({
        success: false,
        message: "billId is required.",
      });
    }

    const bill = await Bill.findById(billId);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found.",
      });
    }

    const customer = await Tiffin.findById(
      bill.customer
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found.",
      });
    }

   if (!customer.phone) {
  bill.whatsappDelivery = {
    delivered: false,
    sentAt: null,
    reason: "Mobile number missing",
  };

  await bill.save();

  return res.status(400).json({
    success: false,
    message: "Customer phone number not found.",
  });
}

    const pdfBuffer = req.file?.buffer;

if (!pdfBuffer) {
  return res.status(400).json({
    success: false,
    message: "PDF file not found.",
  });
}

    const filename =
      `OM-Tiffin-${
        bill.invoiceNo || bill._id
      }.pdf`;

    const result =
  await sendBillTemplateWithPdf({
    phone: customer.phone,
    pdfBuffer,
    filename,
    customerName: customer.customerName,
    invoiceNo: bill.invoiceNo,
    totalAmount: bill.totalAmount,
  });
bill.whatsappDelivery = {
  delivered: true,
  sentAt: new Date(),
  reason: "Delivered",
};

await bill.save();

return res.json({
  success: true,
  message:
  "Bill template with PDF sent successfully on WhatsApp.",
});
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =======================================
// Generate All Bills
// =======================================

const generateAllBills = async (req, res) => {
  try {
    const { month, year, cycle } = req.body;

    const customers = await Tiffin.find({
      status: "Active",
    });

    const completedCustomers = [];

    const failedCustomers = [];

    for (const customer of customers) {
      try {
        const fakeReq = {
          body: {
            customer: customer._id,
            month,
            year,
            cycle,
          },
        };

        let generatedBill = null;

        const fakeRes = {
          json: (data) => {
            generatedBill = data.data;
          },

          status: () => ({
            json: () => {},
          }),
        };

        await generateBill(fakeReq, fakeRes);

        if (!generatedBill) {
          failedCustomers.push({
            customer: customer.customerName,
            reason: "Bill generation failed",
          });

          continue;
        }

        if (!customer.phone) {
          failedCustomers.push({
            customer: customer.customerName,
            reason: "Phone number not found",
          });

          continue;
        }

      const pdfBuffer = await generateBillPdf(
  generatedBill,
  customer
);

await sendBillTemplateWithPdf({
  phone: customer.phone,

  pdfBuffer,

  filename: `OM-Tiffin-${
    generatedBill.invoiceNo
  }.pdf`,

  customerName:
    customer.customerName,

  invoiceNo:
    generatedBill.invoiceNo,

  totalAmount:
    generatedBill.totalAmount,
});

completedCustomers.push({
  customer: customer.customerName,
  billId: generatedBill._id,
});
      } catch (error) {
        failedCustomers.push({
          customer: customer.customerName,
          reason: error.message,
        });
      }
    }

    return res.json({
      success: true,

      total: customers.length,

      completed: completedCustomers.length,

      failed: failedCustomers.length,

      completedCustomers,

      failedCustomers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// =======================================
// Get Bill Delivery Status
// =======================================

const getBillDeliveryStatus = async (req, res) => {
  try {
    const bills = await Bill.find()
      .populate(
        "customer",
        "customerName phone"
      )
      .sort({
        createdAt: -1,
      });

    const deliveryStatus = bills.map(
      (bill) => ({
        billId: bill._id,

        customer:
          bill.customer?.customerName ||
          "Unknown",

        invoice:
          bill.invoiceNo || "-",

        month: bill.month,

        year: bill.year,

        cycle: bill.cycle,

        delivered:
          bill.whatsappDelivery
            ?.delivered || false,

        sentAt:
          bill.whatsappDelivery
            ?.sentAt || null,

        reason:
          bill.whatsappDelivery
            ?.reason || "Not sent yet",
      })
    );

    return res.json({
      success: true,
      data: deliveryStatus,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  generateBill,
  generateAllBills,
  getLatestBill,
  sendBillWhatsApp,
  getBillDeliveryStatus,
};