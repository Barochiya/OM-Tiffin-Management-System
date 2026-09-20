const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const CustomerAccount = require("../models/CustomerAccount");
const CustomerFirstLoginLog = require("../models/CustomerFirstLoginLog");
const crypto = require("crypto");
const Tiffin = require("../models/Tiffin");
const CustomerOtp = require("../models/CustomerOtp");
const { sendWhatsAppTemplate, normalizeIndianPhone } = require("../utils/whatsappSender");
const WHATSAPP_TEMPLATES = require("../config/whatsappTemplates");
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const CUSTOMER_OTP_EXPIRY_MS = 10 * 60 * 1000;
const CUSTOMER_OTP_MAX_ATTEMPTS = 5;
const CUSTOMER_OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const CUSTOMER_RESET_TOKEN_EXPIRY_MS = 10 * 60 * 1000;
const createCustomerToken = (accountId, isFirstLogin = false) => {
  if (!process.env.CUSTOMER_JWT_SECRET) {
    throw new Error("CUSTOMER_JWT_SECRET is not configured");
  }
  return jwt.sign(
    {
      id: accountId,
      type: "customer",
      isFirstLogin,
    },
    process.env.CUSTOMER_JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};
const loginCustomer = async (req, res) => {
  try {
    const userId = String(req.body.userId || "")
      .trim()
      .toUpperCase();
    const password = String(req.body.password || "");
    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        message: "User ID and password are required",
      });
    }
    const account = await CustomerAccount.findOne({
      userId,
    });
    if (!account) {
      return res.status(401).json({
        success: false,
        message: "Invalid User ID or password",
      });
    }
    if (!account.loginEnabled) {
      return res.status(403).json({
        success: false,
        message: "Customer login is disabled",
      });
    }
    // Sequence 2: Reject login when the linked Tiffin customer
    // has been deleted from the admin panel.
    const activeCustomer = await Tiffin.findById(account.customer);
    if (!activeCustomer) {
      return res.status(403).json({
        success: false,
        message:
          "You are no longer an active OM Tiffin Service customer. Please contact OM Tiffin Service.",
      });
    }
    if (
      account.lockedUntil &&
      account.lockedUntil.getTime() > Date.now()
    ) {
      return res.status(423).json({
        success: false,
        message:
          "Account temporarily locked. Please try again later.",
      });
    }
    if (
      account.lockedUntil &&
      account.lockedUntil.getTime() <= Date.now()
    ) {
      account.failedLoginAttempts = 0;
      account.lockedUntil = null;
      await account.save();
    }
    const passwordMatch = await bcrypt.compare(
      password,
      account.passwordHash
    );
    if (!passwordMatch) {
      account.failedLoginAttempts += 1;
      if (
        account.failedLoginAttempts >=
        MAX_FAILED_ATTEMPTS
      ) {
        account.lockedUntil = new Date(
          Date.now() + LOCK_DURATION_MS
        );
      }
      await account.save();
      if (account.lockedUntil) {
        return res.status(423).json({
          success: false,
          message:
            "Too many failed attempts. Account temporarily locked.",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid User ID or password",
      });
    }
    account.failedLoginAttempts = 0;
    account.lockedUntil = null;
    const loginAt = new Date();
    // Create exactly ONE first-login record.
    // $setOnInsert ensures an existing first-login record is never overwritten.
    try {
      await CustomerFirstLoginLog.updateOne(
        { customerAccount: account._id },
        {
          $setOnInsert: {
            customerAccount: account._id,
            customer: account.customer,
            userId: account.userId,
            firstLoginAt: loginAt,
          },
        },
        { upsert: true }
      );
    } catch (logError) {
      // Ignore duplicate-key race if two login requests arrive together.
      if (logError?.code !== 11000) {
        throw logError;
      }
    }
    // Existing behaviour: latest successful login is always updated.
    account.lastLoginAt = loginAt;
    await account.save();
    const token = createCustomerToken(
      account._id.toString(),
      account.isFirstLogin
    );
    return res.status(200).json({
      success: true,
      message: "Customer login successful",
      token,
      customer: {
        id: account.customer,
        userId: account.userId,
        isFirstLogin: account.isFirstLogin,
      },
    });
  } catch (error) {
    console.error("loginCustomer:", error);
    return res.status(500).json({
      success: false,
      message: "Customer login failed",
    });
  }
};
const sendCustomerPasswordResetOtp = async (req, res) => {
  console.log("CUSTOMER OTP CONTROLLER ENTER");
  console.log("OTP REQUEST BODY:", {
    userId: req.body?.userId || null
  });
  try {
    const userId = String(req.body.userId || "")
      .trim()
      .toUpperCase();
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }
    const account = await CustomerAccount.findOne({
      userId,
    }).populate("customer");
    console.log("OTP ACCOUNT CHECK:", {
      accountFound: Boolean(account),
      loginEnabled: account?.loginEnabled ?? null,
      customerFound: Boolean(account?.customer),
      phonePresent: Boolean(account?.customer?.phone)
    });
    // Generic response prevents account enumeration.
    if (
      !account ||
      !account.loginEnabled ||
      !account.customer ||
      !account.customer.phone
    ) {
      return res.status(200).json({
        success: true,
        message:
          "If the account is eligible, an OTP has been sent to the registered WhatsApp number.",
      });
    }
    console.log("CUSTOMER OTP ACCOUNT CHECK", {
  accountFound: Boolean(account),
  loginEnabled: account ? Boolean(account.loginEnabled) : null,
  customerFound: account ? Boolean(account.customer) : null,
  phonePresent: account?.customer ? Boolean(account.customer.phone) : null,
});
const phone = String(account.customer.phone).trim();
    const latestOtp = await CustomerOtp.findOne({
      customerAccount: account._id,
    }).sort({ createdAt: -1 });
    if (
      latestOtp &&
      Date.now() - new Date(latestOtp.createdAt).getTime() <
        CUSTOMER_OTP_RESEND_COOLDOWN_MS
    ) {
      const remainingSeconds = Math.ceil(
        (CUSTOMER_OTP_RESEND_COOLDOWN_MS -
          (Date.now() - new Date(latestOtp.createdAt).getTime())) /
          1000
      );
      return res.status(429).json({
        success: false,
        code: "OTP_RESEND_COOLDOWN",
        message: `Please wait ${remainingSeconds} seconds before requesting another OTP.`,
        retryAfterSeconds: remainingSeconds,
      });
    }
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");
    await CustomerOtp.deleteMany({
      customerAccount: account._id,
    });
    await CustomerOtp.create({
      purpose: "PASSWORD_RESET",
      customer: account.customer._id,
      customerAccount: account._id,
      phone,
      otpHash,
      expiresAt: new Date(Date.now() + CUSTOMER_OTP_EXPIRY_MS),
      attempts: 0,
      verifiedAt: null,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
      usedAt: null,
    });
    const otpTemplate = WHATSAPP_TEMPLATES.CUSTOMER_OTP;
    console.log("OTP WHATSAPP SEND START", {
  phonePresent: Boolean(phone),
  templateName: otpTemplate?.name || null,
  languageCode: otpTemplate?.language || null,
});
const whatsappResponse = await sendWhatsAppTemplate({
  to: phone,
  templateName: otpTemplate.name,
  languageCode: otpTemplate.language,
  components: [
    {
      type: "body",
      parameters: [
        {
          type: "text",
          text: otp,
        },
      ],
    },
    {
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [
        {
          type: "text",
          text: otp,
        },
      ],
    },
  ],
});
const whatsappMessageId =
  whatsappResponse?.messages?.[0]?.id || null;
const currentOtp = await CustomerOtp.findOne({
  customerAccount: account._id,
  otpHash,
}).sort({ createdAt: -1 });
if (currentOtp && whatsappMessageId) {
  currentOtp.whatsappMessageId = whatsappMessageId;
  currentOtp.whatsappStatus = "accepted";
  currentOtp.whatsappSentAt = new Date();
  await currentOtp.save();
}
    return res.status(200).json({
      success: true,
      message: "OTP sent to your registered WhatsApp number.",
      expiresInSeconds: CUSTOMER_OTP_EXPIRY_MS / 1000,
      resendAfterSeconds:
        CUSTOMER_OTP_RESEND_COOLDOWN_MS / 1000,
    });
  } catch (error) {
    console.error("sendCustomerPasswordResetOtp:", error);
    console.error("OTP Meta error details:", {
      status: error?.status || null,
      code: error?.meta?.code || null,
      type: error?.meta?.type || null,
      message: error?.meta?.message || null,
      errorData: error?.meta?.error_data || null,
    });
    return res.status(500).json({
      success: false,
      message: "Unable to send OTP. Please try again later.",
    });
  }
};const verifyCustomerPasswordResetOtp = async (req, res) => {
  try {
    const userId = String(req.body.userId || "")
      .trim()
      .toUpperCase();
    const otp = String(req.body.otp || "").trim();
    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: "User ID and OTP are required.",
      });
    }
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "OTP must be a 6-digit code.",
      });
    }
    const account = await CustomerAccount.findOne({
      userId,
    });
    if (!account || !account.loginEnabled) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP.",
      });
    }
    const otpRecord = await CustomerOtp.findOne({
      customerAccount: account._id,
      usedAt: null,
    }).sort({ createdAt: -1 });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP.",
      });
    }
    if (otpRecord.expiresAt.getTime() <= Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }
    if (otpRecord.attempts >= CUSTOMER_OTP_MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: "Maximum OTP attempts exceeded. Please request a new OTP.",
      });
    }
    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");
    if (otpHash !== otpRecord.otpHash) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP.",
        attemptsRemaining: Math.max(
          0,
          CUSTOMER_OTP_MAX_ATTEMPTS - otpRecord.attempts
        ),
      });
    }
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    otpRecord.verifiedAt = new Date();
    otpRecord.resetTokenHash = resetTokenHash;
    otpRecord.resetTokenExpiresAt = new Date(
      Date.now() + CUSTOMER_RESET_TOKEN_EXPIRY_MS
    );
    await otpRecord.save();
    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
      resetToken,
      expiresInSeconds: CUSTOMER_RESET_TOKEN_EXPIRY_MS / 1000,
    });
  } catch (error) {
    console.error("verifyCustomerPasswordResetOtp:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to verify OTP. Please try again later.",
    });
  }
};const resetCustomerPassword = async (req, res) => {
  try {
    const userId = String(req.body.userId || "")
      .trim()
      .toUpperCase();
    const resetToken = String(req.body.resetToken || "").trim();
    const newPassword = String(req.body.newPassword || "");
    const confirmPassword = String(req.body.confirmPassword || "");
    if (!userId || !resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "User ID, reset token, new password and confirm password are required.",
      });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long.",
      });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match.",
      });
    }
    const account = await CustomerAccount.findOne({
      userId,
    });
    if (!account || !account.loginEnabled) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset request.",
      });
    }
    const resetTokenHash = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const otpRecord = await CustomerOtp.findOne({
      customerAccount: account._id,
      verifiedAt: { $ne: null },
      usedAt: null,
      resetTokenHash,
    }).sort({ createdAt: -1 });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset request.",
      });
    }
    if (
      !otpRecord.resetTokenExpiresAt ||
      otpRecord.resetTokenExpiresAt.getTime() <= Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Reset request has expired. Please request a new OTP.",
      });
    }
    const samePassword = await bcrypt.compare(
      newPassword,
      account.passwordHash
    );
    if (samePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from the current password.",
      });
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    account.passwordHash = passwordHash;
    account.isFirstLogin = false;
    account.passwordChangedAt = new Date();
    account.failedLoginAttempts = 0;
    account.lockedUntil = null;
    await account.save();
    otpRecord.usedAt = new Date();
    otpRecord.resetTokenHash = null;
    otpRecord.resetTokenExpiresAt = null;
    await otpRecord.save();
    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    console.error("resetCustomerPassword:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to reset password. Please try again later.",
    });
  }
};const changeCustomerPassword = async (req, res) => {
  try {
    const currentPassword = String(
      req.body.currentPassword || ""
    );
    const newPassword = String(
      req.body.newPassword || ""
    );
    const confirmPassword = String(
      req.body.confirmPassword || ""
    );
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password are required",
      });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 8 characters long",
      });
    }
    const account = await CustomerAccount.findById(
      req.customerAccount._id
    );
    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found",
      });
    }
    /*
     * FIRST LOGIN:
     * Temporary password has already been verified by loginCustomer.
     * Do not ask for current password again.
     */
    if (account.isFirstLogin) {
      account.passwordHash = await bcrypt.hash(
        newPassword,
        12
      );
      account.isFirstLogin = false;
      account.passwordChangedAt = new Date();
      account.failedLoginAttempts = 0;
      account.lockedUntil = null;
      await account.save();
      return res.status(200).json({
        success: true,
        message: "Password set successfully",
        customer: {
          id: account.customer,
          userId: account.userId,
          isFirstLogin: account.isFirstLogin,
        },
      });
    }
    /*
     * REGULAR PASSWORD CHANGE:
     * Current password is required.
     */
    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password is required",
      });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from current password",
      });
    }
    const passwordMatch = await bcrypt.compare(
      currentPassword,
      account.passwordHash
    );
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }
    account.passwordHash = await bcrypt.hash(
      newPassword,
      12
    );
    account.isFirstLogin = false;
    account.passwordChangedAt = new Date();
    account.failedLoginAttempts = 0;
    account.lockedUntil = null;
    await account.save();
    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
      customer: {
        id: account.customer,
        userId: account.userId,
        isFirstLogin: account.isFirstLogin,
      },
    });
  } catch (error) {
    console.error(
      "changeCustomerPassword:",
      error
    );
    return res.status(500).json({
      success: false,
      message: "Password change failed",
    });
  }
};const sendCustomerUserIdRecoveryOtp = async (req, res) => {
  try {
    console.log("CUSTOMER USER ID RECOVERY OTP CONTROLLER ENTER");
    const rawPhone = String(req.body?.phone || "").trim();
    const phone = rawPhone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid registered WhatsApp number",
      });
    }
    const accounts = await CustomerAccount.find({
      loginEnabled: true,
    }).populate({
      path: "customer",
      select: "phone customerName",
    });
    const matches = accounts.filter((account) => {
      const customerPhone = String(account.customer?.phone || "")
        .replace(/\D/g, "");
      return customerPhone === phone;
    });
    // Do not reveal whether a phone number exists.
    // Also reject ambiguous phone numbers linked to multiple accounts.
    if (matches.length !== 1) {
      return res.status(200).json({
        success: true,
        message:
          "If this number is registered, an OTP will be sent to your WhatsApp.",
      });
    }
    const account = matches[0];
    const latestOtp = await CustomerOtp.findOne({
      customerAccount: account._id,
      purpose: "USER_ID_RECOVERY",
      createdAt: {
        $gte: new Date(
          Date.now() - CUSTOMER_OTP_RESEND_COOLDOWN_MS
        ),
      },
    }).sort({ createdAt: -1 });
    if (latestOtp) {
      return res.status(429).json({
        success: false,
        message:
          "Please wait before requesting another OTP.",
      });
    }
    const otp = String(crypto.randomInt(100000, 1000000));
    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");
    await CustomerOtp.deleteMany({
      customerAccount: account._id,
      purpose: "USER_ID_RECOVERY",
    });
    const otpRecord = await CustomerOtp.create({
      customer: account.customer._id,
      customerAccount: account._id,
      phone,
      purpose: "USER_ID_RECOVERY",
      otpHash,
      expiresAt: new Date(
        Date.now() + CUSTOMER_OTP_EXPIRY_MS
      ),
    });
    const whatsappResult = await sendWhatsAppTemplate({
      to: phone,
      templateName: WHATSAPP_TEMPLATES.CUSTOMER_OTP.name,
      languageCode: "en_GB",
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: otp,
            },
          ],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [
            {
              type: "text",
              text: otp,
            },
          ],
        },
      ],
    });
    otpRecord.whatsappMessageId =
      whatsappResult?.messages?.[0]?.id || null;
    otpRecord.whatsappStatus = "accepted";
    otpRecord.whatsappSentAt = new Date();
    await otpRecord.save();
    return res.status(200).json({
      success: true,
      message:
        "If this number is registered, an OTP will be sent to your WhatsApp.",
    });
  } catch (error) {
    console.error(
      "sendCustomerUserIdRecoveryOtp:",
      error
    );
    return res.status(500).json({
      success: false,
      message: "Unable to process User ID recovery request",
    });
  }
};
const verifyCustomerUserIdRecoveryOtp = async (req, res) => {
  try {
    console.log("CUSTOMER USER ID RECOVERY VERIFY CONTROLLER ENTER");
    const rawPhone = String(req.body?.phone || "").trim();
    const phone = rawPhone.replace(/\D/g, "");
    const otp = String(req.body?.otp || "").trim();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid registered WhatsApp number",
      });
    }
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6-digit OTP",
      });
    }
    const accounts = await CustomerAccount.find({
      loginEnabled: true,
    }).populate({
      path: "customer",
      select: "phone customerName",
    });
    const matches = accounts.filter((account) => {
      const customerPhone = String(account.customer?.phone || "")
        .replace(/\D/g, "");
      return customerPhone === phone;
    });
    if (matches.length !== 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }
    const account = matches[0];
    const otpRecord = await CustomerOtp.findOne({
      customerAccount: account._id,
      purpose: "USER_ID_RECOVERY",
      usedAt: null,
    }).sort({ createdAt: -1 });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }
    if (otpRecord.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }
    if (otpRecord.attempts >= CUSTOMER_OTP_MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: "Too many invalid OTP attempts. Please request a new OTP.",
      });
    }
    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");
    if (otpHash !== otpRecord.otpHash) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }
    otpRecord.verifiedAt = new Date();
    otpRecord.usedAt = new Date();
    await otpRecord.save();
    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      userId: account.userId,
    });
  } catch (error) {
    console.error(
      "verifyCustomerUserIdRecoveryOtp:",
      error
    );
    return res.status(500).json({
      success: false,
      message: "Unable to verify User ID recovery OTP",
    });
  }
};
const sendCustomerAccountSetupOtp = async (req, res) => {
  try {
    const userId = String(req.body?.userId || "")
      .trim()
      .toUpperCase();
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }
    const account = await CustomerAccount.findOne({
      userId,
      loginEnabled: true,
    }).populate("customer");
    if (account && account.isFirstLogin === false) {
return res.status(409).json({
success: false,
alreadyRegistered: true,
message: "You are already registered. Please log in.",
});
}
if (!account || !account.customer) {
      return res.status(200).json({
        success: true,
        message:
          "If the account is eligible, a verification code will be sent to the registered WhatsApp number.",
      });
    }
    if (!account.customer.phone) {
      return res.status(200).json({
        success: true,
        message:
          "If the account is eligible, a verification code will be sent to the registered WhatsApp number.",
      });
    }
    const phone = normalizeIndianPhone(account.customer.phone);
    if (!phone) {
      return res.status(200).json({
        success: true,
        message:
          "If the account is eligible, a verification code will be sent to the registered WhatsApp number.",
      });
    }
    const recentOtp = await CustomerOtp.findOne({
      customerAccount: account._id,
      purpose: "ACCOUNT_SETUP",
      createdAt: {
        $gte: new Date(Date.now() - CUSTOMER_OTP_RESEND_COOLDOWN_MS),
      },
    }).sort({ createdAt: -1 });
    if (recentOtp) {
      return res.status(429).json({
        success: false,
        message: "Please wait before requesting another verification code.",
        retryAfterSeconds: Math.ceil(
          (recentOtp.createdAt.getTime() +
            CUSTOMER_OTP_RESEND_COOLDOWN_MS -
            Date.now()) /
            1000
        ),
      });
    }
    const otp = String(crypto.randomInt(100000, 1000000));
    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");
    await CustomerOtp.deleteMany({
      customerAccount: account._id,
      purpose: "ACCOUNT_SETUP",
    });
    const expiresAt = new Date(Date.now() + CUSTOMER_OTP_EXPIRY_MS);
    const otpRecord = await CustomerOtp.create({
      customer: account.customer._id,
      customerAccount: account._id,
      phone,
      purpose: "ACCOUNT_SETUP",
      otpHash,
      expiresAt,
      attempts: 0,
    });
    try {
      const whatsappResult = await sendWhatsAppTemplate({
        to: phone,
        templateName: WHATSAPP_TEMPLATES.CUSTOMER_OTP.name,
        languageCode: WHATSAPP_TEMPLATES.CUSTOMER_OTP.language,
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: otp }],
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [{ type: "text", text: otp }],
          },
        ],
      });
      const messageId =
        whatsappResult?.messages?.[0]?.id ||
        whatsappResult?.messageId ||
        null;
      otpRecord.whatsappMessageId = messageId;
      otpRecord.whatsappStatus = messageId ? "sent" : "unknown";
      otpRecord.whatsappSentAt = new Date();
      await otpRecord.save();
      return res.status(200).json({
        success: true,
        message: "Verification code sent successfully.",
        expiresInSeconds: Math.floor(CUSTOMER_OTP_EXPIRY_MS / 1000),
        resendAfterSeconds: Math.floor(
          CUSTOMER_OTP_RESEND_COOLDOWN_MS / 1000
        ),
      });
    } catch (error) {
      await CustomerOtp.deleteOne({ _id: otpRecord._id });
      console.error("sendCustomerAccountSetupOtp WhatsApp error:", error);
      return res.status(500).json({
        success: false,
        message: "Unable to send verification code. Please try again later.",
      });
    }
  } catch (error) {
    console.error("sendCustomerAccountSetupOtp:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to send verification code. Please try again later.",
    });
  }
};
const verifyCustomerAccountSetupOtp = async (req, res) => {
  try {
    const userId = String(req.body?.userId || "")
      .trim()
      .toUpperCase();
    const otp = String(req.body?.otp || "").trim();
    if (!userId || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message:
          "User ID and a valid 6-digit verification code are required.",
      });
    }
    const account = await CustomerAccount.findOne({
      userId,
      loginEnabled: true,
    });
    if (account && account.isFirstLogin === false) {
      return res.status(409).json({
        success: false,
        alreadyRegistered: true,
        message: "You are already registered. Please log in.",
      });
    }
    if (!account) {
      return res.status(401).json({
        success: false,
        message: "Invalid verification request.",
      });
    }
    const otpRecord = await CustomerOtp.findOne({
      customerAccount: account._id,
      purpose: "ACCOUNT_SETUP",
      usedAt: null,
      verifiedAt: null,
    }).sort({ createdAt: -1 });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Verification code is invalid or expired.",
      });
    }
    if (otpRecord.expiresAt.getTime() <= Date.now()) {
      return res.status(400).json({
        success: false,
        message:
          "Verification code has expired. Please request a new code.",
      });
    }
    if (otpRecord.attempts >= CUSTOMER_OTP_MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message:
          "Too many verification attempts. Please request a new code.",
      });
    }
    otpRecord.attempts += 1;
    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");
    if (otpHash !== otpRecord.otpHash) {
      await otpRecord.save();
      return res.status(400).json({
        success: false,
        message: "Verification code is invalid.",
      });
    }
    const setupToken = crypto.randomBytes(32).toString("hex");
    const setupTokenHash = crypto
      .createHash("sha256")
      .update(setupToken)
      .digest("hex");
    otpRecord.verifiedAt = new Date();
    otpRecord.resetTokenHash = setupTokenHash;
    otpRecord.resetTokenExpiresAt = new Date(
      Date.now() + CUSTOMER_RESET_TOKEN_EXPIRY_MS
    );
    await otpRecord.save();
    return res.status(200).json({
      success: true,
      message: "Verification successful.",
      setupToken,
      expiresInSeconds: Math.floor(
        CUSTOMER_RESET_TOKEN_EXPIRY_MS / 1000
      ),
      customer: {
        id: account.customer,
        userId: account.userId,
        isFirstLogin: true,
      },
    });
  } catch (error) {
    console.error("verifyCustomerAccountSetupOtp:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to verify code. Please try again later.",
    });
  }
};
const setCustomerAccountSetupPassword = async (req, res) => {
  try {
    const userId = String(req.body?.userId || "")
      .trim()
      .toUpperCase();
    const setupToken = String(req.body?.setupToken || "").trim();
    const newPassword = String(req.body?.newPassword || "");
    const confirmPassword = String(req.body?.confirmPassword || "");
    if (!userId || !setupToken) {
      return res.status(400).json({
        success: false,
        message: "User ID and setup token are required.",
      });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters.",
      });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match.",
      });
    }
    const account = await CustomerAccount.findOne({
      userId,
      loginEnabled: true,
    });
    if (account && account.isFirstLogin === false) {
      return res.status(409).json({
        success: false,
        alreadyRegistered: true,
        message: "You are already registered. Please log in.",
      });
    }
    if (!account) {
      return res.status(401).json({
        success: false,
        message: "Invalid account setup request.",
      });
    }
    const setupTokenHash = crypto
      .createHash("sha256")
      .update(setupToken)
      .digest("hex");
    const otpRecord = await CustomerOtp.findOne({
      customerAccount: account._id,
      purpose: "ACCOUNT_SETUP",
      verifiedAt: { $ne: null },
      usedAt: null,
      resetTokenHash: setupTokenHash,
    }).sort({ createdAt: -1 });
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired account setup request.",
      });
    }
    if (
      !otpRecord.resetTokenExpiresAt ||
      otpRecord.resetTokenExpiresAt.getTime() <= Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Account setup session has expired. Please verify again.",
      });
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    account.passwordHash = passwordHash;
    account.isFirstLogin = false;
    account.passwordChangedAt = new Date();
    account.failedLoginAttempts = 0;
    account.lockedUntil = null;
    await account.save();
    otpRecord.usedAt = new Date();
    otpRecord.resetTokenHash = null;
    otpRecord.resetTokenExpiresAt = null;
    await otpRecord.save();
    return res.status(200).json({
      success: true,
      message:
        "Password created successfully. Your customer portal account is ready.",
      customer: {
        id: account.customer,
        userId: account.userId,
        isFirstLogin: false,
      },
    });
  } catch (error) {
    console.error("setCustomerAccountSetupPassword:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to create password. Please try again later.",
    });
  }
};module.exports = {
  loginCustomer,
  sendCustomerAccountSetupOtp,
  verifyCustomerAccountSetupOtp,
  setCustomerAccountSetupPassword,
  changeCustomerPassword,
  sendCustomerPasswordResetOtp,
  verifyCustomerPasswordResetOtp,
  resetCustomerPassword,
  sendCustomerUserIdRecoveryOtp,
  verifyCustomerUserIdRecoveryOtp,
};


