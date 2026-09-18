const express = require("express");
const router = express.Router();
const {
  protectCustomer,
} = require("../middleware/customerAuth");
const {
  loginCustomer,
  sendCustomerAccountSetupOtp,
  verifyCustomerAccountSetupOtp,
  setCustomerAccountSetupPassword,
  changeCustomerPassword,
  sendCustomerPasswordResetOtp,
  verifyCustomerPasswordResetOtp,
  resetCustomerPassword,
  sendCustomerUserIdRecoveryOtp,
  verifyCustomerUserIdRecoveryOtp,
} = require("../controllers/customerAuthController");
// Forgot password - Send / Resend WhatsApp OTP
router.post(
  "/forgot-password/send-otp",
  sendCustomerPasswordResetOtp
);// Customer portal login
router.post(
  "/forgot-password/verify-otp",
  verifyCustomerPasswordResetOtp
);router.post(
  "/forgot-password/reset-password",
  resetCustomerPassword
);router.post(
  "/forgot-user-id/send-otp",
  sendCustomerUserIdRecoveryOtp
);
router.post(
  "/forgot-user-id/verify-otp",
  verifyCustomerUserIdRecoveryOtp
);router.post("/login", loginCustomer);
// Account setup - Send / Verify WhatsApp OTP
router.post(
  "/account-setup/send-otp",
  sendCustomerAccountSetupOtp
);
router.post(
  "/account-setup/verify-otp",
  verifyCustomerAccountSetupOtp
);router.post(
  "/account-setup/set-password",
  setCustomerAccountSetupPassword
);
// First-login password change is intentionally allowed
// even when isFirstLogin === true.
router.post(
  "/change-password",
  protectCustomer,
  changeCustomerPassword
);
module.exports = router;
