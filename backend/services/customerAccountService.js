const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const CustomerAccount = require("../models/CustomerAccount");
const Tiffin = require("../models/Tiffin");
const createCustomerAccount = async (customerId) => {
  if (!customerId) {
    throw new Error("Customer ID is required");
  }
  const customer = await Tiffin.findById(customerId);
  if (!customer) {
    throw new Error("Customer not found");
  }
  if (!customer.barcode) {
    throw new Error(
      "Customer barcode is not available. Generate/verify the permanent barcode first."
    );
  }
  const existingAccount = await CustomerAccount.findOne({
    customer: customer._id,
  });
  if (existingAccount) {
    return {
      created: false,
      account: existingAccount,
      temporaryPassword: null,
      message: "Customer account already exists",
    };
  }
  const existingUserId = await CustomerAccount.findOne({
    userId: customer.barcode,
  });
  if (existingUserId) {
    throw new Error(
      "This barcode is already linked to another customer account"
    );
  }
  const temporaryPassword = crypto.randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(
    temporaryPassword,
    12
  );
  const account = await CustomerAccount.create({
    customer: customer._id,
    userId: customer.barcode,
    passwordHash,
    loginEnabled: true,
    isFirstLogin: true,
    passwordChangedAt: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    lastLoginAt: null,
  });
  return {
    created: true,
    account,
    temporaryPassword,
    message: "Customer account created successfully",
  };
};
/**
 * Ensures that a Tiffin customer has a CustomerAccount.
 *
 * Existing accounts are returned unchanged.
 * Missing accounts are created through the existing
 * createCustomerAccount() flow.
 *
 * This function does not send WhatsApp credentials.
 * Credential delivery remains the responsibility of
 * the caller that explicitly provisions a new account.
 */
const ensureCustomerAccount = async (customerId) => {
  if (!customerId) {
    throw new Error("Customer ID is required");
  }
  const customer = await Tiffin.findById(customerId);
  if (!customer) {
    throw new Error("Customer not found");
  }
  if (!customer.barcode) {
    throw new Error(
      "Customer barcode is not available. Generate/verify the permanent barcode first."
    );
  }
  const existingAccount = await CustomerAccount.findOne({
    customer: customer._id,
  });
  if (existingAccount) {
    return {
      created: false,
      account: existingAccount,
      temporaryPassword: null,
      message: "Customer account already exists",
    };
  }
  return createCustomerAccount(customer._id);
};
module.exports = {
  createCustomerAccount,
  ensureCustomerAccount,
};
