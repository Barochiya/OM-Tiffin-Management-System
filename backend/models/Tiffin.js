const mongoose = require("mongoose");

const tiffinSchema = new mongoose.Schema(
{
    customerName: {
        type: String,
        required: true,
    },

   phone: {
  type: String,
  required: [true, "Phone number is required"],

  validate: {
    validator: function (value) {
      const phone = value
        .replace(/\D/g, "")
        .replace(/^91/, "");

      return /^[6-9]\d{9}$/.test(phone);
    },

    message:
      "❌ Invalid WhatsApp number",
  },

  set: function (value) {
    return value
      .replace(/\D/g, "")
      .replace(/^91/, "");
  },
},

    address: {
        type: String,
        required: true,
    },

    mealType: {
        type: String,
        enum: ["Lunch", "Dinner", "Both"],
        default: "Lunch",
    },

    price: {
    type: Number,
    default: 0,
    },

    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active",
    },

    // ==========================
    // Payment Information
    // ==========================

    paymentStatus: {
        type: String,
        enum: ["Paid", "Pending"],
        default: "Pending",
    },

    paymentDate: {
        type: Date,
        default: null,
    },

    pendingAmount: {
        type: Number,
        default: 0,
    },

    advanceBalance: {
    type: Number,
    default: 0,
    },

    paymentMonth: {
        type: String,
        default: () => {
            const months = [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December",
            ];

            return months[new Date().getMonth()];
        },
    },

    // ==========================
    // Customer Pricing
    // ==========================

    pricing: {
    pricingType: {
        type: String,
        enum: ["default", "custom"],
        default: "default",
    },

    breakfastPrice: {
        type: Number,
        default: 40,
    },

    lunchPrice: {
        type: Number,
        default: 90,
    },

    dinnerPrice: {
        type: Number,
        default: 90,
    },

    extraCharge: {
        type: Number,
        default: 0,
    },

    extraReason: {
        type: String,
        default: "",
    },

    discountType: {
        type: String,
        enum: ["fixed", "percentage"],
        default: "fixed",
    },

    discount: {
        type: Number,
        default: 0,
    },
}

},
{
    timestamps: true,
}
);

module.exports = mongoose.model("Tiffin", tiffinSchema);