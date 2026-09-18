const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const {
  createCustomerAccount,
} = require("../services/customerAccountService");
const CustomerAccount = require("../models/CustomerAccount");
const TEMP_PASSWORD_LENGTH = 10;
const generateTemporaryPassword = () => {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < TEMP_PASSWORD_LENGTH; i += 1) {
    password += alphabet[
      crypto.randomInt(0, alphabet.length)
    ];
  }
  return password;
};
const provisionCustomerAccount = async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }
    const result = await createCustomerAccount(customerId);
    const account = result.account.toObject();
    delete account.passwordHash;
    return res.status(result.created ? 201 : 200).json({
      success: true,
      created: result.created,
      message: result.message,
      account,
      temporaryPassword: result.temporaryPassword,
    });
  } catch (error) {
    console.error(
      "provisionCustomerAccount:",
      error
    );
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Customer account provisioning failed",
    });
  }
};
const setCustomerLoginEnabled = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { enabled } = req.body;
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }
    if (typeof enabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "enabled must be true or false",
      });
    }
    const account = await CustomerAccount.findOne({
      customer: customerId,
    });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found",
      });
    }
    account.loginEnabled = enabled;
    await account.save();
    return res.status(200).json({
      success: true,
      message: enabled
        ? "Customer login enabled"
        : "Customer login disabled",
      account: {
        id: account._id,
        customer: account.customer,
        userId: account.userId,
        loginEnabled: account.loginEnabled,
        isFirstLogin: account.isFirstLogin,
      },
    });
  } catch (error) {
    console.error(
      "setCustomerLoginEnabled:",
      error
    );
    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to update customer login status",
    });
  }
};
const regenerateTemporaryPassword = async (req, res) => {
  try {
    const { customerId } = req.params;
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }
    const account = await CustomerAccount.findOne({
      customer: customerId,
    });
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found",
      });
    }
    const temporaryPassword =
      generateTemporaryPassword();
    account.passwordHash = await bcrypt.hash(
      temporaryPassword,
      12
    );
    account.isFirstLogin = true;
    account.passwordChangedAt = null;
    account.failedLoginAttempts = 0;
    account.lockedUntil = null;
    await account.save();
    return res.status(200).json({
      success: true,
      message:
        "Temporary password regenerated successfully",
      account: {
        id: account._id,
        customer: account.customer,
        userId: account.userId,
        loginEnabled: account.loginEnabled,
        isFirstLogin: account.isFirstLogin,
      },
      temporaryPassword,
    });
  } catch (error) {
    console.error(
      "regenerateTemporaryPassword:",
      error
    );
    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Temporary password regeneration failed",
    });
  }
};
const getCustomerAccountStatuses = async (req, res) => {
  try {
    const accounts = await CustomerAccount.find({})
      .select("_id customer userId loginEnabled isFirstLogin")
      .lean();
    return res.status(200).json({
      success: true,
      accounts,
    });
  } catch (error) {
    console.error("getCustomerAccountStatuses:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load customer account statuses",
    });
  }
};
module.exports = {
  provisionCustomerAccount,
  setCustomerLoginEnabled,
  regenerateTemporaryPassword,
  getCustomerAccountStatuses,
};
