import axios from "axios";
import { useAuthStore } from "../store/auth.store";

// Đảm bảo có từ khóa export ở đây
export const api = axios.create({
  baseURL: "http://localhost:8000/api"
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});