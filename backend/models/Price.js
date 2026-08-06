const mongoose = require("mongoose");

const priceSchema = new mongoose.Schema(
  {
    breakfast: {
      type: Number,
      default: 40,
    },

    lunch: {
      type: Number,
      default: 70,
    },

    dinner: {
      type: Number,
      default: 90,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Price", priceSchema);