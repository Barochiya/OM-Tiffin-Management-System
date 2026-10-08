import api from "./api";
// Share simultaneous reads only; every completed read expires immediately.
const pendingSettings = new Map();
export const getWebsiteSettings = () => {
  const session = sessionStorage.getItem("token") || "public";
  if (!pendingSettings.has(session)) {
    const request = api.get("/website-settings").then(response => response.data).finally(() => {
      if (pendingSettings.get(session) === request) pendingSettings.delete(session);
    });
    pendingSettings.set(session, request);
  }
  return pendingSettings.get(session);
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
