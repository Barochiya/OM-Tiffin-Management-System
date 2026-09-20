const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  provisionCustomerAccount,
  setCustomerLoginEnabled,
  regenerateTemporaryPassword,
  getCustomerAccountStatuses,
  getCustomerUsers,
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
// Admin-authorized logged-in customer users list.
// Only customers with a successful first-login record are returned.
router.get(
  "/users",
  protect,
  getCustomerUsers
);
module.exports = router;

