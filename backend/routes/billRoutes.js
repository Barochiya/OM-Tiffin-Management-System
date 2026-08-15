const express = require("express");
const multer = require("multer");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

const {
  generateBill,
  generateAllBills,
  getLatestBill,
  sendBillWhatsApp,
  getBillDeliveryStatus,
} = require("../controllers/billController");

const protect = require("../middleware/authMiddleware");

// Generate Monthly Bill
router.post("/generate", generateBill);

router.post(
  "/generate-all",
  protect,
  generateAllBills
);

router.get(
  "/customer/:customerId",
  getLatestBill
);

router.get(
  "/delivery-status",
  protect,
  getBillDeliveryStatus
);

// Send Bill PDF
router.post(
  "/send-whatsapp",
  protect,
  upload.single("pdf"),
  sendBillWhatsApp
);

module.exports = router;