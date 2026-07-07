import axios from "axios";
import { API_BASE_URL } from "@/app/config/env";

export const paymentsApi = axios.create({
  baseURL: `${API_BASE_URL}/payments`,
  timeout: 10_000,
});

paymentsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
