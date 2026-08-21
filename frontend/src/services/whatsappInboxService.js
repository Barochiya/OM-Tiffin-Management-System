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

// =======================================
// Get WhatsApp Media
// =======================================

export const getWhatsAppMedia = async (id) => {
  const response = await api.get(
    `/whatsapp-inbox/media/${id}`,
    {
      responseType: "blob",
    }
  );

  return response.data;
};

// =======================================
// Reply to WhatsApp Message
// =======================================

export const replyToWhatsAppMessage = async (
  id,
  message
) => {
  const response = await api.post(
    `/whatsapp-inbox/${id}/reply`,
    {
      message,
    }
  );

  return response.data;
};