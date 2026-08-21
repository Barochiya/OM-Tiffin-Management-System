import api from "./api";

// =======================================
// Get All WhatsApp Inbox Messages
// =======================================

export const getWhatsAppInbox = async () => {
  const response = await api.get(
    "/whatsapp-inbox"
  );

  return response.data;
};

// =======================================
// Get Unread WhatsApp Messages
// =======================================

export const getUnreadWhatsAppMessages =
  async () => {
    const response = await api.get(
      "/whatsapp-inbox/unread"
    );

    return response.data;
  };