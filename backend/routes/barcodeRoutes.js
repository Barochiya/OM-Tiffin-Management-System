const express = require("express");
const {
  getCustomerBarcode,
  getAllCustomerBarcodes,
  lookupBarcode,
} = require("../controllers/barcodeController");
const router = express.Router();
router.get(
  "/customer/:customerId",
  getCustomerBarcode
);
router.get(
  "/customers/active",
  getAllCustomerBarcodes
);
router.get(
  "/lookup/:barcode",
  lookupBarcode
);
module.exports = router;