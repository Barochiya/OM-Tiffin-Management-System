const Price = require("../models/Price");
console.log("Controller Loaded");

const Tiffin = require("../models/Tiffin");
const Bill = require("../models/Bill");
const { ensureBarcode } = require("./barcodeController");
const {
    createCustomerAccount,
    ensureCustomerAccount,
} = require("../services/customerAccountService");
const {
    sendWhatsAppTemplate,
} = require("../utils/whatsappSender");


// ======================================================
// Helper: Get Default Pricing From Price Settings
// ======================================================
const getDefaultPricing = async () => {
    const defaultPrice = await Price.findOne().sort({
        createdAt: -1,
    });

    return {
        pricingType: "default",

        breakfastPrice: Number(
            defaultPrice?.breakfast ?? 40
        ),

        lunchPrice: Number(
            defaultPrice?.lunch ?? 90
        ),

        dinnerPrice: Number(
            defaultPrice?.dinner ?? 90
        ),

        extraCharge: 0,
        extraReason: "",

        discountType: "fixed",
        discount: 0,
    };
};


// ======================================================
// Helper: Prepare Customer Pricing
// ======================================================
const preparePricing = async (incomingPricing) => {

    const pricing = incomingPricing || {};

    // ------------------------------------------
    // DEFAULT PRICING
    // ------------------------------------------
    if (
        !pricing.pricingType ||
        pricing.pricingType === "default"
    ) {
        return await getDefaultPricing();
    }

    // ------------------------------------------
    // CUSTOM PRICING
    // ------------------------------------------
    return {
        pricingType: "custom",

        breakfastPrice: Number(
            pricing.breakfastPrice || 0
        ),

        lunchPrice: Number(
            pricing.lunchPrice || 0
        ),

        dinnerPrice: Number(
            pricing.dinnerPrice || 0
        ),

        extraCharge: Number(
            pricing.extraCharge || 0
        ),

        extraReason:
            pricing.extraReason || "",

        discountType:
            pricing.discountType || "fixed",

        discount: Number(
            pricing.discount || 0
        ),
    };
};


// ======================================================
// Create Tiffin / Customer
// ======================================================
const createTiffin = async (req, res) => {
    console.log("createTiffin API Called");
    try {
        const currentMonth =
            new Date().toLocaleString("default", {
                month: "long",
            });
        const pricing = await preparePricing(
            req.body.pricing
        );
        console.log(
            "Customer Pricing:",
            pricing
        );
        const tiffin = await Tiffin.create({
            customerName:
                req.body.customerName,
            phone:
                req.body.phone,
            address:
                req.body.address,
            mealType:
                req.body.mealType,
            price: 0,
            status:
                req.body.status || "Active",
            paymentStatus: "Pending",
            pendingAmount: 0,
            paymentDate: null,
            paymentMonth:
                currentMonth,
            pricing: pricing,
        });
        console.log(
            "Customer Created:",
            tiffin._id
        );
        // ======================================================
        // AUTO BARCODE + CUSTOMER ACCOUNT + WHATSAPP CREDENTIALS
        // ======================================================
        let accountProvisioning = {
            success: false,
            created: false,
            whatsappSent: false,
        };
        try {
            const barcode =
                await ensureBarcode(tiffin);
            const accountResult =
                await createCustomerAccount(
                    tiffin._id
                );
            accountProvisioning.created =
                accountResult.created;
            if (
                accountResult.created
            ) {                const credentialsMessage =
                    `Your OM Tiffin Customer User ID: ${accountResult.account.userId}. Tap the button below to set up your account and create your password.`;
                await sendWhatsAppTemplate({
                    to: tiffin.phone,
                    templateName:
                        "om_tiffin_custom_announcement",
                    languageCode: "en_GB",
                    components: [
                        {
                            type: "body",
                            parameters: [
                                {
                                    type: "text",
                                    text:
                                        tiffin.customerName ||
                                        "Customer",
                                },
                                {
                                    type: "text",
                                    text: credentialsMessage,
                                },
                            ],
                        },
                    ],
                });
                accountProvisioning.whatsappSent =
                    true;
            }
            accountProvisioning.success =
                true;
            console.log(
                "Customer account provisioned:",
                {
                    customerId: tiffin._id,
                    userId: barcode,
                    whatsappSent:
                        accountProvisioning.whatsappSent,
                }
            );
        } catch (accountError) {
            console.error(
                "Customer account/WhatsApp provisioning failed:",
                accountError.message
            );
        }
        res.status(201).json({
            success: true,
            data: tiffin,
            accountProvisioning,
        });
    } catch (error) {
        console.error(
            "Create Tiffin Error:",
            error
        );
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};// Get All Tiffins
// ======================================================
const getAllTiffins = async (req, res) => {

    try {

        const page =
            Number(req.query.page) || 1;

        const limit =
            Number(req.query.limit) || 5;

        const skip =
            (page - 1) * limit;

        const search =
            req.query.search || "";

        const status =
            req.query.status;

        const sort =
            req.query.sort || "createdAt";


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


        const total =
            await Tiffin.countDocuments(query);


        const tiffins =
            await Tiffin.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit);


        // Add Latest Bill Information
        const customersWithBill =
            await Promise.all(

                tiffins.map(
                    async (customer) => {

                        const latestBill =
                            await Bill.findOne({

                                customer:
                                    customer._id,

                            }).sort({
                                createdAt: -1,
                            });


                        return {

                            ...customer.toObject(),

                            latestBill,

                            price:
                                latestBill
                                    ? latestBill.totalAmount
                                    : 0,

                            paymentStatus:
                                latestBill
                                    ? latestBill.status
                                    : "Pending",

                            pendingAmount:
                                latestBill
                                    ? latestBill.pendingAmount
                                    : 0,

                        };

                    }
                )

            );


        res.status(200).json({

            success: true,

            page,

            totalPages:
                Math.ceil(total / limit),

            totalCustomers:
                total,

            count:
                customersWithBill.length,

            data:
                customersWithBill,

        });


    } catch (error) {

        console.error(
            "âŒ Get All Tiffins Error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                error.message,

        });

    }
};


// ======================================================
// Get Single Tiffin / Customer
// ======================================================
const getTiffinById = async (req, res) => {

    console.log(
        "ðŸ”Ž getTiffinById Called:",
        req.params.id
    );


    try {

        const tiffin =
            await Tiffin.findById(
                req.params.id
            );


        if (!tiffin) {

            return res.status(404).json({

                success: false,

                message:
                    "Customer not found",

            });

        }


        // ==========================================
        // Get Latest Bill
        // ==========================================

        const latestBill =
            await Bill.findOne({

                customer:
                    tiffin._id,

            }).sort({
                createdAt: -1,
            });


        // ==========================================
        // Prepare Customer Data
        // ==========================================

        const customerData =
            tiffin.toObject();


        // ==========================================
        // FIX DEFAULT PRICING
        // ==========================================

        if (
            !customerData.pricing ||
            customerData.pricing.pricingType ===
                "default"
        ) {

            customerData.pricing =
                await getDefaultPricing();

        }


        // ==========================================
        // BILL INFORMATION
        // ==========================================

        if (latestBill) {

            customerData.latestBill =
                latestBill;


            customerData.price =
                Number(
                    latestBill.totalAmount || 0
                );


            customerData.paymentStatus =
                latestBill.status ||
                "Pending";


            customerData.pendingAmount =
                Number(
                    latestBill.pendingAmount || 0
                );

        } else {

            customerData.latestBill =
                null;


            customerData.price =
                Number(
                    customerData.price || 0
                );


            customerData.paymentStatus =
                customerData.paymentStatus ||
                "Pending";


            customerData.pendingAmount =
                Number(
                    customerData.pendingAmount || 0
                );

        }


        console.log(
            "ðŸ“¦ Customer Response:",
            {
                customerName:
                    customerData.customerName,

                pricing:
                    customerData.pricing,

                price:
                    customerData.price,

                paymentStatus:
                    customerData.paymentStatus,

                pendingAmount:
                    customerData.pendingAmount,
            }
        );


        res.status(200).json({

            success: true,

            data:
                customerData,

        });


    } catch (error) {

        console.error(
            "âŒ Get Tiffin By ID Error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                error.message,

        });

    }
};


// ======================================================
// Update Tiffin
// ======================================================
const updateTiffin = async (req, res) => {

    try {

        // ==========================================
        // Prepare Pricing
        // ==========================================

        const pricing =
            await preparePricing(
                req.body.pricing
            );


        const updateData = {

            customerName:
                req.body.customerName,

            phone:
                req.body.phone,

            address:
                req.body.address,

            mealType:
                req.body.mealType,

            status:
                req.body.status,

            pricing:
                pricing,

        };


        // Keep monthly price only if explicitly sent
        if (
            req.body.price !== undefined
        ) {

            updateData.price =
                Number(
                    req.body.price || 0
                );

        }


        const tiffin =
            await Tiffin.findByIdAndUpdate(

                req.params.id,

                updateData,

                {
                    new: true,

                    runValidators: true,
                }

            );


        if (!tiffin) {

            return res.status(404).json({

                success: false,

                message:
                    "Customer not found",

            });

        }


        console.log(
            "âœ… Customer Updated:",
            tiffin._id
        );


        // ======================================================
    // ENSURE CUSTOMER ACCOUNT
    // ======================================================
    // Existing account remains unchanged.
    // Missing account is created automatically.
    // No WhatsApp credentials are sent during normal update.
    let accountProvisioning = {
        success: false,
        created: false,
    };
    try {
        const accountResult =
            await ensureCustomerAccount(
                tiffin._id
            );
        accountProvisioning.created =
            accountResult.created;
        accountProvisioning.success =
            true;
        console.log(
            "Customer account reconciliation:",
            {
                customerId: tiffin._id,
                userId: accountResult.account?.userId,
                created: accountResult.created,
            }
        );
    } catch (accountError) {
        console.error(
            "Customer account reconciliation failed:",
            accountError.message
        );
    }

    res.status(200).json({

            success: true,

            data:
                tiffin,

        });


    } 

    catch (error) {
  console.error(
    "âŒ Create Tiffin Error:",
    error
  );

  if (error.errors?.phone) {
    return res.status(400).json({
      success: false,
      message: "âŒ Invalid mobile number",
    });
  }

  return res.status(400).json({
    success: false,
    message:
      error.message ||
      "Failed to create customer",
  });
}
};


// ======================================================
// Delete Tiffin
// ======================================================
const deleteTiffin = async (req, res) => {

    try {

        const tiffin =
            await Tiffin.findByIdAndDelete(
                req.params.id
            );


        if (!tiffin) {

            return res.status(404).json({

                success: false,

                message:
                    "Customer not found",

            });

        }


        res.status(200).json({

            success: true,

            message:
                "Customer deleted successfully",

        });


    } catch (error) {

        console.error(
            "âŒ Delete Tiffin Error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                error.message,

        });

    }
};


// ======================================================
// Mark Payment as Paid
// ======================================================
const markPaymentPaid = async (req, res) => {

    try {

        const bill =
            await Bill.findById(
                req.params.id
            );


        if (!bill) {

            return res.status(404).json({

                success: false,

                message:
                    "Bill not found",

            });

        }


        bill.paidAmount =
            bill.totalAmount;

        bill.pendingAmount =
            0;

        bill.status =
            "Paid";


        await bill.save();


        res.status(200).json({

            success: true,

            message:
                "Payment marked as Paid",

            data:
                bill,

        });


    } catch (error) {

        console.error(
            "âŒ Mark Payment Paid Error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                error.message,

        });

    }
};


// ======================================================
// Dashboard Statistics
// ======================================================
const getDashboardStats = async (req, res) => {

    console.log(
        "âœ… getDashboardStats Called"
    );


    try {

        const totalCustomers =
            await Tiffin.countDocuments();


        const activeCustomers =
            await Tiffin.countDocuments({

                status:
                    "Active",

            });


        const inactiveCustomers =
            await Tiffin.countDocuments({

                status:
                    "Inactive",

            });


        const income =
            await Bill.aggregate([

                {

                    $group: {

                        _id: null,

                        total: {

                            $sum:
                                "$totalAmount",

                        },

                    },

                },

            ]);


        console.log(
            "Income Aggregate:",
            income
        );


        const monthlyIncome =
            income.length > 0
                ? income[0].total
                : 0;


        console.log(
            "Dashboard Response:",
            {

                totalCustomers,

                activeCustomers,

                inactiveCustomers,

                monthlyIncome,

            }
        );


        res.status(200).json({

            success: true,

            data: {

                totalCustomers,

                activeCustomers,

                inactiveCustomers,

                monthlyIncome,

            },

        });


    } catch (error) {

        console.error(
            "âŒ Dashboard Stats Error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                error.message,

        });

    }
};


// ======================================================
// EXPORTS
// ======================================================
module.exports = {

    createTiffin,

    getAllTiffins,

    getTiffinById,

    updateTiffin,

    deleteTiffin,

    markPaymentPaid,

    getDashboardStats,

};


















