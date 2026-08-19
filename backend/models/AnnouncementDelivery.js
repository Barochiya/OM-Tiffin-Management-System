const mongoose = require("mongoose");

const announcementDeliverySchema =
  new mongoose.Schema(
    {
      customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tiffin",
        required: true,
      },

      customerName: {
        type: String,
        required: true,
      },

      phoneNumber: {
        type: String,
        required: true,
      },

      templateName: {
        type: String,
        required: true,
      },

      title: {
        type: String,
        required: true,
      },

      message: {
        type: String,
        required: true,
      },

      status: {
        type: String,

        enum: [
          "pending",
          "sent",
          "delivered",
          "read",
          "failed",
        ],

        default: "pending",
      },

      whatsappMessageId: {
        type: String,
        default: "",
      },

      failureReason: {
        type: String,
        default: "",
      },

      sentAt: {
        type: Date,
      },

      deliveredAt: {
        type: Date,
      },

      readAt: {
        type: Date,
      },
    },
    {
      timestamps: true,
    }
  );

module.exports = mongoose.model(
  "AnnouncementDelivery",
  announcementDeliverySchema
);