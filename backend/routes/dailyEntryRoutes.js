const express = require("express");

const router = express.Router();

const {
  saveDailyEntry,
  getEntriesByDate,
} = require("../controllers/dailyEntryController");

// Save / Update Daily Entry
router.post("/", saveDailyEntry);

// Get Entries By Date
router.get("/:date", getEntriesByDate);

module.exports = router;