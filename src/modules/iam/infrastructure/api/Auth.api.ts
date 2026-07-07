import axios from "axios";
import { API_BASE_URL } from "@/app/config/env";

export const authApi = axios.create({
  baseURL: `${API_BASE_URL}/api/v1/authentication`,
  headers: {
    "Content-Type": "application/json",
  },
});
