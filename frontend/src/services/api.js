import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";
const NORMALIZED_API_URL = API_URL.replace(/\/+$/, "");
const api = axios.create({
  baseURL: NORMALIZED_API_URL.endsWith("/api")
    ? NORMALIZED_API_URL
    : `${NORMALIZED_API_URL}/api`,
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
    if (error.response?.status === 401) {
      sessionStorage.removeItem("token");

      window.location.href =
        "/login";
    }

    return Promise.reject(error);
  }
);

export default api;


