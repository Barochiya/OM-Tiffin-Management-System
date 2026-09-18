import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL || "";
const modificationSettingsApi = axios.create({
  baseURL: `${API_URL}/api`,
});
modificationSettingsApi.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
export const getModificationSettings = async () => {
  const response = await modificationSettingsApi.get(
    "/customer-modification-admin/settings"
  );
  return response.data;
};
export const updateModificationSettings = async (settings) => {
  const response = await modificationSettingsApi.put(
    "/customer-modification-admin/settings",
    settings
  );
  return response.data;
};
export default modificationSettingsApi;
