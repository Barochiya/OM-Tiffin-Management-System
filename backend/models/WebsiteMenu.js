const mongoose = require("mongoose");
const websiteMenuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    mealType: {
      type: String,
      enum: ["Lunch", "Dinner", "Both"],
      required: true,
      default: "Lunch",
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);
websiteMenuSchema.index({
  mealType: 1,
  isAvailable: 1,
  sortOrder: 1,
});
module.exports = mongoose.model("WebsiteMenu", websiteMenuSchema);
