const templates = require(
  "../config/whatsappTemplates"
);

const buildAnnouncementTemplate = (
  templateType,
  customer,
  data = {}
) => {
  const customerName =
    customer?.customerName ||
    customer?.name ||
    "Customer";

  switch (templateType) {
    // =========================================
    // HOLIDAY NOTICE
    // Meta: om_tiffin_holiday_notice
    //
    // {{1}} = Customer Name
    // {{2}} = Holiday Date
    // {{3}} = Reason
    // {{4}} = Resume Date
    // =========================================
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

          data.reason ||
            "a scheduled holiday",

          data.resumeDate ||
            "the next working day",
        ],
      };

    // =========================================
    // FESTIVAL WISHES
    // Meta: om_tiffin_festival_wishes
    //
    // {{1}} = Customer Name
    // {{2}} = Festival Name
    // =========================================
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

    // =========================================
    // DELIVERY DELAY
    // Meta: om_tiffin_delivery_delay
    //
    // {{1}} = Customer Name
    // {{2}} = Delay Reason
    // {{3}} = Expected Delivery Time
    // =========================================
    case "delay":
      return {
        template:
          templates.DELIVERY_DELAY.name,

        language:
          templates.DELIVERY_DELAY.language,

        variables: [
          customerName,

          data.delayReason ||
            "an unexpected reason",

          data.expectedTime ||
            "later today",
        ],
      };

    // =========================================
    // TODAY'S MENU
    // Meta: om_tiffin_todays_menu
    //
    // {{1}} = Customer Name
    // {{2}} = Breakfast
    // {{3}} = Lunch
    // {{4}} = Dinner
    // =========================================
    case "menu":
      return {
        template:
          templates.TODAY_MENU.name,

        language:
          templates.TODAY_MENU.language,

        variables: [
          customerName,

          data.breakfast ||
            "Not available",

          data.lunch ||
            "Not available",

          data.dinner ||
            "Not available",
        ],
      };

    // =========================================
    // GENERAL ANNOUNCEMENT
    // Meta: om_tiffin_general_announcement
    //
    // {{1}} = Customer Name
    // {{2}} = Announcement Message
    // =========================================
    // =========================================
    // SERVICE UPDATE
    // Meta: om_tiffin_service_update
    //
    // {{1}} = Customer Name
    // {{2}} = Service Update Message
    // =========================================
    case "service":
      return {
        template: templates.SERVICE_UPDATE.name,
        language: templates.SERVICE_UPDATE.language,
        variables: [
          customerName,
          String(data.message || "")
            .replace(/[\r\n\t]+/g, " ")
            .replace(/ {5,}/g, " ")
            .trim(),
        ],
      };
    case "custom":
    case "general":
      return {
        template:
          templates.GENERAL_ANNOUNCEMENT.name,

        language:
          templates.GENERAL_ANNOUNCEMENT.language,

        variables: [
          customerName,

          data.message || "",
        ],
      };

    // =========================================
    // INVALID TEMPLATE TYPE
    // =========================================
    default:
      return null;
  }
};

module.exports =
  buildAnnouncementTemplate;
