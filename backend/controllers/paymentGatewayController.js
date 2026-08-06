const Razorpay = require("../config/razorpay");

exports.createOrder = async (req, res) => {
  try {

    const { amount, billId } = req.body;

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: billId,
    };

    const order = await Razorpay.orders.create(options);

    res.json({
      success: true,
      order,
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }
};