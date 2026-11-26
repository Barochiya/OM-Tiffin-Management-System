import api from "./api";

// ======================================
// Dashboard Analytics
// ======================================

export const getDashboardAnalytics = async (filters = {}) => {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return (await api.get('/dashboard', { params: filters, timeout: 20000 })).data;
    } catch (error) {
      const transient = ['ERR_NETWORK','ECONNABORTED','ETIMEDOUT'].includes(error.code) || [502,503,504].includes(error.response?.status);
      if (attempt === 0 && transient) continue;
      throw error;
    }
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
export const getFinancialReport = async (filters = {}) => (await api.get("/dashboard/financial-report", { params: filters, timeout: 30000 })).data;

export const downloadFinancialReportPdf = async (filters = {}) => api.get("/dashboard/financial-report/pdf", { params: filters, responseType: "blob", timeout: 60000 });
