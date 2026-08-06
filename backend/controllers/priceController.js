const Price = require("../models/Price");

// ==============================
// Get Prices
// ==============================
const getPrices = async (req, res) => {
  try {
    let price = await Price.findOne();

    if (!price) {
      price = await Price.create({
        breakfast: 40,
        lunch: 70,
        dinner: 90,
      });
    }

    res.status(200).json({
      success: true,
      data: price,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// Update Prices
// ==============================
const updatePrices = async (req, res) => {
  try {
    let price = await Price.findOne();

    if (!price) {
      price = await Price.create({
        breakfast: req.body.breakfast,
        lunch: req.body.lunch,
        dinner: req.body.dinner,
      });
    } else {
      price.breakfast = req.body.breakfast;
      price.lunch = req.body.lunch;
      price.dinner = req.body.dinner;

      await price.save();
    }

    res.status(200).json({
      success: true,
      message: "Prices updated successfully",
      data: price,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getPrices,
  updatePrices,
};