const DailyEntry = require("../models/DailyEntry");

// ===============================
// Add / Update Daily Entry
// ===============================
const saveDailyEntry = async (req, res) => {
  try {

    const {
      customer,
      date,
      breakfastQty,
      lunchQty,
      dinnerQty,
      extraItems,
      remark,
    } = req.body;

    let entry = await DailyEntry.findOne({
      customer,
      date,
    });

    if (entry) {

      entry.breakfastQty = breakfastQty;
      entry.lunchQty = lunchQty;
      entry.dinnerQty = dinnerQty;

      // ⭐ Multiple Extra Items
      entry.extraItems = extraItems || [];

      entry.remark = remark;

      await entry.save();

    } else {

      entry = await DailyEntry.create({

        customer,
        date,

        breakfastQty,
        lunchQty,
        dinnerQty,

        // ⭐ Multiple Extra Items
        extraItems: extraItems || [],

        remark,

      });

    }

    res.status(200).json({
      success: true,
      message: "Daily Entry Saved Successfully",
      data: entry,
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ===============================
// Get Entries By Date
// ===============================
const getEntriesByDate = async (req, res) => {

  try {

    const date = req.params.date;

    const entries = await DailyEntry.find({
      date,
    }).populate("customer");

    res.status(200).json({
      success: true,
      data: entries,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

// =======================================
// Get Customer Entries By Billing Cycle
// =======================================
const getCustomerEntries = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { month, year, cycle } = req.query;

    if (!customerId || !month || !year || !cycle) {
      return res.status(400).json({
        success: false,
        message:
          "Customer, month, year and billing cycle are required.",
      });
    }

    if (!["1", "2"].includes(String(cycle))) {
      return res.status(400).json({
        success: false,
        message: "Invalid billing cycle. Use 1 or 2.",
      });
    }

    const numericMonth = Number(month);
    const numericYear = Number(year);

    if (
      !Number.isInteger(numericMonth) ||
      numericMonth < 1 ||
      numericMonth > 12
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid month.",
      });
    }

    if (
      !Number.isInteger(numericYear) ||
      numericYear < 2000
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid year.",
      });
    }

    let startDate;
    let endDate;

    if (String(cycle) === "1") {
      // 1st to 15th
      startDate = new Date(
        numericYear,
        numericMonth - 1,
        1
      );

      endDate = new Date(
        numericYear,
        numericMonth - 1,
        16
      );
    } else {
      // 16th to month end
      startDate = new Date(
        numericYear,
        numericMonth - 1,
        16
      );

      endDate = new Date(
        numericYear,
        numericMonth,
        1
      );
    }

    const entries = await DailyEntry.find({
      customer: customerId,
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    }).sort({ date: 1 });

    return res.status(200).json({
      success: true,
      data: entries,
    });
  } catch (error) {
    console.error(
      "Get Customer Daily Entries Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  saveDailyEntry,
  getEntriesByDate,
  getCustomerEntries,
};