const express = require("express");

const router = express.Router();

const {
  getDashboardAnalytics,
} = require("../controllers/dashboardController");

// =============================
// Dashboard Analytics
// =============================
router.get("/", getDashboardAnalytics);

module.exports = router;