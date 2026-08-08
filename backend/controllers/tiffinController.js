const Price = require("../models/Price");
console.log("✅ Controller Loaded");
const Tiffin = require("../models/Tiffin");
const Bill = require("../models/Bill");
const createTiffin = async (req, res) => {
    console.log("🔥 createTiffin API Called");

    try {

        const currentMonth = new Date().toLocaleString("default", {
            month: "long",
        });

const defaultPrice = await Price.findOne().sort({
  createdAt: -1,
});

        const tiffin = await Tiffin.create({
    customerName: req.body.customerName,
    phone: req.body.phone,
    address: req.body.address,
    mealType: req.body.mealType,

    // Old monthly price (kept only for compatibility)
    price: 0,

    status: req.body.status,

    paymentStatus: "Pending",
    pendingAmount: 0,
    paymentDate: null,
    paymentMonth: currentMonth,

    pricing: req.body.pricing || {
    pricingType: "default",
    breakfastPrice: defaultPrice?.breakfast ?? 40,
    lunchPrice: defaultPrice?.lunch ?? 90,
    dinnerPrice: defaultPrice?.dinner ?? 90,
    extraCharge: 0,
    extraReason: "",
    discountType: "fixed",
    discount: 0,
},
});

        res.status(201).json({
            success: true,
            data: tiffin,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

// Get All Tiffins with Search, Filter, Pagination & Sorting
const getAllTiffins = async (req, res) => {
    try {

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const search = req.query.search || "";
        const status = req.query.status;
        const sort = req.query.sort || "createdAt";

        let query = {};

        // Search by Customer Name
        if (search) {
            query.customerName = {
                $regex: search,
                $options: "i",
            };
        }

        // Filter by Status
        if (status) {
            query.status = status;
        }

        const total = await Tiffin.countDocuments(query);

        const tiffins = await Tiffin.find(query)
  .sort(sort)
  .skip(skip)
  .limit(limit);

const customersWithBill = await Promise.all(
  tiffins.map(async (customer) => {

    const latestBill = await Bill.findOne({
      customer: customer._id,
    }).sort({ createdAt: -1 });

    return {
      ...customer.toObject(),

      latestBill,

      price: latestBill
        ? latestBill.totalAmount
        : 0,

      paymentStatus: latestBill
        ? latestBill.status
        : "Pending",

      pendingAmount: latestBill
        ? latestBill.pendingAmount
        : 0,
    };

  })
);

        res.status(200).json({
            success: true,
            page,
            totalPages: Math.ceil(total / limit),
            totalCustomers: total,
            count: customersWithBill.length,
            data: customersWithBill,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



// Get Single Tiffin
const getTiffinById = async (req, res) => {

    console.log("❌ getTiffinById Called:", req.params.id);

    try {
        const tiffin = await Tiffin.findById(req.params.id);

        if (!tiffin) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        res.status(200).json({
            success: true,
            data: tiffin,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



// Update Tiffin
const updateTiffin = async (req, res) => {
    try {
        const tiffin = await Tiffin.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true,
            }
        );

        if (!tiffin) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        res.status(200).json({
            success: true,
            data: tiffin,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Delete Tiffin
const deleteTiffin = async (req, res) => {
    try {
        const tiffin = await Tiffin.findByIdAndDelete(req.params.id);

        if (!tiffin) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Customer deleted successfully",
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Mark Payment as Paid
const markPaymentPaid = async (req, res) => {
  try {

    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({
        success: false,
        message: "Bill not found",
      });
    }

    bill.paidAmount = bill.totalAmount;
    bill.pendingAmount = 0;
    bill.status = "Paid";

    await bill.save();

    res.status(200).json({
      success: true,
      message: "Payment marked as Paid",
      data: bill,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};
// Dashboard Statistics
const getDashboardStats = async (req, res) => {

    console.log("✅ getDashboardStats Called");

    try {

        const totalCustomers = await Tiffin.countDocuments();

        const activeCustomers = await Tiffin.countDocuments({
            status: "Active",
        });

        const inactiveCustomers = await Tiffin.countDocuments({
            status: "Inactive",
        });

        const income = await Bill.aggregate([
  {
    $group: {
      _id: null,
      total: {
        $sum: "$totalAmount",
      },
    },
  },
]);

   console.log("Income Aggregate:", income);
   
   console.log("Dashboard Response:", {
  totalCustomers,
  activeCustomers,
  inactiveCustomers,
  monthlyIncome:
    income.length > 0
      ? income[0].total
      : 0,
});

        res.status(200).json({
            success: true,
            data: {
                totalCustomers,
                activeCustomers,
                inactiveCustomers,
                monthlyIncome:
                    income.length > 0
                        ? income[0].total
                        : 0,
            },
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }
};

module.exports = {
    createTiffin,
    getAllTiffins,
    getTiffinById,
    updateTiffin,
    deleteTiffin,
    markPaymentPaid,
    getDashboardStats,
};