const Payment = require("../models/Payment");
const Bill = require("../models/Bill");
const Tiffin = require("../models/Tiffin");

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