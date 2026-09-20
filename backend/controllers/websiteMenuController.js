const WebsiteMenu = require("../models/WebsiteMenu");
// ======================================================
// Get All Website Menu Items
// ======================================================
const getMenuItems = async (req, res) => {
  try {
    const items = await WebsiteMenu.find()
      .sort({ sortOrder: 1, createdAt: 1 });
    return res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("Get Website Menu Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ======================================================
// Get Public Website Menu
// ======================================================
const getPublicMenuItems = async (req, res) => {
  try {
    const mealType = req.query.mealType;
    const query = {
      isAvailable: true,
    };
    if (["Lunch", "Dinner"].includes(mealType)) {
      query.mealType = {
        $in: [mealType, "Both"],
      };
    }
    const items = await WebsiteMenu.find(query).sort({
      sortOrder: 1,
      createdAt: 1,
    });
    return res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("Get Public Website Menu Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ======================================================
// Create Website Menu Item
// ======================================================
const createMenuItem = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      mealType,
      isAvailable,
      sortOrder,
    } = req.body;
    if (!name || price === undefined || price === null) {
      return res.status(400).json({
        success: false,
        message: "Name and price are required.",
      });
    }
    const item = await WebsiteMenu.create({
      name,
      description: description || "",
      price: Number(price),
      mealType: mealType || "Lunch",
      isAvailable:
        isAvailable !== undefined ? Boolean(isAvailable) : true,
      sortOrder: Number(sortOrder || 0),
    });
    return res.status(201).json({
      success: true,
      message: "Menu item created successfully.",
      data: item,
    });
  } catch (error) {
    console.error("Create Website Menu Error:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
// ======================================================
// Update Website Menu Item
// ======================================================
const updateMenuItem = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      mealType,
      isAvailable,
      sortOrder,
    } = req.body;
    const item = await WebsiteMenu.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description: description || "",
        price: Number(price),
        mealType: mealType || "Lunch",
        isAvailable:
          isAvailable !== undefined ? Boolean(isAvailable) : true,
        sortOrder: Number(sortOrder || 0),
      },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found.",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Menu item updated successfully.",
      data: item,
    });
  } catch (error) {
    console.error("Update Website Menu Error:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
// ======================================================
// Delete Website Menu Item
// ======================================================
const deleteMenuItem = async (req, res) => {
  try {
    const item = await WebsiteMenu.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found.",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Menu item deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Website Menu Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
module.exports = {
  getMenuItems,
  getPublicMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
