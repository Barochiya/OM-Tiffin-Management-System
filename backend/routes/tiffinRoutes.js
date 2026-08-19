const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const validateTiffin = require("../middleware/validateTiffin");

const {
  createTiffin,
  getAllTiffins,
  getTiffinById,
  updateTiffin,
  deleteTiffin,
  markPaymentPaid,
  getDashboardStats,
} = require("../controllers/tiffinController");

// Create Customer
router.post(
  "/",
  protect,
  validateTiffin,
  createTiffin
);

// Dashboard Stats
router.get(
  "/stats",
  protect,
  getDashboardStats
);

// Get All Customers
router.get(
  "/",
  protect,
  getAllTiffins
);

// Get Single Customer
router.get(
  "/:id",
  protect,
  getTiffinById
);

// Update Customer
router.put(
  "/:id",
  protect,
  updateTiffin
);

// Mark Payment As Paid
router.put(
  "/:id/pay",
  protect,
  markPaymentPaid
);

// Delete Customer
router.delete(
  "/:id",
  protect,
  deleteTiffin
);

module.exports = router;