import api from "./api";
export const getLoginIdRecipients = async () => {
  const response = await api.get(
    "/customer-accounts/login-id-recipients"
  );
  return response.data;
};
export const sendLoginIdsWhatsApp = async (customerIds) => {
  const response = await api.post(
    "/customer-accounts/send-login-ids",
    {
      customerIds,
    }
  );
  return response.data;
};
export const getLoginIdDeliveryStatus = async () => {
  const response = await api.get(
    "/customer-accounts/login-id-delivery-status"
  );
  return response.data;
};
export default {
  getLoginIdRecipients,
  sendLoginIdsWhatsApp,
  getLoginIdDeliveryStatus,
};
