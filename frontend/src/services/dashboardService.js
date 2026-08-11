import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ======================================
// Dashboard Analytics
// ======================================

export const getDashboardAnalytics = async () => {
  try {
    const response = await api.get("/api/dashboard");

    return response.data;
  } catch (error) {
    console.error("Dashboard Analytics Error:", error);

    throw error;
  }
};

// ======================================
// Recent Payments
// ======================================

export const getRecentPayments = async () => {
  try {
    const response = await api.get("/api/payments");

    return response.data;
  } catch (error) {
    console.error("Recent Payments Error:", error);

    throw error;
  }
};

// ======================================
// Dashboard Health Check
// ======================================

export const checkDashboardServer = async () => {
  try {
    const response = await api.get("/");

    return response.data;
  } catch (error) {
    console.error("Dashboard Server Error:", error);

    throw error;
  }
};

export default api;
