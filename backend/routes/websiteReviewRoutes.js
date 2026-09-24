const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getPublicReviews,
  createPublicReview,
  getReviews,
  updateReview,
  deleteReview,
} = require("../controllers/websiteReviewController");
// Public review endpoints
router.get("/public", getPublicReviews);
router.post("/public", createPublicReview);
// Admin review management
router.get("/", protect, getReviews);
router.put("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);
module.exports = router;
