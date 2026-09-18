const express = require("express");
const router = express.Router();
const {
  protectCustomer,
  requirePasswordChanged,
} = require("../middleware/customerAuth");
const {
  getCustomerProfile,
  getCustomerMealHistory,
  createCustomerModificationRequest,
  getCustomerModificationRequests,
} = require("../controllers/customerPortalController");
// Customer's own profile
router.get(
  "/profile",
  protectCustomer,
  requirePasswordChanged,
  getCustomerProfile
);
// Customer's own meal history
router.get(
  "/meal-history",
  protectCustomer,
  requirePasswordChanged,
  getCustomerMealHistory
);
// Customer creates a modification request
router.post(
  "/modification-requests",
  protectCustomer,
  requirePasswordChanged,
  createCustomerModificationRequest
);
// Customer views their own modification requests
router.get(
  "/modification-requests",
  protectCustomer,
  requirePasswordChanged,
  getCustomerModificationRequests
);
module.exports = router;
