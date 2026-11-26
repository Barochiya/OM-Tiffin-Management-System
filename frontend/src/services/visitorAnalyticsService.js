import api from "./api";
import { API_BASE_URL } from "./apiBaseUrl";

export const getVisitorDashboard = async (params = {}) => (await api.get("/visitor-analytics/dashboard", { params })).data;
export const getVisitorLogs = async (params = {}) => (await api.get("/visitor-analytics/logs", { params })).data;
export const exportVisitorLogs = async (params = {}) => api.get("/visitor-analytics/export", { params, responseType: "blob" });

const id = (key) => {
  const storage = key === "omVisitorId" ? localStorage : sessionStorage;
  let value = storage.getItem(key);
  if (!value) { value = crypto.randomUUID().replaceAll("-", ""); storage.setItem(key, value); }
  return value;
};

export const recordVisit = (page, entryPage) => {
  if (localStorage.getItem("omAnalyticsConsent") !== "accepted" || navigator.doNotTrack === "1") return;
  const token = sessionStorage.getItem("customerToken");
  const payload = {
    sessionId: id("omAnalyticsSession"), visitorId: id("omVisitorId"), page, entryPage,
    screenResolution: `${screen.width}x${screen.height}`,
    viewportResolution: `${window.innerWidth}x${window.innerHeight}`,
    orientation: window.matchMedia("(orientation: portrait)").matches ? "portrait" : "landscape",
  };
  fetch(`${API_BASE_URL}/visitor-analytics/track`, {
    method: "POST", keepalive: true, credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
  }).catch(() => {});
};
