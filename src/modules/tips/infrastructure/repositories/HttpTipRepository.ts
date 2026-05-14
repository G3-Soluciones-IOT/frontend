import type { TipRepository } from "../../domain/repositories/TipRepository";
import type { Tip, TipResource } from "../../domain/models/Tip";
import type { ListTipsInput } from "../../application/dto/ListTipsInput";
import type { CreateTipInput } from "../../application/dto/CreateTipInput";
import type { UpdateTipInput } from "../../application/dto/UpdateTipInput";
import { tipsApi } from "../api/tips.api";

export class HttpTipRepository implements TipRepository {
  async list(input?: ListTipsInput): Promise<Tip[]> {
    const response = await tipsApi.listTips(input);
    return response.data;
  }

  async getById(id: number): Promise<Tip> {
    const response = await tipsApi.getTipById(id);
    return response.data;
  }

  async create(input: CreateTipInput): Promise<Tip> {
    const response = await tipsApi.createTip(input);
    return response.data;
  }

  async update(id: number, input: UpdateTipInput): Promise<Tip> {
    const response = await tipsApi.updateTip(id, input);
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await tipsApi.deleteTip(id);
  }

  async listResources(): Promise<TipResource[]> {
    const response = await tipsApi.listResources();
    return response.data;
  }

  async getResourceById(id: number): Promise<TipResource> {
    const response = await tipsApi.getResourceById(id);
    return response.data;
  }
}

