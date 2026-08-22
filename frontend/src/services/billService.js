import api from "./api";

// Generate Single Bill
export const generateBill = async (billData) => {
  const token = sessionStorage.getItem("token");

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
  const token = sessionStorage.getItem("token");

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
  const token = sessionStorage.getItem("token");

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
  const token = sessionStorage.getItem("token");

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

// Get Bill Delivery Status

export const getBillDeliveryStatus = async () => {
  const token = sessionStorage.getItem("token");

  const response = await api.get(
    "/bills/delivery-status",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const retryBill = async (billId) => {
  const token = sessionStorage.getItem("token");

  const response = await api.post(
    `/bills/retry/${billId}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

// Get All Bills

export const getAllBills = async () => {
  const token = sessionStorage.getItem("token");

  const response = await api.get("/bills", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const getBillById = async (id) => {
  const token = sessionStorage.getItem("token");

  const response = await api.get(`/bills/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
