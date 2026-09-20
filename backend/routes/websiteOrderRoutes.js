const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  createWebsiteOrder,
  getPublicOrderStatus,
  getWebsiteOrders,
  getWebsiteOrderById,
  updateWebsiteOrder,
  deleteWebsiteOrder,
} = require("../controllers/websiteOrderController");
// Public
router.post("/public", createWebsiteOrder);
router.get("/public/status", getPublicOrderStatus);
// Admin protected
router.get("/", protect, getWebsiteOrders);
router.get("/:id", protect, getWebsiteOrderById);
router.put("/:id", protect, updateWebsiteOrder);
router.delete("/:id", protect, deleteWebsiteOrder);
module.exports = router;
