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

module.exports = {
  saveDailyEntry,
  getEntriesByDate,
};