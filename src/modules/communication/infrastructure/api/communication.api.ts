import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export const communicationApi = axios.create({
  baseURL: `${BASE_URL}/communication`,
  timeout: 10_000,
});

communicationApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
