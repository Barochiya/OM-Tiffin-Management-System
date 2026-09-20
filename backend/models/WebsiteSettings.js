const mongoose = require("mongoose");
const websiteSettingsSchema = new mongoose.Schema(
    {
        websiteEnabled: {
            type: Boolean,
            default: true,
        },
        plansEnabled: {
            type: Boolean,
            default: true,
        },
        menuEnabled: {
            type: Boolean,
            default: true,
        },
        onlineOrdersEnabled: {
            type: Boolean,
            default: false,
        },
        inquiriesEnabled: {
            type: Boolean,
            default: true,
        },
        customerLoginEnabled: {
            type: Boolean,
            default: true,
        },
        testimonialsEnabled: {
            type: Boolean,
            default: true,
        },
        faqEnabled: {
            type: Boolean,
            default: true,
        },
        contactEnabled: {
            type: Boolean,
            default: true,
        },
        lunchEnabled: {
            type: Boolean,
            default: true,
        },
        dinnerEnabled: {
            type: Boolean,
            default: true,
        },
        notificationEnabled: {
            type: Boolean,
            default: true,
        },
        adminMobile1: {
            type: String,
            default: "",
            trim: true,
        },
        adminMobile2: {
            type: String,
            default: "",
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);
module.exports = mongoose.model("WebsiteSettings", websiteSettingsSchema);
