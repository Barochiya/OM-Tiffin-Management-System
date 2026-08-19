import api from "./api";

// ======================================
// Dashboard Analytics
// ======================================

export const getDashboardAnalytics =
  async () => {
    try {
      const response = await api.get(
        "/dashboard"
      );

      return response.data;
    } catch (error) {
      console.error(
        "Dashboard Analytics Error:",
        error
      );

      throw error;
    }
  };

// ======================================
// Recent Payments
// ======================================

export const getRecentPayments =
  async () => {
    try {
      const response = await api.get(
        "/payments"
      );

      return response.data;
    } catch (error) {
      console.error(
        "Recent Payments Error:",
        error
      );

      throw error;
    }
  };

// ======================================
// Dashboard Health Check
// ======================================

export const checkDashboardServer =
  async () => {
    try {
      const response = await api.get(
        "/"
      );

      return response.data;
    } catch (error) {
      console.error(
        "Dashboard Server Error:",
        error
      );

      throw error;
    }
  };