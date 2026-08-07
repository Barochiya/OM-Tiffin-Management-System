const Razorpay = require("razorpay");

const razorpay = new Razorpay({

  key_id: process.env.RAZORPAY_KEY_ID,

  key_secret: process.env.RAZORPAY_KEY_SECRET,

});

// ======================================
// CREATE ORDER
// ======================================

const createOrder = async (req, res) => {

  try {

    const {

      amount,

      receipt,

    } = req.body;

    if (!amount) {

      return res.status(400).json({

        success: false,

        message: "Amount is required",

      });

    }

    const options = {

      amount: Number(amount) * 100,

      currency: "INR",

      receipt:
        receipt ||
        `receipt_${Date.now()}`,

    };

    const order =
      await razorpay.orders.create(
        options
      );

    return res.status(200).json({

      success: true,

      order,

    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({

      success: false,

      message:
        "Failed to create Razorpay order",

    });

  }

};
// ======================================
// VERIFY PAYMENT
// ======================================

const crypto = require("crypto");

const verifyPayment = async (req, res) => {

  try {

    const {

      razorpay_order_id,

      razorpay_payment_id,

      razorpay_signature,

    } = req.body;

    const body =

      razorpay_order_id +

      "|" +

      razorpay_payment_id;

    const expectedSignature = crypto

      .createHmac(

        "sha256",

        process.env.RAZORPAY_KEY_SECRET

      )

      .update(body.toString())

      .digest("hex");

    const isAuthentic =

      expectedSignature ===

      razorpay_signature;

    if (!isAuthentic) {

      return res.status(400).json({

        success: false,

        message: "Payment verification failed",

      });

    }

    return res.status(200).json({

      success: true,

      message: "Payment verified successfully",

      paymentId: razorpay_payment_id,

      orderId: razorpay_order_id,

    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({

      success: false,

      message: "Payment verification failed",

    });

  }

};

// ======================================
// EXPORTS
// ======================================

module.exports = {

  createOrder,

  verifyPayment,

};