import api from "./api";
export const createWebsiteOrder = async (orderData) => {
  const response = await api.post("/website-orders/public", orderData);
  return response.data;
};
export const getPublicOrderStatus = async (mobileNumber) => {
  const response = await api.get("/website-orders/public/status", {
    params: { mobileNumber },
  });
  return response.data;
};
export default {
  createWebsiteOrder,
  getPublicOrderStatus,
};
