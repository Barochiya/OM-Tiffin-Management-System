const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tiffin",
      required: true,
    },

    month: {
      type: Number,
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    invoiceNo: {
      type: String,
      unique: true,
    },

    // ==========================
    // Billing Cycle
    // 1 = 1-15
    // 2 = 16-Month End
    // ==========================
    cycle: {
      type: String,
      enum: ["1", "2"],
      required: true,
    },

    // ==========================
    // Quantity
    // ==========================
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
    // Meal Amount
    // ==========================
    breakfastAmount: {
      type: Number,
      default: 0,
    },

    lunchAmount: {
      type: Number,
      default: 0,
    },

    dinnerAmount: {
      type: Number,
      default: 0,
    },

    // ==========================
    // Extra Charges
    // ==========================
    extraAmount: {
      type: Number,
      default: 0,
    },

    // ==========================
    // Bill Amount
    // ==========================
    totalAmount: {
      type: Number,
      default: 0,
    },

    paidAmount: {
      type: Number,
      default: 0,
    },

    pendingAmount: {
      type: Number,
      default: 0,
    },

    // ==========================
    // Payment Status
    // ==========================
    status: {
      type: String,
      enum: ["Paid", "Partial", "Pending"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate bill
billSchema.index(
  {
    customer: 1,
    month: 1,
    year: 1,
    cycle: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Bill", billSchema);