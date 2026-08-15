import api from "./api";

// Generate Single Bill
export const generateBill = async (billData) => {
  const token = localStorage.getItem("token");

  const response = await api.post(
    "/bills/generate",
    billData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// Generate Bill + Send WhatsApp (Bulk)
export const generateBillAndSendWhatsApp = async (
  billData
) => {
  const token = localStorage.getItem("token");

  const response = await api.post(
    "/bills/generate",
    billData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// Send Single Bill PDF
export const sendBillWhatsApp = async (
  formData
) => {
  const token = localStorage.getItem("token");

  const response = await api.post(
    "/bills/send-whatsapp",
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type":
          "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const sendAllBillsWhatsApp = async (
  billData
) => {
  const token = localStorage.getItem("token");

  const response = await api.post(
    "/bills/generate-all",
    billData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};