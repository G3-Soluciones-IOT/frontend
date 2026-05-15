import axios from "axios";
import type { Tip, TipResource } from "../../domain/models/Tip";
import type { ListTipsInput } from "../../application/dto/ListTipsInput";
import type { CreateTipInput } from "../../application/dto/CreateTipInput";
import type { UpdateTipInput } from "../../application/dto/UpdateTipInput";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export const tipsApi = {
  listTips: (input?: ListTipsInput) =>
    axios.get<Tip[]>(`${baseURL}/tips`, { params: input }),

  getTipById: (id: number) =>
    axios.get<Tip>(`${baseURL}/tips/${id}`),

  createTip: (input: CreateTipInput) =>
    axios.post<Tip>(`${baseURL}/tips`, input),

  updateTip: (id: number, input: UpdateTipInput) =>
    axios.put<Tip>(`${baseURL}/tips/${id}`, input),

  deleteTip: (id: number) =>
    axios.delete(`${baseURL}/tips/${id}`),

  listResources: () =>
    axios.get<TipResource[]>(`${baseURL}/tips/resources`),

  getResourceById: (id: number) =>
    axios.get<TipResource>(`${baseURL}/tips/resources/${id}`),
};

