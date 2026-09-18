const mongoose = require("mongoose");
const customerModificationWhatsAppActionSchema =
  new mongoose.Schema(
    {
      request: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CustomerModificationRequest",
        required: true,
        index: true,
      },
      whatsappMessageId: {
        type: String,
        required: true,
        unique: true,
        index: true,
      },
      adminPhone: {
        type: String,
        required: true,
        index: true,
      },
      action: {
        type: String,
        enum: ["APPROVE"],
        required: true,
        default: "APPROVE",
      },
      status: {
        type: String,
        enum: ["PENDING", "USED", "EXPIRED"],
        default: "PENDING",
        index: true,
      },
      usedAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );
customerModificationWhatsAppActionSchema.index({
  request: 1,
  adminPhone: 1,
  action: 1,
  status: 1,
});
module.exports = mongoose.model(
  "CustomerModificationWhatsAppAction",
  customerModificationWhatsAppActionSchema
);
