const mongoose = require("mongoose");
const customerLoginIdDeliverySchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tiffin",
      required: true,
      index: true,
    },
    customerAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CustomerAccount",
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    templateName: {
      type: String,
      required: true,
    },
    whatsappMessageId: {
      type: String,
      default: null,
      index: true,
    },
    whatsappStatus: {
      type: String,
      enum: [
        "accepted",
        "sent",
        "delivered",
        "read",
        "failed",
      ],
      default: "accepted",
      index: true,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model(
  "CustomerLoginIdDelivery",
  customerLoginIdDeliverySchema
);
