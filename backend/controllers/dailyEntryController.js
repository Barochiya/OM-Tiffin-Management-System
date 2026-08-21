const DailyEntry = require("../models/DailyEntry");

// =======================================
// Normalize Calendar Date
// YYYY-MM-DD -> UTC midnight
// =======================================
const normalizeDate = (value) => {
  if (!value) {
    throw new Error("Date is required.");
  }

  const dateString = String(value).slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error("Invalid date format. Use YYYY-MM-DD.");
  }

  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  const normalizedDate = new Date(
    Date.UTC(year, month - 1, day)
  );

  if (Number.isNaN(normalizedDate.getTime())) {
    throw new Error("Invalid date.");
  }

  return normalizedDate;
};

// =======================================
// Add / Update Daily Entry
// =======================================
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

    if (!customer || !date) {
      return res.status(400).json({
        success: false,
        message: "Customer and date are required.",
      });
    }

    const normalizedDate = normalizeDate(date);

    // =======================================
    // Find by Calendar Date
    // This also handles old records whose
    // timestamp may be 18:30 instead of 00:00.
    // =======================================

    const startDate = new Date(normalizedDate);
    const endDate = new Date(normalizedDate);
    endDate.setUTCDate(endDate.getUTCDate() + 1);

    let entries = await DailyEntry.find({
      customer,
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    }).sort({ createdAt: 1 });

    let entry;

    if (entries.length > 0) {
      // Keep the oldest record as the main record.
      entry = entries[0];

      entry.date = normalizedDate;
      entry.breakfastQty = Number(breakfastQty || 0);
      entry.lunchQty = Number(lunchQty || 0);
      entry.dinnerQty = Number(dinnerQty || 0);
      entry.extraItems = Array.isArray(extraItems)
        ? extraItems
        : [];
      entry.remark = remark || "";

      await entry.save();

      // =======================================
      // Remove any old duplicate records for
      // the same customer + calendar date.
      // =======================================

      if (entries.length > 1) {
        const duplicateIds = entries
          .slice(1)
          .map((item) => item._id);

        await DailyEntry.deleteMany({
          _id: { $in: duplicateIds },
        });
      }
    } else {
      entry = await DailyEntry.create({
        customer,
        date: normalizedDate,
        breakfastQty: Number(breakfastQty || 0),
        lunchQty: Number(lunchQty || 0),
        dinnerQty: Number(dinnerQty || 0),
        extraItems: Array.isArray(extraItems)
          ? extraItems
          : [],
        remark: remark || "",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Daily Entry Saved Successfully",
      data: entry,
    });
  } catch (error) {
    console.error("Save Daily Entry Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================================
// Get Entries By Date
// =======================================
const getEntriesByDate = async (req, res) => {
  try {
    const normalizedDate = normalizeDate(req.params.date);

    const startDate = new Date(normalizedDate);

    const endDate = new Date(normalizedDate);
    endDate.setUTCDate(endDate.getUTCDate() + 1);

    const entries = await DailyEntry.find({
      date: {
        $gte: startDate,
        $lt: endDate,
      },
    }).populate("customer");

    return res.status(200).json({
      success: true,
      data: entries,
    });
  } catch (error) {
    console.error("Get Entries By Date Error:", error);

    return res.status(500).json({
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
        Date.UTC(
          numericYear,
          numericMonth - 1,
          1
        )
      );

      endDate = new Date(
        Date.UTC(
          numericYear,
          numericMonth - 1,
          16
        )
      );
    } else {
      // 16th to month end
      startDate = new Date(
        Date.UTC(
          numericYear,
          numericMonth - 1,
          16
        )
      );

      endDate = new Date(
        Date.UTC(
          numericYear,
          numericMonth,
          1
        )
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