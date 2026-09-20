const WebsiteSettings = require("../models/WebsiteSettings");
const getWebsiteSettings = async (req, res) => {
    try {
        let settings = await WebsiteSettings.findOne();
        if (!settings) {
            settings = await WebsiteSettings.create({});
        }
        res.status(200).json({
            success: true,
            data: settings,
        });
    } catch (error) {
        console.error("Get Website Settings Error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
const updateWebsiteSettings = async (req, res) => {
    try {
        const allowedFields = [
            "websiteEnabled",
            "plansEnabled",
            "menuEnabled",
            "onlineOrdersEnabled",
            "inquiriesEnabled",
            "customerLoginEnabled",
            "testimonialsEnabled",
            "faqEnabled",
            "contactEnabled",
            "lunchEnabled",
            "dinnerEnabled",
            "notificationEnabled",
            "adminMobile1",
            "adminMobile2",
        ];
        const updates = {};
        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });
        let settings = await WebsiteSettings.findOne();
        if (!settings) {
            settings = await WebsiteSettings.create(updates);
        } else {
            Object.assign(settings, updates);
            await settings.save();
        }
        res.status(200).json({
            success: true,
            message: "Website settings updated successfully",
            data: settings,
        });
    } catch (error) {
        console.error("Update Website Settings Error:", error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
module.exports = {
    getWebsiteSettings,
    updateWebsiteSettings,
};
