const express = require("express");

const router = express.Router();

const {
  generateBill,
  getLatestBill,
} = require("../controllers/billController");

// Generate Monthly Bill
router.post("/generate", generateBill);

router.get(
  "/customer/:customerId",
  getLatestBill
);

module.exports = router;

