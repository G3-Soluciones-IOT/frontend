import axios from "axios";
import { API_BASE_URL } from "@/app/config/env";

export const nutritionistApi = axios.create({
  baseURL: `${API_BASE_URL}/api/v1/nutritionists`,
  timeout: 10_000,
});

nutritionistApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
