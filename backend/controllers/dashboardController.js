const Payment = require("../models/Payment");
const Bill = require("../models/Bill");
const Tiffin = require("../models/Tiffin");
const DailyEntry = require("../models/DailyEntry");

exports.getDashboard = async (req, res) => {
  try {
    // ==========================================
    // CUSTOMER STATISTICS
    // ==========================================

    const totalCustomers = await Tiffin.countDocuments();

    const activeCustomers = await Tiffin.countDocuments({
      status: "Active",
    });

    // ==========================================
    // RECENT PAYMENTS
    // ==========================================

    const recentPayments = await Payment.find()
      .populate("customer")
      .sort({ createdAt: -1 })
      .limit(5);

    // ==========================================
    // TOTAL REVENUE
    // ==========================================

    const revenueResult = await Payment.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: "$amount",
          },
        },
      },
    ]);

    const totalRevenue =
      revenueResult.length > 0
        ? revenueResult[0].totalRevenue
        : 0;

    // ==========================================
    // PENDING BILLS
    // ==========================================

    const pendingBills = await Bill.find({
      pendingAmount: {
        $gt: 0,
      },
    }).populate("customer");

    const totalPending = pendingBills.reduce(
      (sum, bill) => sum + bill.pendingAmount,
      0
    );

    // ==========================================
    // MONTHLY REVENUE
    // ==========================================

    const monthlyRevenue = await Payment.aggregate([
      {
        $group: {
          _id: {
            month: {
              $month: "$createdAt",
            },
          },
          revenue: {
            $sum: "$amount",
          },
        },
      },
      {
        $sort: {
          "_id.month": 1,
        },
      },
    ]);
        // ==========================================
    // FORMAT REVENUE CHART
    // ==========================================

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const revenueChart = monthlyRevenue.map((item) => ({
      month: monthNames[item._id.month - 1],
      revenue: item.revenue,
    }));

    // ==========================================
    // TOP CUSTOMERS
    // ==========================================

    const topCustomers = await Payment.aggregate([
      {
        $group: {
          _id: "$customer",
          totalPaid: {
            $sum: "$amount",
          },
        },
      },
      {
        $sort: {
          totalPaid: -1,
        },
      },
      {
        $limit: 5,
      },
      {
        $lookup: {
          from: "tiffins",
          localField: "_id",
          foreignField: "_id",
          as: "customer",
        },
      },
      {
        $unwind: {
          path: "$customer",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

// ==========================================
// TODAY ANALYTICS
// ==========================================

// India timezone (IST)
const now = new Date();

const indiaDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
}).format(now);

// Start of today in India
const todayStart = new Date(
  `${indiaDate}T00:00:00+05:30`
);

// Start of tomorrow in India
const tomorrow = new Date(todayStart);
tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

// ==========================================
// TODAY COLLECTION
// ==========================================

const todayCollectionResult = await Payment.aggregate([
  {
    $match: {
      paymentDate: {
        $gte: todayStart,
        $lt: tomorrow,
      },

      status: "Success",
    },
  },

  {
    $group: {
      _id: null,

      total: {
        $sum: "$amount",
      },
    },
  },
]);

const todayCollection =
  todayCollectionResult.length > 0
    ? todayCollectionResult[0].total
    : 0;

// ==========================================
// TODAY MEALS
// ==========================================

const todayMealsResult = await DailyEntry.aggregate([
  {
    $match: {
      date: {
        $gte: todayStart,
        $lt: tomorrow,
      },
    },
  },

  {
    $group: {
      _id: null,

      breakfast: {
        $sum: "$breakfastQty",
      },

      lunch: {
        $sum: "$lunchQty",
      },

      dinner: {
        $sum: "$dinnerQty",
      },
    },
  },
]);

const todayMeals =
  todayMealsResult.length > 0
    ? (
        (todayMealsResult[0].breakfast || 0) +
        (todayMealsResult[0].lunch || 0) +
        (todayMealsResult[0].dinner || 0)
      )
    : 0;

    // ==========================================
    // API RESPONSE
    // ==========================================

res.status(200).json({
  success: true,

  stats: {
    totalCustomers,
    activeCustomers,
    totalRevenue,
    totalPending,
  },

  // ==========================================
  // TODAY ANALYTICS
  // ==========================================

  todayCollection,

  todayMeals,

  revenueChart,

  recentPayments,

  pendingBills,

  topCustomers,
});
  } catch (err) {
    console.error("Dashboard Error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};