const mongoose = require("mongoose");
const websiteOrderItemSchema = new mongoose.Schema(
  {
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WebsiteMenu",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    mealType: {
      type: String,
      enum: ["Lunch", "Dinner"],
      required: true,
    },
  },
  { _id: false }
);
const websiteOrderSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
    },
    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
    },
    items: {
      type: [websiteOrderItemSchema],
      required: true,
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "At least one order item is required.",
      },
    },
    orderDate: {
      type: Date,
      required: true,
    },
    specialInstructions: {
      type: String,
      default: "",
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Not Required"],
      default: "Pending",
    },
    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Preparing",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);
websiteOrderSchema.index({ orderStatus: 1, createdAt: -1 });
websiteOrderSchema.index({ mobileNumber: 1, createdAt: -1 });
websiteOrderSchema.index({ orderDate: 1 });
module.exports = mongoose.model("WebsiteOrder", websiteOrderSchema);
