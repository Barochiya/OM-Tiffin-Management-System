const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");

// Add Payment
router.post("/", paymentController.addPayment);

// Get All Payments
router.get("/", paymentController.getPayments);

// Bills By Customer
router.get(
  "/customer/:customerId",
  paymentController.getBillsByCustomer
);

// Pending Bills
router.get(
  "/pending/:customerId",
  paymentController.getPendingBills
);

// ✅ Payment History By Bill
router.get(
  "/bill/:billId",
  paymentController.getPaymentHistoryByBill
);

// Send Payment Receipt PDF via WhatsApp
router.post(
  "/send-whatsapp",
  paymentController.sendPaymentReceiptWhatsApp
);

// Single Payment
router.get(
  "/:id",
  paymentController.getPaymentById
);

module.exports = router;