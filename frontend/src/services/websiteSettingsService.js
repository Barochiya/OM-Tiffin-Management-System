import api from "./api";
export const getWebsiteSettings = async () => {
  const response = await api.get("/website-settings");
  return response.data;
};
export const updateWebsiteSettings = async (settings) => {
  const response = await api.put(
    "/website-settings",
    settings
  );
  return response.data;
};
export default {
  getWebsiteSettings,
  updateWebsiteSettings,
};
