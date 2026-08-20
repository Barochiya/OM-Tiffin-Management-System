import api from "./api";

// =====================================================
// Send Bulk Payment Reminders
// =====================================================

export const sendBulkPaymentReminders = async () => {
  const token = localStorage.getItem("token");

  const response = await api.post(
    "/payment-reminders/send-bulk",
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};