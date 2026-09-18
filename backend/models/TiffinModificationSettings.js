const mongoose = require("mongoose");
const tiffinModificationSettingsSchema = new mongoose.Schema(
  {
    adminWhatsAppNumber1: {
      type: String,
      trim: true,
      default: "",
      match: /^(?:\+91)?[6-9]\d{9}$/,
    },
    adminWhatsAppNumber2: {
      type: String,
      trim: true,
      default: "",
      match: /^(?:\+91)?[6-9]\d{9}$/,
    },
    lunchCutoffTime: {
      type: String,
      default: "10:30",
      match: /^(?:[01]\d|2[0-3]):[0-5]\d$/,
    },
    dinnerCutoffTime: {
      type: String,
      default: "17:00",
      match: /^(?:[01]\d|2[0-3]):[0-5]\d$/,
    },
    skipTiffinEnabled: {
      type: Boolean,
      default: true,
    },
    extraTiffinEnabled: {
      type: Boolean,
      default: true,
    },
    mealModificationEnabled: {
      type: Boolean,
      default: true,
    },
    otherRequestEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model(
  "TiffinModificationSettings",
  tiffinModificationSettingsSchema
);
