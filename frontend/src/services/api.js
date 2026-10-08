import axios from "axios";
import { API_BASE_URL } from "./apiBaseUrl";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// ==============================
// Request Interceptor
// ==============================

api.interceptors.request.use(
  (config) => {
    const token =
      sessionStorage.getItem("token");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==============================
// Response Interceptor
// ==============================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const currentToken = sessionStorage.getItem("token");
    const requestAuthorization = error.config?.headers?.get?.("Authorization") || error.config?.headers?.Authorization;
    // An older in-flight request must not clear a newly authenticated session.
    if (
      error.response?.status === 401 &&
      currentToken &&
      requestAuthorization === `Bearer ${currentToken}` &&
      error.config?.url !== "/admin/login"
    ) {
      sessionStorage.removeItem("token");

      window.location.href =
        "/login";
    }

    return Promise.reject(error);
  }
);

export default api;


