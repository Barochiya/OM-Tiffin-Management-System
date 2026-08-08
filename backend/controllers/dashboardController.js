const Payment = require("../models/Payment");
const Bill = require("../models/Bill");
const Tiffin = require("../models/Tiffin");

exports.getDashboard = async (req, res) => {
  try {
    // -------------------------
    // Customers
    // -------------------------

    const totalCustomers = await Tiffin.countDocuments();

    const activeCustomers = await Tiffin.countDocuments({
      status: "Active",
    });

    // -------------------------
    // Recent Payments
    // -------------------------

    const recentPayments = await Payment.find()
      .populate("customer")
      .sort({ createdAt: -1 })
      .limit(5);

    // -------------------------
    // Total Revenue
    // -------------------------

    const revenueResult = await Payment.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: "$amount",
          },
        },
      },
    ]);

    const totalRevenue =
      revenueResult.length > 0
        ? revenueResult[0].total
        : 0;

    // -------------------------
    // Pending Bills
    // -------------------------

    const pendingBills = await Bill.find({
      pendingAmount: {
        $gt: 0,
      },
    }).populate("customer");

    const totalPending = pendingBills.reduce(
      (sum, bill) => sum + bill.pendingAmount,
      0
    );

    // -------------------------
    // Top Customers
    // -------------------------

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
    ]);

    res.json({
      success: true,

      stats: {
        totalCustomers,
        activeCustomers,
        totalRevenue,
        totalPending,
      },

      recentPayments,

      pendingBills,

      topCustomers,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};