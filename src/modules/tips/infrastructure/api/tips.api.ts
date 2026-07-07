import axios from "axios";
import type { Tip, TipResource } from "../../domain/models/Tip";
import type { ListTipsInput } from "../../application/dto/ListTipsInput";
import type { CreateTipInput } from "../../application/dto/CreateTipInput";
import type { UpdateTipInput } from "../../application/dto/UpdateTipInput";
import { API_BASE_URL } from "@/app/config/env";

export const tipsApi = {
  listTips: (input?: ListTipsInput) =>
    axios.get<Tip[]>(`${API_BASE_URL}/tips`, { params: input }),

  getTipById: (id: number) =>
    axios.get<Tip>(`${API_BASE_URL}/tips/${id}`),

  createTip: (input: CreateTipInput) =>
    axios.post<Tip>(`${API_BASE_URL}/tips`, input),

  updateTip: (id: number, input: UpdateTipInput) =>
    axios.put<Tip>(`${API_BASE_URL}/tips/${id}`, input),

  deleteTip: (id: number) =>
    axios.delete(`${API_BASE_URL}/tips/${id}`),

  listResources: () =>
    axios.get<TipResource[]>(`${API_BASE_URL}/tips/resources`),

  getResourceById: (id: number) =>
    axios.get<TipResource>(`${API_BASE_URL}/tips/resources/${id}`),
};

