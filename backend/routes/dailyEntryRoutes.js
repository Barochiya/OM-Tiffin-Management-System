const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
  saveDailyEntry,
  getEntriesByDate,
  getCustomerEntries,
} = require("../controllers/dailyEntryController");

// ===============================
// Save Daily Entry
// ===============================
router.post(
  "/",
  protect,
  saveDailyEntry
);

// ===============================
// Get Customer Entries By Billing Cycle
// IMPORTANT: :customerId is required
// ===============================
router.get(
  "/customer/:customerId",
  protect,
  getCustomerEntries
);

// ===============================
// Get Entries By Date
// ===============================
router.get(
  "/:date",
  protect,
  getEntriesByDate
);

module.exports = router;