const mongoose = require("mongoose");

// ======================================================
// Daily Bill Detail Schema
// ======================================================
const dailyDetailSchema = new mongoose.Schema(
  {
    // Actual meal date
    date: {
      type: Date,
      required: true,
    },

    // ==========================
    // Daily Quantity
    // ==========================
    breakfastQty: {
      type: Number,
      default: 0,
    },

    lunchQty: {
      type: Number,
      default: 0,
    },

    dinnerQty: {
      type: Number,
      default: 0,
    },

    // ==========================
    // Daily Meal Amount
    // ==========================
    breakfastAmount: {
      type: Number,
      default: 0,
    },

    lunchAmount: {
      type: Number,
      default: 0,
    },

    dinnerAmount: {
      type: Number,
      default: 0,
    },

    // ==========================
    // Extra Items
    // ==========================
    extraItems: [
      {
        description: {
          type: String,
          default: "",
        },

        amount: {
          type: Number,
          default: 0,
        },
      },
    ],

    // Total Extra Amount For This Day
    extraAmount: {
      type: Number,
      default: 0,
    },

    // ==========================
    // Daily Total
    // ==========================
    dailyTotal: {
      type: Number,
      default: 0,
    },

    // ==========================
    // Daily Remark
    // ==========================
    remark: {
      type: String,
      default: "",
    },
  },
  {
    _id: false,
  }
);


// ======================================================
// Main Bill Schema
// ======================================================
const billSchema = new mongoose.Schema(
  {
    // ==========================
    // Customer
    // ==========================
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tiffin",
      required: true,
    },

    // ==========================
    // Billing Month / Year
    // ==========================
    month: {
      type: Number,
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    // ==========================
    // Invoice Number
    // ==========================
    invoiceNo: {
      type: String,
      unique: true,
    },

    // ==========================
    // Billing Cycle
    //
    // 1 = 1-15
    // 2 = 16-Month End
    // ==========================
    cycle: {
      type: String,
      enum: ["1", "2"],
      required: true,
    },

    // ==========================
    // Overall Quantity
    // ==========================
    breakfastQty: {
      type: Number,
      default: 0,
    },

    lunchQty: {
      type: Number,
      default: 0,
    },

    dinnerQty: {
      type: Number,
      default: 0,
    },

    // ==========================
    // Overall Meal Amount
    // ==========================
    breakfastAmount: {
      type: Number,
      default: 0,
    },

    lunchAmount: {
      type: Number,
      default: 0,
    },

    dinnerAmount: {
      type: Number,
      default: 0,
    },

    // ==========================
    // Overall Extra Charges
    // ==========================
    extraAmount: {
      type: Number,
      default: 0,
    },

    // ==========================
    // Daily Detailed Records
    // ==========================
    dailyDetails: {
      type: [dailyDetailSchema],
      default: [],
    },

    // ==========================
    // Bill Amount
    // ==========================
    totalAmount: {
      type: Number,
      default: 0,
    },

    // ==========================
    // Payment
    // ==========================
    paidAmount: {
      type: Number,
      default: 0,
    },

    pendingAmount: {
      type: Number,
      default: 0,
    },

  
// ==========================
// Payment Status
// ==========================

status: {
  type: String,
  enum: ["Paid", "Partial", "Pending"],
  default: "Pending",
},

// ==========================
// WhatsApp Delivery Status
// ==========================

whatsappDelivery: {
  delivered: {
    type: Boolean,
    default: false,
  },

  sentAt: {
    type: Date,
    default: null,
  },

  reason: {
    type: String,
    default: "Not sent yet",
  },
},

},
{
  timestamps: true,
}
);



// ======================================================
// Prevent Duplicate Bill
// ======================================================
billSchema.index(
  {
    customer: 1,
    month: 1,
    year: 1,
    cycle: 1,
  },
  {
    unique: true,
  }
);


// ======================================================
// Export Model
// ======================================================
module.exports = mongoose.model("Bill", billSchema);