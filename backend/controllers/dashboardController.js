const Bill = require("../models/Bill");
const Payment = require("../models/Payment");
const DailyEntry = require("../models/DailyEntry");
const Tiffin = require("../models/Tiffin");

// ======================================
// Dashboard Analytics
// ======================================

const getDashboardAnalytics = async (req, res) => {
  try {

    const today = new Date();

    const startToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const endToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    const startMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    const endMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      1
    );

    // ==========================
    // Today's Collection
    // ==========================

    const todayBills = await Bill.find({
      updatedAt: {
        $gte: startToday,
        $lt: endToday,
      },
    });

    const todaysCollection = todayBills.reduce(
      (sum, bill) => sum + bill.paidAmount,
      0
    );

    // ==========================
    // Monthly Revenue
    // ==========================

    const monthlyBills = await Bill.find({
      createdAt: {
        $gte: startMonth,
        $lt: endMonth,
      },
    });

    const monthlyRevenue = monthlyBills.reduce(
      (sum, bill) => sum + bill.totalAmount,
      0
    );

    // ==========================
    // Pending Amount
    // ==========================

    const pendingBills = await Bill.find({
      status: {
        $ne: "Paid",
      },
    });

    const pendingAmount = pendingBills.reduce(
      (sum, bill) => sum + bill.pendingAmount,
      0
    );

    // ==========================
    // Total Customers
    // ==========================

    const totalCustomers =
      await Tiffin.countDocuments();

    // ==========================
    // Today's Meals
    // ==========================

    const todayEntries =
      await DailyEntry.find({
        date: {
          $gte: startToday,
          $lt: endToday,
        },
      });

    let todayMeals = 0;
    let todayExtraCharges = 0;

    todayEntries.forEach((entry) => {

      todayMeals +=
        entry.breakfastQty +
        entry.lunchQty +
        entry.dinnerQty;

      if (entry.extraItems?.length) {

        entry.extraItems.forEach((item) => {

          todayExtraCharges += item.amount;

        });

      }

    });

    // ==========================
    // Revenue Chart
    // ==========================

    const revenueChart = [];

    for (let i = 1; i <= 12; i++) {

      const bills = await Bill.find({
        month: i,
        year: today.getFullYear(),
      });

      const revenue = bills.reduce(
        (sum, bill) => sum + bill.totalAmount,
        0
      );

      revenueChart.push({

        month: new Date(
          0,
          i - 1
        ).toLocaleString("default", {
          month: "short",
        }),

        revenue,

      });

    }

        // ==========================
    // Recent Payments
    // ==========================

    const recentPayments = await Payment.find()
      .populate("customer", "customerName")
      .populate("bill", "invoiceNo")
      .sort({ paymentDate: -1 })
      .limit(5);

    // ==========================
    // Pending Bills
    // ==========================

    const pendingBillsList = await Bill.find({
      pendingAmount: { $gt: 0 },
    })
      .populate("customer", "customerName")
      .sort({ pendingAmount: -1 })
      .limit(5);

    // ==========================
    // Top Customers
    // ==========================

    const topCustomers = await Tiffin.find({
      status: "Active",
    })
      .sort({ createdAt: -1 })
      .limit(5);

    // ==========================
    // Response
    // ==========================

    res.json({
      success: true,
      data: {
        todaysCollection,
        monthlyRevenue,
        pendingAmount,
        totalCustomers,
        todayMeals,
        todayExtraCharges,

        revenueChart,

        recentPayments,

        pendingBills: pendingBillsList,

        topCustomers,
      },
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

module.exports = {
  getDashboardAnalytics,
};

