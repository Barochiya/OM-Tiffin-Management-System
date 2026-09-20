const mongoose = require("mongoose");
const customerFirstLoginLogSchema = new mongoose.Schema(
  {
    // One first-login log per customer account.
    customerAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerAccount",
      required: true,
      unique: true,
      index: true,
    },
    // Linked Tiffin customer.
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tiffin",
      required: true,
      unique: true,
      index: true,
    },
    // Permanent Customer User ID = Barcode ID.
    userId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    // Exact timestamp of first successful login.
    firstLoginAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model(
  "CustomerFirstLoginLog",
  customerFirstLoginLogSchema
);
