import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

export const nutritionistApi = axios.create({
  baseURL: `${BASE_URL}/api/v1/nutritionists`,
  timeout: 10_000,
});

nutritionistApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
