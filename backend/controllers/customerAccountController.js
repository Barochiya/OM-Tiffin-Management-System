const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const {
  createCustomerAccount,
} = require("../services/customerAccountService");
const CustomerAccount = require("../models/CustomerAccount");
const CustomerFirstLoginLog = require("../models/CustomerFirstLoginLog");
const CustomerLoginIdDelivery = require("../models/CustomerLoginIdDelivery");
const Tiffin = require("../models/Tiffin");
const { sendWhatsAppTemplate } = require("../utils/whatsappSender");
const WHATSAPP_TEMPLATES = require("../config/whatsappTemplates");
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

    const customer = await Tiffin.findById(customerId);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (!customer.phone) {
      return res.status(400).json({
        success: false,
        message: "Customer phone number is not available",
      });
    }

    const temporaryPassword = generateTemporaryPassword();

    account.passwordHash = await bcrypt.hash(
      temporaryPassword,
      12
    );
    account.isFirstLogin = true;
    account.passwordChangedAt = null;
    account.failedLoginAttempts = 0;
    account.lockedUntil = null;

    await account.save();    const credentialsMessage =
      `Your OM Tiffin Customer User ID: ${account.userId}. ` +
      `This is your login detail. ` +
      `Please set up your customer account. ` +
      `Please click here to set up your account. ` +
      `Click on button to set up your account.`;

    const template = WHATSAPP_TEMPLATES.CUSTOM_ANNOUNCEMENT;

    if (!template) {
      throw new Error(
        "CUSTOM_ANNOUNCEMENT WhatsApp template is not configured"
      );
    }

    const whatsappResponse = await sendWhatsAppTemplate({
      to: customer.phone,
      templateName: template.name,
      languageCode: template.language,
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: customer.customerName || "Customer",
            },
            {
              type: "text",
              text: credentialsMessage,
            },
          ],
        },
      ],
    });

    const whatsappMessageId =
      whatsappResponse?.messages?.[0]?.id || null;

    return res.status(200).json({
      success: true,
      message:
        "Temporary password regenerated and sent to customer WhatsApp successfully",
      account: {
        id: account._id,
        customer: account.customer,
        userId: account.userId,
        loginEnabled: account.loginEnabled,
        isFirstLogin: account.isFirstLogin,
      },
      whatsapp: {
        sent: true,
        messageId: whatsappMessageId,
        status:
          whatsappResponse?.messages?.[0]?.message_status || null,
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
/**
 * Get customers who have successfully logged in at least once.
 *
 * Important:
 * - Only customers with a first-login record are returned.
 * - Passwords/passwordHash are never selected.
 * - First login time comes from CustomerFirstLoginLog.
 * - Latest login time comes from CustomerAccount.lastLoginAt.
 */
const getCustomerUsers = async (req, res) => {
  try {
    const logs = await CustomerFirstLoginLog.find({})
      .select("customerAccount customer userId firstLoginAt")
      .populate({
        path: "customer",
        select: "customerName phone barcode status",
      })
      .lean();
    const accountIds = logs
      .map((log) => log.customerAccount)
      .filter(Boolean);
    const accounts = await CustomerAccount.find({
      _id: { $in: accountIds },
    })
      .select("_id userId lastLoginAt loginEnabled")
      .lean();
    const accountMap = new Map(
      accounts.map((account) => [
        String(account._id),
        account,
      ])
    );
    const users = logs
      .map((log) => {
        const account = accountMap.get(
          String(log.customerAccount)
        );
        if (!account) {
          return null;
        }
        return {
          customerId: log.customer?._id || log.customer || null,
          customerName: log.customer?.customerName || "",
          phone: log.customer?.phone || "",
          barcode: log.customer?.barcode || log.userId || "",
          userId: log.userId || account.userId || "",
          firstLoginAt: log.firstLoginAt || null,
          lastLoginAt: account.lastLoginAt || null,
          loginEnabled: account.loginEnabled === true,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const aTime = a.firstLoginAt
          ? new Date(a.firstLoginAt).getTime()
          : 0;
        const bTime = b.firstLoginAt
          ? new Date(b.firstLoginAt).getTime()
          : 0;
        return bTime - aTime;
      });
    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("getCustomerUsers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load customer users.",
    });
  }
};
const getLoginIdRecipients = async (req, res) => {
  try {
    const customers = await Tiffin.find({
      barcode: { $exists: true, $ne: "" },
    })
      .select("_id customerName phone barcode status")
      .sort({ barcode: 1 })
      .lean();
    const customerIds = customers.map((customer) => customer._id);
    const accounts = await CustomerAccount.find({
      customer: { $in: customerIds },
    })
      .select("_id customer userId loginEnabled isFirstLogin")
      .lean();
    const accountMap = new Map(
      accounts.map((account) => [
        String(account.customer),
        account,
      ])
    );
    const data = customers.map((customer) => {
      const account = accountMap.get(
        String(customer._id)
      );
      return {
        customerId: customer._id,
        customerName: customer.customerName || "",
        phone: customer.phone || "",
        barcode: customer.barcode || "",
        userId: account?.userId || customer.barcode || "",
        status: customer.status || "Active",
        accountExists: Boolean(account),
        loginEnabled: account?.loginEnabled === true,
        isFirstLogin: account?.isFirstLogin === true,
        ready:
          Boolean(account) &&
          Boolean(account.userId) &&
          Boolean(customer.phone),
      };
    });
    return res.status(200).json({
      success: true,
      count: data.length,
      readyCount: data.filter((item) => item.ready).length,
      data,
    });
  } catch (error) {
    console.error("getLoginIdRecipients:", error);
    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to load customer login ID recipients",
    });
  }
};
const sendLoginIdsWhatsApp = async (req, res) => {
  try {
    const { customerIds, userIds } = req.body;
    if (
      (!Array.isArray(customerIds) || customerIds.length === 0) &&
      (!Array.isArray(userIds) || userIds.length === 0)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "customerIds or userIds must contain at least one customer",
      });
    }
    let customers = [];
    if (
      Array.isArray(customerIds) &&
      customerIds.length > 0
    ) {
      customers = await Tiffin.find({
        _id: { $in: customerIds },
      })
        .select("_id customerName phone barcode status")
        .lean();
    } else {
      const normalizedUserIds = userIds
        .map((value) => String(value || "").trim().toUpperCase())
        .filter(Boolean);
      const accounts = await CustomerAccount.find({
        userId: { $in: normalizedUserIds },
      })
        .select("customer userId loginEnabled")
        .lean();
      const customerIdsFromAccounts = accounts
        .map((account) => account.customer)
        .filter(Boolean);
      customers = await Tiffin.find({
        _id: { $in: customerIdsFromAccounts },
      })
        .select("_id customerName phone barcode status")
        .lean();
    }
    const customerMap = new Map(
      customers.map((customer) => [
        String(customer._id),
        customer,
      ])
    );
    const accounts = await CustomerAccount.find({
      customer: {
        $in: customers.map((customer) => customer._id),
      },
    })
      .select("_id customer userId loginEnabled")
      .lean();
    const accountMap = new Map(
      accounts.map((account) => [
        String(account.customer),
        account,
      ])
    );
    const results = [];
    for (const customer of customers) {
      const account = accountMap.get(
        String(customer._id)
      );
      if (!account) {
        results.push({
          customerId: customer._id,
          customerName: customer.customerName,
          userId: customer.barcode || "",
          success: false,
          status: "failed",
          error: "Customer account not found",
        });
        continue;
      }
      if (!customer.phone) {
        results.push({
          customerId: customer._id,
          customerName: customer.customerName,
          userId: account.userId,
          success: false,
          status: "failed",
          error: "Customer phone number is not available",
        });
        continue;
      }
      const credentialsMessage =
        `Your OM Tiffin Customer User ID: ${account.userId}. ` +
        `This is your login detail. ` +
        `Please set up your customer account. ` +
        `Please click here to set up your account. ` +
        `Click on button to set up your account.`;
      try {
        const template =
          WHATSAPP_TEMPLATES.CUSTOM_ANNOUNCEMENT;
        if (!template) {
          throw new Error(
            "CUSTOM_ANNOUNCEMENT WhatsApp template is not configured"
          );
        }
        const whatsappResponse =
          await sendWhatsAppTemplate({
            to: customer.phone,
            templateName: template.name,
            languageCode: template.language,
            components: [
              {
                type: "body",
                parameters: [
                  {
                    type: "text",
                    text:
                      customer.customerName ||
                      "Customer",
                  },
                  {
                    type: "text",
                    text: credentialsMessage,
                  },
                ],
              },
            ],
          });
        const whatsappMessageId =
          whatsappResponse?.messages?.[0]?.id || null;
        const whatsappMessageStatus =
          whatsappResponse?.messages?.[0]?.message_status ||
          "accepted";
        await CustomerLoginIdDelivery.create({
          customer: customer._id,
          customerAccount: account._id,
          customerName:
            customer.customerName || "Customer",
          userId: account.userId,
          phone: customer.phone,
          templateName: template.name,
          whatsappMessageId,
          whatsappStatus: whatsappMessageStatus,
          sentAt: null,
        });
        results.push({
          customerId: customer._id,
          customerName: customer.customerName,
          userId: account.userId,
          success: true,
          status: "sent",
          messageId: whatsappMessageId,
          messageStatus: whatsappMessageStatus,
        });
      } catch (sendError) {
        results.push({
          customerId: customer._id,
          customerName: customer.customerName,
          userId: account.userId,
          success: false,
          status: "failed",
          error:
            sendError.message ||
            "WhatsApp message failed",
        });
      }
    }
    const sent = results.filter(
      (item) => item.status === "sent"
    ).length;
    const failed = results.filter(
      (item) => item.status === "failed"
    ).length;
    return res.status(200).json({
      success: true,
      message: "Customer login ID WhatsApp sending completed",
      summary: {
        total: results.length,
        sent,
        failed,
      },
      data: results,
    });
  } catch (error) {
    console.error("sendLoginIdsWhatsApp:", error);
    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to send customer login IDs",
    });
  }
};
const getLoginIdDeliveryStatus = async (req, res) => {
  try {
    const deliveries = await CustomerLoginIdDelivery.find({})
      .sort({ createdAt: -1 })
      .lean();
    const latestByCustomer = new Map();
    for (const delivery of deliveries) {
      const customerId = String(delivery.customer);
      if (!latestByCustomer.has(customerId)) {
        latestByCustomer.set(customerId, delivery);
      }
    }
    return res.status(200).json({
      success: true,
      data: Array.from(latestByCustomer.values()),
    });
  } catch (error) {
    console.error("getLoginIdDeliveryStatus:", error);
    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to load customer login ID delivery status",
    });
  }
};
module.exports = {
  getLoginIdRecipients,
  sendLoginIdsWhatsApp,
  getCustomerUsers,
  provisionCustomerAccount,
  setCustomerLoginEnabled,
  regenerateTemporaryPassword,
  getCustomerAccountStatuses,
getLoginIdDeliveryStatus,
};
