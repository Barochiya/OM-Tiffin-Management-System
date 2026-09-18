const jwt = require("jsonwebtoken");
const CustomerAccount = require("../models/CustomerAccount");
const protectCustomer = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Customer authentication required",
      });
    }
    if (!process.env.CUSTOMER_JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Customer authentication is not configured",
      });
    }
    const decoded = jwt.verify(
      token,
      process.env.CUSTOMER_JWT_SECRET
    );
    if (decoded.type !== "customer") {
      return res.status(401).json({
        success: false,
        message: "Invalid customer token",
      });
    }
    const account = await CustomerAccount.findById(
      decoded.id
    ).select("-passwordHash");
    if (!account) {
      return res.status(401).json({
        success: false,
        message: "Customer account not found",
      });
    }
    if (!account.loginEnabled) {
      return res.status(403).json({
        success: false,
        message: "Customer login is disabled",
      });
    }
    req.customerAccount = account;
    req.customerId = account.customer;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Customer token failed",
    });
  }
};
const requirePasswordChanged = async (req, res, next) => {
  try {
    if (!req.customerAccount) {
      return res.status(401).json({
        success: false,
        message: "Customer authentication required",
      });
    }
    if (req.customerAccount.isFirstLogin) {
      return res.status(403).json({
        success: false,
        code: "FIRST_LOGIN_PASSWORD_CHANGE_REQUIRED",
        message:
          "Please change your temporary password before accessing the customer portal",
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Customer access validation failed",
    });
  }
};
module.exports = {
  protectCustomer,
  requirePasswordChanged,
};
