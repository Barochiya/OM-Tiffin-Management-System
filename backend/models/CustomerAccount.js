const mongoose = require("mongoose");
const customerAccountSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tiffin",
      required: true,
      unique: true,
      index: true,
    },
    // Permanent Customer User ID = Barcode ID
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    // Admin controls whether the customer can log in
    loginEnabled: {
      type: Boolean,
      default: false,
      index: true,
    },
    // First login must force password change
    isFirstLogin: {
      type: Boolean,
      default: true,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model(
  "CustomerAccount",
  customerAccountSchema
);
