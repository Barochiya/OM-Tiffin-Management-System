const express = require("express");
const router = express.Router();

const protect = require(
  "../middleware/authMiddleware"
);

const {
  saveDailyEntry,
  getEntriesByDate,
} = require(
  "../controllers/dailyEntryController"
);

// Save Daily Entry
router.post(
  "/",
  protect,
  saveDailyEntry
);

// Get Entries By Date
router.get(
  "/:date",
  protect,
  getEntriesByDate
);

module.exports = router;