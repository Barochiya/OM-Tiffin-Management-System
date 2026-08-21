import api from "./api";

// ===============================
// Add Payment
// ===============================
export const addPayment = async (paymentData) => {
  const token = localStorage.getItem("token");

  const response = await api.post(
    "/payments",
    paymentData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// ===============================
// Get All Payments
// ===============================
export const getPayments = async () => {
  const token = localStorage.getItem("token");

  const response = await api.get(
    "/payments",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// ===============================
// Get Bills By Customer
// ===============================
export const getBillsByCustomer = async (customerId) => {
  const token = localStorage.getItem("token");

  const response = await api.get(
    `/payments/customer/${customerId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// ===============================
// Get Pending Bills
// ===============================
export const getPendingBills = async (customerId) => {
  const token = localStorage.getItem("token");

  const response = await api.get(
    `/payments/pending/${customerId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// ===============================
// Get Single Payment
// ===============================
export const getPaymentById = async (id) => {
  const token = localStorage.getItem("token");

  const response = await api.get(
    `/payments/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// ===============================
// Send Payment Receipt PDF via WhatsApp
// ===============================
export const sendPaymentReceiptWhatsApp = async (
  paymentId,
  pdfBlob
) => {
  const token = localStorage.getItem("token");

  const response = await api.post(
    "/payments/send-whatsapp",
    pdfBlob,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/pdf",
        "X-Payment-Id": paymentId,
      },
    }
  );

  return response.data;
};

// =======================================
// Approve WhatsApp Payment
// =======================================

export const approveWhatsAppPayment = async (
  paymentData
) => {
  const token =
    localStorage.getItem("token");

  const response = await api.post(
    "/payments/approve-whatsapp-payment",
    paymentData,
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  return response.data;
};