const mongoose = require("mongoose");
const whatsappMessageSchema = new mongoose.Schema(
  {
    // ===============================
    // Customer
    // ===============================
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tiffin",
      default: null,
    },
    // ===============================
    // WhatsApp Sender
    // ===============================
    phoneNumber: {
      type: String,
      required: true,
    },
    whatsappMessageId: {
      type: String,
      required: true,
      unique: true,
    },
    // ===============================
    // Message Type
    // ===============================
    type: {
      type: String,
      enum: [
        "text",
        "image",
        "document",
        "audio",
        "video",
        "sticker",
        "location",
        "unknown",
      ],
      default: "unknown",
    },
    // ===============================
    // Text Message
    // ===============================
    message: {
      type: String,
      default: "",
    },
    // ===============================
    // Media
    // ===============================
    mediaId: {
      type: String,
      default: null,
    },
    mediaMimeType: {
      type: String,
      default: null,
    },
    mediaFilename: {
      type: String,
      default: null,
    },
    mediaCaption: {
      type: String,
      default: "",
    },
    // ===============================
    // WhatsApp Timestamp
    // ===============================
    whatsappTimestamp: {
      type: Date,
      default: null,
    },
    // ===============================
    // Direction
    // ===============================
    direction: {
      type: String,
      enum: ["incoming", "outgoing"],
      default: "incoming",
    },
    // ===============================
    // Inbox Status
    // ===============================
    inboxStatus: {
      type: String,
      enum: ["unread", "read", "replied", "closed"],
      default: "unread",
    },
    // ===============================
    // Payment Workflow
    // ===============================
    paymentStatus: {
      type: String,
      enum: [
        "not_payment_related",
        "pending_review",
        "payment_received",
      ],
      default: "not_payment_related",
    },
    linkedBill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
      default: null,
    },
    linkedPayment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
    // ===============================
    // Admin Notes
    // ===============================
    note: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model(
  "WhatsAppMessage",
  whatsappMessageSchema
);
