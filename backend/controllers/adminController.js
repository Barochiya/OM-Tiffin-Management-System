const generateToken = require("../utils/generateToken");
const Admin = require("../models/Admin");

const registerAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        // Check Existing Admin
        const adminExists = await Admin.findOne({ email });

        if (adminExists) {
            return res.status(400).json({
                success: false,
                message: "Admin already exists",
            });
        }

        // Create Admin
        const admin = await Admin.create({
            name,
            email,
            password,
        });

        res.status(201).json({
            success: true,
            message: "Admin Registered Successfully",
            data: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
            },
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and Password are required",
            });
        }

        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Invalid Email or Password",
            });
        }

        const isMatch = await admin.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid Email or Password",
            });
        }

        const token = generateToken(admin._id);

        res.status(200).json({
            success: true,
            message: "Login Successful",
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
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
    registerAdmin,
    loginAdmin,
};