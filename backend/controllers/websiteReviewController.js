const WebsiteReview = require("../models/WebsiteReview");
// Public: get approved reviews only
const getPublicReviews = async (req, res) => {
  try {
    const reviews = await WebsiteReview.find({ status: "Approved" })
      .sort({ createdAt: -1 })
      .lean();
    return res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error("Get Public Reviews Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load reviews.",
    });
  }
};
// Public: submit a new review
const createPublicReview = async (req, res) => {
  try {
    const customerName = String(req.body?.customerName || "").trim();
    const reviewText = String(req.body?.reviewText || "").trim();
    const rating = Number(req.body?.rating);
    if (!customerName) {
      return res.status(400).json({
        success: false,
        message: "Customer name is required.",
      });
    }
    if (customerName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Customer name must be 100 characters or less.",
      });
    }
    if (!reviewText) {
      return res.status(400).json({
        success: false,
        message: "Review text is required.",
      });
    }
    if (reviewText.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Review must be 1000 characters or less.",
      });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a whole number between 1 and 5.",
      });
    }
    const review = await WebsiteReview.create({
      customerName,
      rating,
      reviewText,
      status: "Pending",
    });
    return res.status(201).json({
      success: true,
      message: "Thank you for your review. It has been submitted for approval.",
      data: review,
    });
  } catch (error) {
    console.error("Create Public Review Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit review.",
    });
  }
};
// Admin: get all reviews
const getReviews = async (req, res) => {
  try {
    const reviews = await WebsiteReview.find({})
      .sort({ createdAt: -1 })
      .lean();
    return res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error("Get Reviews Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load reviews.",
    });
  }
};
// Admin: update review status/content
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await WebsiteReview.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }
    if (req.body?.customerName !== undefined) {
      const customerName = String(req.body.customerName).trim();
      if (!customerName || customerName.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Customer name must be between 1 and 100 characters.",
        });
      }
      review.customerName = customerName;
    }
    if (req.body?.reviewText !== undefined) {
      const reviewText = String(req.body.reviewText).trim();
      if (!reviewText || reviewText.length > 1000) {
        return res.status(400).json({
          success: false,
          message: "Review must be between 1 and 1000 characters.",
        });
      }
      review.reviewText = reviewText;
    }
    if (req.body?.rating !== undefined) {
      const rating = Number(req.body.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "Rating must be a whole number between 1 and 5.",
        });
      }
      review.rating = rating;
    }
    if (req.body?.status !== undefined) {
      const status = String(req.body.status);
      if (!["Pending", "Approved", "Rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid review status.",
        });
      }
      review.status = status;
    }
    await review.save();
    return res.json({
      success: true,
      message: "Review updated successfully.",
      data: review,
    });
  } catch (error) {
    console.error("Update Review Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update review.",
    });
  }
};
// Admin: delete review
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await WebsiteReview.findByIdAndDelete(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }
    return res.json({
      success: true,
      message: "Review deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Review Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete review.",
    });
  }
};
module.exports = {
  getPublicReviews,
  createPublicReview,
  getReviews,
  updateReview,
  deleteReview,
};
