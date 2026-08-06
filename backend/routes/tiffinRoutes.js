console.log("✅ NEW Tiffin Routes Loaded");
const express = require("express");
const router = express.Router();

console.log("✅ Tiffin Routes Loaded");

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
router.post("/", protect, validateTiffin, createTiffin);

// Dashboard Stats
// Dashboard Stats
router.get(
  "/stats",
  protect,
  (req, res, next) => {
    console.log("📊 Stats Route Hit");
    next();
  },
  getDashboardStats
);

// Get All Customers
router.get("/", getAllTiffins);

// Get Single Customer
router.get("/:id", getTiffinById);

// Update Customer
router.put("/:id", protect, updateTiffin);

// Mark Payment as Paid
router.put("/:id/pay", protect, markPaymentPaid);

// Delete Customer
router.delete("/:id", protect, deleteTiffin);

module.exports = router;