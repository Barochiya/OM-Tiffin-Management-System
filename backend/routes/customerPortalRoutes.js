const express = require("express");
const router = express.Router();
const {
  protectCustomer,
  requirePasswordChanged,
} = require("../middleware/customerAuth");
const {
  getCustomerProfile,
  updateCustomerProfile,
  getCustomerBills,
  getCustomerBillById,
downloadCustomerBillPdf,
  getCustomerMealHistory,
  createCustomerModificationRequest,
  getCustomerModificationRequests,
getCustomerPayments,
getCustomerAnnouncements,
} = require("../controllers/customerPortalController");
// Customer updates their own profile
router.put(
  "/profile",
  protectCustomer,
  requirePasswordChanged,
  updateCustomerProfile
);// Customer's own profile
router.get(
  "/announcements",
  protectCustomer,
  requirePasswordChanged,
  getCustomerAnnouncements
);router.get(
  "/payments",
  protectCustomer,
  requirePasswordChanged,
  getCustomerPayments
);router.get(
  "/profile",
  protectCustomer,
  requirePasswordChanged,
  getCustomerProfile
);
// Customer's own bill history
router.get(
  "/bills",
  protectCustomer,
  requirePasswordChanged,
  getCustomerBills
);
router.get(
  "/bills/:billId/pdf",
  protectCustomer,
  requirePasswordChanged,
  downloadCustomerBillPdf
);
router.get(
  "/bills/:billId",
  protectCustomer,
  requirePasswordChanged,
  getCustomerBillById
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









