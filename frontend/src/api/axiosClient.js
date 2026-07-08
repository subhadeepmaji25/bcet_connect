import axios from "axios";
import toast from "react-hot-toast";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:2222/api/v1",
  timeout: 15000,
});

// ── Request interceptor: attach Bearer token ──────────────────────────────
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: unwrap data, handle 401 ─────────────────────────
axiosClient.interceptors.response.use(
  (response) => response.data, // always { success, message, data, meta, timestamp }
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || "Something went wrong";

    if (status === 401) {
      // Dispatch a custom event to let AuthContext handle logout cleanly
      window.dispatchEvent(new CustomEvent('SESSION_EXPIRED'));
      toast.error("Session expired. Please log in again.", { id: "session_expired" });
    } else if (status === 403) {
      toast.error(message || "Access Denied: Insufficient permissions");
    } else if (status === 400 || status === 409 || status >= 500) {
      // Avoid spamming global toasts if the request was cancelled or it's a specific validation error
      // But generally it's safe to show a toast for 400/409 as per contract
      if (!error.config?.url?.includes('/users/profile')) {
         toast.error(message);
      }
    }
    
    // Reject with standardized backend error shape
    return Promise.reject(error.response?.data || {
      success: false,
      message: error.message || "Something went wrong",
    });
  }
);

export default axiosClient;
