const Bill = require("../models/Bill");
const Payment = require("../models/Payment");

// ========================================
// Monthly Report
// ========================================
const getMonthlyReport = async (req, res) => {
  try {

    const month = Number(req.query.month);
    const year = Number(req.query.year);

    const bills = await Bill.find({
      month,
      year,
    }).populate("customer", "customerName");

    const totalBills = bills.length;

    const totalAmount = bills.reduce(
      (sum, bill) => sum + bill.totalAmount,
      0
    );

    const totalPaid = bills.reduce(
      (sum, bill) => sum + bill.paidAmount,
      0
    );

    const totalPending = bills.reduce(
      (sum, bill) => sum + bill.pendingAmount,
      0
    );

    res.json({
      success: true,
      data: {
        totalBills,
        totalAmount,
        totalPaid,
        totalPending,
        bills,
      },
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ========================================
// Pending Bills Report
// ========================================
const getPendingReport = async (req, res) => {
  try {

    const bills = await Bill.find({
      pendingAmount: { $gt: 0 },
    })
      .populate("customer", "customerName phone")
      .sort({ pendingAmount: -1 });

    res.json({
      success: true,
      data: bills,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// ========================================
// Payment Report
// ========================================
const getPaymentReport = async (req, res) => {
  try {

    const payments = await Payment.find()
      .populate("customer", "customerName")
      .populate("bill", "invoiceNo")
      .sort({ paymentDate: -1 });

    res.json({
      success: true,
      data: payments,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

module.exports = {
  getMonthlyReport,
  getPendingReport,
  getPaymentReport,
};