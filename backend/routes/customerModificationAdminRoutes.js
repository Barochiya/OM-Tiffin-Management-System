const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getAllModificationRequests,
  getModificationRequestById,
  updateModificationRequestStatus,
} = require("../controllers/customerModificationAdminController");
router.get(
  "/requests",
  protect,
  getAllModificationRequests
);
router.get(
  "/requests/:id",
  protect,
  getModificationRequestById
);
router.patch("/requests/:id/status", protect, updateModificationRequestStatus);
module.exports = router;
