const mongoose = require("mongoose");

const dailyEntrySchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tiffin",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    breakfastQty: {
      type: Number,
      default: 0,
    },

    lunchQty: {
      type: Number,
      default: 0,
    },

    dinnerQty: {
      type: Number,
      default: 0,
    },
// ==========================
// Multiple Extra Items
// ==========================

extraItems: [
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
],

    remark: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// ======================================
// Prevent Duplicate Daily Entry
// One customer + one date = one record
// ======================================

dailyEntrySchema.index(
  {
    customer: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("DailyEntry", dailyEntrySchema);