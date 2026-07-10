import axios from "axios";
import { API_BASE_URL } from "@/app/config/env";

export interface ChatUserResource {
  id: string;
  userId: number;
  nickName: string;
  fullName: string;
  status: "ONLINE" | "OFFLINE";
}

export interface ChatMessageResource {
  id: string;
  chatId: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp?: string | null;
}

export interface ChatNotificationResource {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
}

export interface ChatValidateResource {
  canChat: boolean;
}

export interface ChatUserExistsResource {
  exists: boolean;
}

export const chatApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
});

chatApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

