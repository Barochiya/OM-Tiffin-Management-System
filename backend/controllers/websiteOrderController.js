const WebsiteOrder = require("../models/WebsiteOrder");
const WebsiteMenu = require("../models/WebsiteMenu");
const WebsiteSettings = require("../models/WebsiteSettings");
const getSettings = async () => {
  const settings = await WebsiteSettings.findOne();
  return settings;
};
const ensureOrdersEnabled = async () => {
  const settings = await getSettings();
  if (settings && settings.onlineOrdersEnabled === false) {
    const error = new Error("Online orders are currently disabled.");
    error.statusCode = 403;
    throw error;
  }
};
const createWebsiteOrder = async (req, res) => {
  try {
    await ensureOrdersEnabled();
    const {
      customerName,
      mobileNumber,
      email,
      deliveryAddress,
      items,
      orderDate,
      specialInstructions,
    } = req.body;
    if (!customerName || !mobileNumber || !deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: "Customer name, mobile number and delivery address are required.",
      });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one menu item is required.",
      });
    }
    const menuIds = items.map((item) => item.menuItemId);
    const menuItems = await WebsiteMenu.find({
      _id: { $in: menuIds },
      isAvailable: true,
    });
    if (menuItems.length !== items.length) {
      return res.status(400).json({
        success: false,
        message: "One or more selected menu items are unavailable.",
      });
    }
    const normalizedItems = items.map((item) => {
      const menuItem = menuItems.find(
        (menu) => String(menu._id) === String(item.menuItemId)
      );
      if (!menuItem) {
        throw new Error("Invalid menu item selected.");
      }
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error("Invalid item quantity.");
      }
      let mealType = item.mealType;
      if (menuItem.mealType === "Lunch") {
        mealType = "Lunch";
      } else if (menuItem.mealType === "Dinner") {
        mealType = "Dinner";
      } else if (!["Lunch", "Dinner"].includes(mealType)) {
        throw new Error(`Please select Lunch or Dinner for ${menuItem.name}.`);
      }
      return {
        menuItemId: menuItem._id,
        name: menuItem.name,
        price: Number(menuItem.price),
        quantity,
        mealType,
      };
    });
    const totalAmount = normalizedItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const order = await WebsiteOrder.create({
      customerName: customerName.trim(),
      mobileNumber: mobileNumber.trim(),
      email: email ? email.trim() : "",
      deliveryAddress: deliveryAddress.trim(),
      items: normalizedItems,
      orderDate: orderDate ? new Date(orderDate) : new Date(),
      specialInstructions: specialInstructions
        ? specialInstructions.trim()
        : "",
      totalAmount,
      paymentStatus: "Pending",
      orderStatus: "Pending",
    });
    return res.status(201).json({
      success: true,
      message: "Online order placed successfully.",
      data: order,
    });
  } catch (error) {
    console.error("Create Website Order Error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create online order.",
    });
  }
};
const getPublicOrderStatus = async (req, res) => {
  try {
    const { mobileNumber } = req.query;
    if (!mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required.",
      });
    }
    const orders = await WebsiteOrder.find({
      mobileNumber: mobileNumber.trim(),
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    return res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Get Public Order Status Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order status.",
    });
  }
};
const getWebsiteOrders = async (req, res) => {
  try {
    const orders = await WebsiteOrder.find()
      .sort({ createdAt: -1 })
      .lean();
    return res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error("Get Website Orders Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch online orders.",
    });
  }
};
const getWebsiteOrderById = async (req, res) => {
  try {
    const order = await WebsiteOrder.findById(req.params.id).lean();
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }
    return res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get Website Order Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order.",
    });
  }
};
const updateWebsiteOrder = async (req, res) => {
  try {
    const allowedFields = [
      "orderStatus",
      "paymentStatus",
      "specialInstructions",
      "deliveryAddress",
    ];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    const order = await WebsiteOrder.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }
    return res.json({
      success: true,
      message: "Order updated successfully.",
      data: order,
    });
  } catch (error) {
    console.error("Update Website Order Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update order.",
    });
  }
};
const deleteWebsiteOrder = async (req, res) => {
  try {
    const order = await WebsiteOrder.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }
    return res.json({
      success: true,
      message: "Order deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Website Order Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete order.",
    });
  }
};
module.exports = {
  createWebsiteOrder,
  getPublicOrderStatus,
  getWebsiteOrders,
  getWebsiteOrderById,
  updateWebsiteOrder,
  deleteWebsiteOrder,
};

