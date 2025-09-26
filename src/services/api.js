import axios from "axios";

// Detect API base URL
const baseURL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://resto-backend-0wwz.onrender.com/api");

const API = axios.create({ baseURL });

// Attach token automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Export your API calls
export const signup = (userData) => API.post("/auth/signup", userData);
export const login = (userData) => API.post("/auth/login", userData);
export const getProfile = () => API.get("/users/profile");
export const createOrder = (orderData) => API.post("/orders", orderData);
export const getOrders = () => API.get("/orders");

export default API;