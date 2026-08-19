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
  getAllBills,
  getBillById,
  sendBillWhatsApp,
  getBillDeliveryStatus,
  retryFailedBill,
} = require("../controllers/billController");

const protect = require("../middleware/authMiddleware");

// =======================================
// Generate Bills
// =======================================

router.post(
  "/generate",
  protect,
  generateBill
);

router.post(
  "/generate-all",
  protect,
  generateAllBills
);

// =======================================
// Get Latest Bill By Customer
// =======================================

router.get(
  "/customer/:customerId",
  protect,
  getLatestBill
);

// =======================================
// Get Bill Delivery Status
// =======================================

router.get(
  "/delivery-status",
  protect,
  getBillDeliveryStatus
);

// =======================================
// Get All Bills
// =======================================

router.get(
  "/",
  protect,
  getAllBills
);

// =======================================
// Get Single Bill
// =======================================

router.get(
  "/:id",
  protect,
  getBillById
);

// =======================================
// Send Bill PDF On WhatsApp
// =======================================

router.post(
  "/send-whatsapp",
  protect,
  upload.single("pdf"),
  sendBillWhatsApp
);

router.post(
  "/retry/:billId",
  protect,
  retryFailedBill
);

module.exports = router;