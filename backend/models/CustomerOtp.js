const mongoose = require("mongoose");
const customerOtpSchema = new mongoose.Schema(
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
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    purpose: {
    type: String,
    enum: ["PASSWORD_RESET", "USER_ID_RECOVERY", "ACCOUNT_SETUP"],
    default: "PASSWORD_RESET",
    index: true,
  },  whatsappMessageId: {
      type: String,
      default: null,
      index: true,
    },
    whatsappStatus: {
      type: String,
      default: null,
    },
    whatsappSentAt: {
      type: Date,
      default: null,
    },
    whatsappDeliveredAt: {
      type: Date,
      default: null,
    },
    whatsappReadAt: {
      type: Date,
      default: null,
    },
    whatsappFailedAt: {
      type: Date,
      default: null,
    },
    whatsappFailureReason: {
      type: String,
      default: "",
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    resetTokenHash: {
      type: String,
      default: null,
    },
    resetTokenExpiresAt: {
      type: Date,
      default: null,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);
customerOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
module.exports = mongoose.model("CustomerOtp", customerOtpSchema);

