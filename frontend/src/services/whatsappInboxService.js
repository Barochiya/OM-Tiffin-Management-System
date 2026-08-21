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
  // =======================================
// Mark WhatsApp Message as Read
// =======================================

export const markWhatsAppMessageRead = async (id) => {
  const response = await api.put(
    `/whatsapp-inbox/${id}/read`
  );

  return response.data;
};

// =======================================
// Delete WhatsApp Message
// =======================================

export const deleteWhatsAppMessage = async (id) => {
  const response = await api.delete(
    `/whatsapp-inbox/${id}`
  );

  return response.data;
};