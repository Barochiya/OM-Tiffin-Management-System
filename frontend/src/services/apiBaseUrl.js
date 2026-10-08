export const normalizeApiBaseUrl = (value = "http://localhost:5000") => {
  const base = value.trim().replace(/\/+$/, "");
  return base.endsWith("/api") ? base : `${base}/api`;
};

export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_URL || "http://localhost:5000"
);
