// src/services/apiClient.js
import axios from "axios";

/**
 * Base Axios instance
 * Change BASE_URL when switching between:
 * - Local backend
 * - Cloud API
 * - Google Sheets API proxy
 */
const apiClient = axios.create({
  baseURL: "https://your-api-base-url.com", // 👈 change this
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* -------------------- REQUEST INTERCEPTOR -------------------- */
apiClient.interceptors.request.use(
  async (config: any) => {
    // Example: attach token later if needed
    // const token = await AsyncStorage.getItem("token");
    // if (token) config.headers.Authorization = `Bearer ${token}`;

    return config;
  },
  (error: any) => Promise.reject(error)
);

/* -------------------- RESPONSE INTERCEPTOR -------------------- */
apiClient.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    // Centralized error handling
    if (error.response) {
      console.log("API Error:", error.response.status);
      console.log(error.response.data);
    } else if (error.request) {
      console.log("No response from server");
    } else {
      console.log("Request error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
