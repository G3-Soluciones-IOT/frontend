import axios from "axios";

const BASE_URL =
    import.meta.env.VITE_API_BASE_URL ??
    "http://localhost:8080";

export const authApi = axios.create({
  baseURL: `${BASE_URL}/api/v1/authentication`,
  headers: {
    "Content-Type": "application/json",
  },
});