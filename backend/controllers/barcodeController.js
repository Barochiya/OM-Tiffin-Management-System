const Tiffin = require("../models/Tiffin");
const BarcodeCounter = require("../models/BarcodeCounter");
const nextBarcode = async () => {
  const counter = await BarcodeCounter.findOneAndUpdate(
    { key: "customer" },
    { $inc: { value: 1 } },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
  return `OMT-${String(counter.value).padStart(6, "0")}`;
};
const ensureBarcode = async (customer) => {
  if (customer.barcode) {
    return customer.barcode;
  }
  for (let i = 0; i < 5; i += 1) {
    const barcode = await nextBarcode();
    try {
      customer.barcode = barcode;
      await customer.save();
      return barcode;
    } catch (error) {
      if (error?.code !== 11000) {
        throw error;
      }
      customer.barcode = undefined;
    }
  }
  throw new Error("Could not allocate a unique barcode");
};
const getCustomerBarcode = async (req, res) => {
  try {
    const customer = await Tiffin.findById(
      req.params.customerId
    );
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }
    const barcode = await ensureBarcode(customer);
    res.json({
      success: true,
      customer,
      barcode,
    });
  } catch (error) {
    console.error("getCustomerBarcode:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Barcode failed",
    });
  }
};
const getAllCustomerBarcodes = async (req, res) => {
  try {
    const customers = await Tiffin.find({
      status: "Active",
    }).sort({
      customerName: 1,
    });
    const items = [];
    for (const customer of customers) {
      const barcode = await ensureBarcode(customer);
      items.push({
        customer,
        barcode,
      });
    }
    res.json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    console.error(
      "getAllCustomerBarcodes:",
      error
    );
    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Bulk barcode failed",
    });
  }
};
const lookupBarcode = async (req, res) => {
  try {
    const barcode = String(
      req.params.barcode || ""
    )
      .trim()
      .toUpperCase();
    const customer = await Tiffin.findOne({
      barcode,
    });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Barcode not found",
      });
    }
    res.json({
      success: true,
      barcode: customer.barcode,
      status: "assigned",
      customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error.message || "Lookup failed",
    });
  }
};
module.exports = {
  getCustomerBarcode,
  getAllCustomerBarcodes,
  lookupBarcode,
};