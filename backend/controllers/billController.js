const Bill = require("../models/Bill");
const DailyEntry = require("../models/DailyEntry");
const Price = require("../models/Price");

// =======================================
// Generate Bill
// =======================================



const generateBill = async (req, res) => {
  try {

    const {
      customer,
      month,
      year,
      cycle,
    } = req.body;

    // ===============================
    // Billing Period
    // ===============================

    let startDate;
    let endDate;

    if (cycle === "1") {

      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month - 1, 16);

    } else {

      startDate = new Date(year, month - 1, 16);
      endDate = new Date(year, month, 1);

    }

    // ===============================
// Get Entries
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
  return (
    entry.breakfastQty > 0 ||
    entry.lunchQty > 0 ||
    entry.dinnerQty > 0 ||
    (entry.extraItems || []).length > 0
  );
});

// ===============================
// Date Wise Details
// ===============================

const dailyDetails = filteredEntries.map((entry) => {

  const breakfastAmount =
    entry.breakfastQty * price.breakfast;

  const lunchAmount =
    entry.lunchQty * price.lunch;

  const dinnerAmount =
    entry.dinnerQty * price.dinner;

 const extraAmount = (entry.extraItems || []).reduce(
  (total, item) => total + (item.amount || 0),
  0
);

  return {

  date: entry.date,

  breakfastQty: entry.breakfastQty,

  lunchQty: entry.lunchQty,

  dinnerQty: entry.dinnerQty,

  extraAmount,

  extraItems: entry.extraItems || [],

  breakfastAmount,

  lunchAmount,

  dinnerAmount,

  total:
    breakfastAmount +
    lunchAmount +
    dinnerAmount +
    extraAmount,

};

});

// ===============================
// Total Qty
// ===============================

let breakfastQty = 0;
let lunchQty = 0;
let dinnerQty = 0;
let totalExtraAmount = 0;

filteredEntries.forEach((entry) => {

  console.log("Entry =>", {
    date: entry.date,
    breakfastQty: entry.breakfastQty,
    lunchQty: entry.lunchQty,
    dinnerQty: entry.dinnerQty,
    extraAmount: entry.extraAmount,
  });

  breakfastQty += entry.breakfastQty;
  lunchQty += entry.lunchQty;
  dinnerQty += entry.dinnerQty;

  const extra = (entry.extraItems || []).reduce(
  (sum, item) => sum + (item.amount || 0),
  0
);

totalExtraAmount += extra;
});

// ===============================
// Amount
// ===============================

const breakfastAmount =
  breakfastQty * price.breakfast;

const lunchAmount =
  lunchQty * price.lunch;

const dinnerAmount =
  dinnerQty * price.dinner;

const totalAmount =
  breakfastAmount +
  lunchAmount +
  dinnerAmount +
  totalExtraAmount;

// ===============================
// Generate Invoice Number
// ===============================

const monthText = String(month).padStart(2, "0");

const prefix = `OMTS-${year}${monthText}`;

const lastInvoice = await Bill.findOne({
  invoiceNo: { $regex: `^${prefix}` },
}).sort({ createdAt: -1 });

let invoiceNo;

if (lastInvoice) {

  const lastNumber = parseInt(
    lastInvoice.invoiceNo.split("-")[2]
  );

  invoiceNo = `${prefix}-${String(lastNumber + 1).padStart(4, "0")}`;

} else {

  invoiceNo = `${prefix}-0001`;

}

// ===============================
// Existing Bill
// ===============================

let bill = await Bill.findOne({
  customer,
  month,
  year,
  cycle,
});
    

    if (bill) {

      bill.breakfastQty = breakfastQty;
      bill.lunchQty = lunchQty;
      bill.dinnerQty = dinnerQty;

      bill.breakfastAmount = breakfastAmount;
        bill.lunchAmount = lunchAmount;
        bill.dinnerAmount = dinnerAmount;

        // Extra Charges
        bill.extraAmount = totalExtraAmount;

        bill.totalAmount = totalAmount;
      bill.pendingAmount =
        totalAmount - bill.paidAmount;

      if (bill.pendingAmount <= 0) {

        bill.pendingAmount = 0;
        bill.status = "Paid";

      } else if (bill.paidAmount > 0) {

        bill.status = "Partial";

      } else {

        bill.status = "Pending";

      }

    } else {

bill = new Bill({

  invoiceNo,

  customer,
  month,
  year,
  cycle,

  breakfastQty,
  lunchQty,
  dinnerQty,

  breakfastAmount,
  lunchAmount,
  dinnerAmount,

  // Extra Charges
  extraAmount: totalExtraAmount,

  totalAmount,

  paidAmount: 0,
  pendingAmount: totalAmount,
  status: "Pending",

});
    }

    await bill.save();

    // ===============================
    // Response
    // ===============================

    res.json({

      success: true,

      data: {

        ...bill.toObject(),

        dailyDetails,

      },

    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
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
    })
      .sort({ createdAt: -1 });

    if (!bill) {
      return res.json({
        success: true,
        data: null,
      });
    }

    res.json({
      success: true,
      data: bill,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

module.exports = {
  generateBill,
  getLatestBill,
};