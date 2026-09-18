const TiffinModificationSettings = require("../models/TiffinModificationSettings");
const getModificationSettings = async (req, res) => {
  try {
    let settings = await TiffinModificationSettings.findOne().lean();
    if (!settings) {
      settings = await TiffinModificationSettings.create({});
      settings = settings.toObject();
    }
    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("getModificationSettings:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load modification settings.",
    });
  }
};
const updateModificationSettings = async (req, res) => {
  try {
    const {
      adminWhatsAppNumber1 = "",
      adminWhatsAppNumber2 = "",
      lunchCutoffTime = "10:30",
      dinnerCutoffTime = "17:00",
      skipTiffinEnabled = true,
      extraTiffinEnabled = true,
      mealModificationEnabled = true,
      otherRequestEnabled = true,
    } = req.body;
    const normalizePhone = (value) => {
      const phone = String(value || "").trim();
      if (!phone) return "";
      return phone.replace(/\s+/g, "");
    };
    const number1 = normalizePhone(adminWhatsAppNumber1);
    const number2 = normalizePhone(adminWhatsAppNumber2);
    const phoneRegex = /^(?:\+91)?[6-9]\d{9}$/;
    const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
    if (number1 && !phoneRegex.test(number1)) {
      return res.status(400).json({
        success: false,
        message:
          "Admin WhatsApp Number 1 must be a valid Indian mobile number.",
      });
    }
    if (number2 && !phoneRegex.test(number2)) {
      return res.status(400).json({
        success: false,
        message:
          "Admin WhatsApp Number 2 must be a valid Indian mobile number.",
      });
    }
    if (!timeRegex.test(String(lunchCutoffTime))) {
      return res.status(400).json({
        success: false,
        message: "Invalid lunch cutoff time.",
      });
    }
    if (!timeRegex.test(String(dinnerCutoffTime))) {
      return res.status(400).json({
        success: false,
        message: "Invalid dinner cutoff time.",
      });
    }
    let settings = await TiffinModificationSettings.findOne();
    if (!settings) {
      settings = new TiffinModificationSettings();
    }
    settings.adminWhatsAppNumber1 = number1;
    settings.adminWhatsAppNumber2 = number2;
    settings.lunchCutoffTime = String(lunchCutoffTime);
    settings.dinnerCutoffTime = String(dinnerCutoffTime);
    settings.skipTiffinEnabled = Boolean(skipTiffinEnabled);
    settings.extraTiffinEnabled = Boolean(extraTiffinEnabled);
    settings.mealModificationEnabled = Boolean(mealModificationEnabled);
    settings.otherRequestEnabled = Boolean(otherRequestEnabled);
    await settings.save();
    return res.status(200).json({
      success: true,
      message: "Modification settings updated successfully.",
      data: settings,
    });
  } catch (error) {
    console.error("updateModificationSettings:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update modification settings.",
    });
  }
};
module.exports = {
  getModificationSettings,
  updateModificationSettings,
};
