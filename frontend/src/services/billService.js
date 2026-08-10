import api from "./api";

// Generate Monthly Bill
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

// Send a generated PDF bill through the backend WhatsApp Cloud API.
export const sendBillWhatsApp = async (billId, pdfBlob) => {
  const token = localStorage.getItem("token");

  const response = await api.post(
    "/bills/send-whatsapp",
    pdfBlob,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/pdf",
        "X-Bill-ID": billId,
      },
    }
  );

  return response.data;
};
