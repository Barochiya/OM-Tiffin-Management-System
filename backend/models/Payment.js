const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    bill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
      required: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tiffin",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI", "Bank", "Razorpay"],
      default: "Cash",
    },

    // Razorpay / Gateway Transaction ID
    transactionId: {
      type: String,
      default: "",
    },

    // Payment Gateway Name
    gateway: {
      type: String,
      default: "",
    },

    paymentDate: {
      type: Date,
      default: Date.now,
    },

    // Payment Status
    status: {
      type: String,
      enum: ["Success", "Pending", "Failed"],
      default: "Success",
    },

    note: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", paymentSchema);