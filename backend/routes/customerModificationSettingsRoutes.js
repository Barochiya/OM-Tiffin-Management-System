const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getModificationSettings,
  updateModificationSettings,
} = require("../controllers/customerModificationSettingsController");
router.get(
  "/settings",
  protect,
  getModificationSettings
);
router.put(
  "/settings",
  protect,
  updateModificationSettings
);
module.exports = router;
