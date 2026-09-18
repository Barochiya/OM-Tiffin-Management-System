import axios from "axios";
const customerModificationApi = axios.create({
  baseURL: `${(import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "")}/api`,
});
customerModificationApi.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("customerToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
export const createModificationRequest = async (requestData) => {
  const response = await customerModificationApi.post(
    "/customer-portal/modification-requests",
    requestData
  );
  return response.data;
};
export const getCustomerModificationRequests = async () => {
  const response = await customerModificationApi.get(
    "/customer-portal/modification-requests"
  );
  return response.data;
};
export default customerModificationApi;
