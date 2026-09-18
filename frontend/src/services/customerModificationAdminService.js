import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const adminModificationApi = axios.create({
  baseURL: `${API_URL}/api`,
});
adminModificationApi.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
export const getModificationRequests = async () => {
  const response = await adminModificationApi.get(
    "/customer-modification-admin/requests"
  );
  return response.data;
};
export const getModificationRequestById = async (id) => {
  const response = await adminModificationApi.get(
    `/customer-modification-admin/requests/${id}`
  );
  return response.data;
};
export const updateModificationRequestStatus = async (
  id,
  status,
  adminRemark = ""
) => {
  const response = await adminModificationApi.patch(
    `/customer-modification-admin/requests/${id}/status`,
    {
      status,
      adminRemark,
    }
  );
  return response.data;
};
export default adminModificationApi;
