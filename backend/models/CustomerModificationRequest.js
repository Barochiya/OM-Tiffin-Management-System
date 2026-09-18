const mongoose = require("mongoose");
const customerModificationRequestSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tiffin",
      required: true,
      index: true,
    },
    requestType: {
      type: String,
      enum: ["SKIP_TIFFIN", "EXTRA_TIFFIN", "MEAL_MODIFICATION", "OTHER"],
      required: true,
      index: true,
    },
    requestDate: {
      type: Date,
      required: true,
      index: true,
    },
    meal: {
      type: String,
      enum: ["BREAKFAST", "LUNCH", "DINNER", "BOTH", "ALL"],
      default: "ALL",
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "COMPLETED"],
      default: "PENDING",
      index: true,
    },
    adminRemark: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    completedAt: {
      type: Date,
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
customerModificationRequestSchema.index({
  customer: 1,
  requestDate: 1,
});
module.exports = mongoose.model(
  "CustomerModificationRequest",
  customerModificationRequestSchema
);
