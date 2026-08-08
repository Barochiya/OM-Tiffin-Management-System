const Payment = require("../models/Payment");
const Bill = require("../models/Bill");
const Tiffin = require("../models/Tiffin");

// ===============================
// Add Payment
// ===============================
exports.addPayment = async (req, res) => {
  try {
    const {
  customer,
  bill,
  amount,
  paymentMethod,
  remark,
} = req.body;

    // Find Bill
    const billData = await Bill.findById(bill);

    const customerData = await Tiffin.findById(customer);

if (!customerData) {
    return res.status(404).json({
        message: "Customer not found"
    });
}

    if (!billData) {
      return res.status(404).json({
        message: "Bill not found",
      });
    }

    // Save Payment
    const payment = await Payment.create({
  customer,
  bill,
  amount,
  paymentMethod,
  note: remark,
});

    // Update Bill
    const paidAmount = Number(amount);

billData.paidAmount += paidAmount;

let extraPayment = 0;

if (billData.paidAmount > billData.totalAmount) {

    extraPayment =
        billData.paidAmount - billData.totalAmount;

    customerData.advanceBalance += extraPayment;

    billData.paidAmount = billData.totalAmount;
}

billData.pendingAmount =
    billData.totalAmount - billData.paidAmount;

    if (billData.pendingAmount <= 0) {
      billData.status = "Paid";
      billData.pendingAmount = 0;
    } else if (
      billData.paidAmount > 0
    ) {
      billData.status = "Partial";
    } else {
      billData.status = "Pending";
    }

    await customerData.save();
    await billData.save();

    res.status(201).json(payment);

  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ===============================
// Get Payments
// ===============================
exports.getPayments = async (req, res) => {
  try {

    const payments =
      await Payment.find()
        .populate("customer")
        .populate("bill")
        .sort({ createdAt: -1 });

    res.json(payments);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ===============================
// Get Bills By Customer
// ===============================
exports.getBillsByCustomer = async (req, res) => {
  try {
    const bills = await Bill.find({
      customer: req.params.customerId,
    }).sort({ createdAt: -1 });

    res.json(bills);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ===============================
// Get Pending Bills
// ===============================
exports.getPendingBills = async (req, res) => {
  try {
    const bills = await Bill.find({
      customer: req.params.customerId,
      pendingAmount: { $gt: 0 },
    }).sort({ createdAt: -1 });

    res.json(bills);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ===============================
// Get Single Payment Receipt
// ===============================
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("customer")
      .populate("bill");

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    res.json(payment);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ===============================
// Get Payment History By Bill
// ===============================
exports.getPaymentHistoryByBill = async (req, res) => {
  try {

    const payments = await Payment.find({
      bill: req.params.billId,
    })
      .populate("customer")
      .populate("bill")
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