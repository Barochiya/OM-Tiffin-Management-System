import api from "./api";

// ===================================
// Dashboard Analytics
// ===================================

export const getDashboardAnalytics = async () => {
  const res = await api.get("/dashboard");

  return res.data;
};