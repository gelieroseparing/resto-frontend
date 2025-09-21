import axios from "axios";

// ✅ Detect API base URL
const baseURL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:5000/api"
    : "https://resto-backend-0wwz.onrender.com/api");

const API = axios.create({
  baseURL,
});

// ===== Auth APIs =====
export const signup = (userData) => API.post("/auth/signup", userData);
export const login = (userData) => API.post("/auth/login", userData);

// ===== User APIs =====
export const getProfile = (token) =>
  API.get("/users/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });

// ===== Order APIs =====
export const createOrder = (orderData, token) =>
  API.post("/orders", orderData, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getOrders = (token) =>
  API.get("/orders", {
    headers: { Authorization: `Bearer ${token}` },
  });

export default API;
