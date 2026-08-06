const express = require("express");
const router = express.Router();

const {
  getPrices,
  updatePrices,
} = require("../controllers/priceController");

const protect = require("../middleware/authMiddleware");

// Get Prices
router.get("/", protect, getPrices);

// Update Prices
router.put("/", protect, updatePrices);

module.exports = router;