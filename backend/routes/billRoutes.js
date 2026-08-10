const express = require("express");

const router = express.Router();

const {
  generateBill,
  getLatestBill,
  sendBillWhatsApp,
} = require("../controllers/billController");

const protect = require("../middleware/authMiddleware");

// Generate Monthly Bill
router.post("/generate", generateBill);

router.get(
  "/customer/:customerId",
  getLatestBill
);



// Send the generated PDF bill to the customer's WhatsApp number.
router.post(
  "/send-whatsapp",
  protect,
  express.raw({
    type: "application/pdf",
    limit: "10mb",
  }),
  sendBillWhatsApp
);

module.exports = router;

