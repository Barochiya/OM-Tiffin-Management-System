const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  provisionCustomerAccount,
  setCustomerLoginEnabled,
  regenerateTemporaryPassword,
  getCustomerAccountStatuses,
} = require("../controllers/customerAccountController");
// Admin-authorized customer account provisioning
router.post(
  "/provision",
  protect,
  provisionCustomerAccount
);
// Admin-authorized customer login ON/OFF
router.put(
  "/:customerId/login",
  protect,
  setCustomerLoginEnabled
);
// Admin-authorized temporary password regeneration
router.post(
  "/:customerId/regenerate-password",
  protect,
  regenerateTemporaryPassword
);
// Admin-authorized customer account status list
router.get(
  "/status",
  protect,
  getCustomerAccountStatuses
);
module.exports = router;
