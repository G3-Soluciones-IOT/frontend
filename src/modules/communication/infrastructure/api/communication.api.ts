import axios from "axios";
import { API_BASE_URL } from "@/app/config/env";

export const communicationApi = axios.create({
  baseURL: `${API_BASE_URL}/communication`,
  timeout: 10_000,
});

communicationApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
