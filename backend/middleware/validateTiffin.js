console.log("✅ validateTiffin Middleware Loaded");

const validateTiffin = (req, res, next) => {

    console.log("🔥 Validation Middleware Called");
    console.log("Body:", req.body);

    const {
        customerName,
        phone,
        address,
    } = req.body;

    // Required Fields
    if (!customerName || !phone || !address) {
        return res.status(400).json({
            success: false,
            message: "All fields are required",
        });
    }

    // Phone Validation
    if (!/^\d{10}$/.test(phone)) {
        return res.status(400).json({
            success: false,
            message: "Phone number must be exactly 10 digits",
        });
    }

    console.log("✅ Validation Passed");

    next();
};

module.exports = validateTiffin;