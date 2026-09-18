const TiffinModificationSettings = require("../models/TiffinModificationSettings");
const CustomerModificationRequest = require("../models/CustomerModificationRequest");
const CustomerModificationWhatsAppAction = require("../models/CustomerModificationWhatsAppAction");
const {
  sendWhatsAppTemplate,
  normalizeIndianPhone,
} = require("./whatsappSender");
const WHATSAPP_TEMPLATES = require("../config/whatsappTemplates");
const REQUEST_TYPE_LABELS = {
  SKIP_TIFFIN: "Skip Tiffin",
  EXTRA_TIFFIN: "Extra Tiffin",
  MEAL_MODIFICATION: "Meal Modification",
  OTHER: "Other",
};
const MEAL_LABELS = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  BOTH: "Lunch + Dinner",
  ALL: "All Meals",
};
const formatRequestDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-GB", {
        timeZone: "Asia/Kolkata",
      })
    : "N/A";
const getAdminWhatsAppNumbers = (settings) =>
  [
    settings?.adminWhatsAppNumber1,
    settings?.adminWhatsAppNumber2,
  ]
    .map(normalizeIndianPhone)
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index);
const getRequestDetails = async (requestId) => {
  const request = await CustomerModificationRequest.findById(requestId)
    .populate(
      "customer",
      "customerName phone address barcode"
    )
    .lean();
  if (!request) {
    throw new Error("Modification request not found.");
  }
  return request;
};
const sendCustomerModificationApprovalNotification = async (
  requestId
) => {
  const request = await getRequestDetails(requestId);
  const settings =
    (await TiffinModificationSettings.findOne().lean()) || {};
  const adminNumbers = getAdminWhatsAppNumbers(settings);
  if (adminNumbers.length === 0) {
    return {
      sent: false,
      reason: "NO_ADMIN_WHATSAPP_NUMBER_CONFIGURED",
      recipients: [],
    };
  }
  const template = WHATSAPP_TEMPLATES.MODIFICATION_APPROVAL;
  if (!template?.name) {
    throw new Error(
      "Modification approval WhatsApp template is not configured."
    );
  }
  const customerName =
    request.customer?.customerName || "Customer";
  const mobile =
    request.customer?.phone || "N/A";
  const address =
    request.customer?.address || "N/A";
  const requestDate =
    formatRequestDate(request.requestDate);
  const requestType =
    REQUEST_TYPE_LABELS[request.requestType] ||
    request.requestType ||
    "N/A";
  const meal =
    MEAL_LABELS[request.meal] ||
    request.meal ||
    "N/A";
  const description =
    request.description || "No description";
  const results = [];
  for (const adminNumber of adminNumbers) {
    try {
      const response = await sendWhatsAppTemplate({
        to: adminNumber,
        templateName: template.name,
        languageCode: template.language,
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: customerName,
              },
              {
                type: "text",
                text: mobile,
              },
              {
                type: "text",
                text: address,
              },
              {
                type: "text",
                text: requestDate,
              },
              {
                type: "text",
                text: requestType,
              },
              {
                type: "text",
                text: meal,
              },
              {
                type: "text",
                text: description,
              },
            ],
          },
        ],
      });
      const sentMessageId =
        response?.messages?.[0]?.id || null;

      if (sentMessageId) {
        await CustomerModificationWhatsAppAction.create({
          request: request._id,
          whatsappMessageId: sentMessageId,
          adminPhone: adminNumber,
          action: "APPROVE",
          status: "PENDING",
        });

        console.log(
          "Customer modification WhatsApp approval mapping saved:",
          {
            requestId: request._id,
            whatsappMessageId: sentMessageId,
            adminPhone: adminNumber,
          }
        );
      }
      results.push({
        recipient: adminNumber,
        sent: true,
        messageId:
          response?.messages?.[0]?.id || null,
      });
    } catch (error) {
      console.error(
        "Modification approval WhatsApp send failed:",
        {
          recipient: adminNumber,
          error: error.message,
        }
      );
      results.push({
        recipient: adminNumber,
        sent: false,
        error: error.message,
      });
    }
  }
  return {
    sent: results.some((item) => item.sent),
    recipients: adminNumbers,
    results,
  };
};
const sendCustomerModificationApprovedNotification = async (
  requestId
) => {
  const request = await getRequestDetails(requestId);
  const customerPhone =
    normalizeIndianPhone(request.customer?.phone);
  if (!customerPhone) {
    return {
      sent: false,
      reason: "CUSTOMER_PHONE_NOT_AVAILABLE",
    };
  }
  const template =
    WHATSAPP_TEMPLATES.MODIFICATION_APPROVED;
  if (!template?.name) {
    throw new Error(
      "Customer modification approved WhatsApp template is not configured."
    );
  }
  const response = await sendWhatsAppTemplate({
    to: customerPhone,
    templateName: template.name,
    languageCode: template.language,
    components: [
      {
        type: "body",
        parameters: [
          {
            type: "text",
            text: formatRequestDate(request.requestDate),
          },
          {
            type: "text",
            text:
              REQUEST_TYPE_LABELS[request.requestType] ||
              request.requestType ||
              "N/A",
          },
          {
            type: "text",
            text:
              MEAL_LABELS[request.meal] ||
              request.meal ||
              "N/A",
          },
        ],
      },
    ],
  });
  return {
    sent: true,
    recipient: customerPhone,
    messageId:
      response?.messages?.[0]?.id || null,
  };
};
module.exports = {
  sendCustomerModificationApprovalNotification,
  sendCustomerModificationApprovedNotification,
};
