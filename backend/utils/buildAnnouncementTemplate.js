const templates = require(
  "../config/whatsappTemplates"
);

const buildAnnouncementTemplate = (
  templateType,
  customer,
  data = {}
) => {
  const customerName =
    customer.customerName ||
    customer.name ||
    "Customer";

  switch (templateType) {
    case "holiday":
      return {
        template:
          templates.HOLIDAY.name,

        language:
          templates.HOLIDAY.language,

        variables: [
          customerName,
          data.holidayDate ||
            "Tomorrow",
        ],
      };

    case "festival":
      return {
        template:
          templates.FESTIVAL.name,

        language:
          templates.FESTIVAL.language,

        variables: [
          customerName,
          data.festivalName ||
            "Festival",
        ],
      };

    case "delay":
      return {
        template:
          templates.DELIVERY_DELAY
            .name,

        language:
          templates.DELIVERY_DELAY
            .language,

        variables: [
          customerName,
          data.delayTime ||
            "30 Minutes",
        ],
      };

    case "payment":
      return {
        template:
          templates.PAYMENT_REMINDER
            .name,

        language:
          templates.PAYMENT_REMINDER
            .language,

        variables: [
          customerName,
          data.pendingAmount || 0,
          data.dueDate || "",
        ],
      };

    case "menu":
      return {
        template:
          templates.TODAY_MENU.name,

        language:
          templates.TODAY_MENU.language,

        variables: [
          customerName,
          data.menu || "",
        ],
      };

    case "general":
      return {
        template:
          templates.GENERAL_NOTICE
            .name,

        language:
          templates.GENERAL_NOTICE
            .language,

        variables: [
          customerName,
          data.message || "",
        ],
      };

    default:
      return null;
  }
};

module.exports =
  buildAnnouncementTemplate;