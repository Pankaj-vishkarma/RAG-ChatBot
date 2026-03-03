import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.warn("⚠️ VITE_API_BASE_URL is not defined");
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ================= REQUEST INTERCEPTOR ================= */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ================= RESPONSE INTERCEPTOR ================= */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // 🔥 Auto logout if token invalid/expired
    if (status === 401) {
      localStorage.removeItem("token");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    // ❗ IMPORTANT: Return original axios error
    return Promise.reject(error);
  }
);

export default axiosInstance;