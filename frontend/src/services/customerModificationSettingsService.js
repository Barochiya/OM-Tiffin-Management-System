import axios from "axios";
import { API_BASE_URL } from "./apiBaseUrl";
const modificationSettingsApi = axios.create({
  baseURL: API_BASE_URL,
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
