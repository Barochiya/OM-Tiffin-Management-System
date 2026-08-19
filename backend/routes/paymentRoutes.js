const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const paymentController = require(
  "../controllers/paymentController"
);

// Add Payment
router.post(
  "/",
  protect,
  paymentController.addPayment
);

// Get All Payments
router.get(
  "/",
  protect,
  paymentController.getPayments
);

// Bills By Customer
router.get(
  "/customer/:customerId",
  protect,
  paymentController.getBillsByCustomer
);

// Pending Bills
router.get(
  "/pending/:customerId",
  protect,
  paymentController.getPendingBills
);

// Payment History By Bill
router.get(
  "/bill/:billId",
  protect,
  paymentController.getPaymentHistoryByBill
);

// Send Payment Receipt
router.post(
  "/send-whatsapp",
  protect,
  express.raw({
    type: "application/pdf",
    limit: "10mb",
  }),
  paymentController.sendPaymentReceiptWhatsApp
);

// Get Single Payment
router.get(
  "/:id",
  protect,
  paymentController.getPaymentById
);

module.exports = router;