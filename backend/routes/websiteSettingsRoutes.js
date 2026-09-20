const express = require("express");
const router = express.Router();
const {
    getWebsiteSettings,
    updateWebsiteSettings,
} = require("../controllers/websiteSettingsController");
const protect = require("../middleware/authMiddleware");
router.get("/", getWebsiteSettings);
router.put("/", protect, updateWebsiteSettings);
module.exports = router;

