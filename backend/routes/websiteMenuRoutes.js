const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getMenuItems,
  getPublicMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require("../controllers/websiteMenuController");
// Public website menu
router.get("/public", getPublicMenuItems);
// Admin menu management
router.get("/", protect, getMenuItems);
router.post("/", protect, createMenuItem);
router.put("/:id", protect, updateMenuItem);
router.delete("/:id", protect, deleteMenuItem);
module.exports = router;
