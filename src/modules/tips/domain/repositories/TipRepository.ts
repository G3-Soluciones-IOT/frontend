import type { Tip, TipResource } from "../models/Tip";
import type { ListTipsInput } from "../../application/dto/ListTipsInput";
import type { CreateTipInput } from "../../application/dto/CreateTipInput";
import type { UpdateTipInput } from "../../application/dto/UpdateTipInput";

export interface TipRepository {
  list(input?: ListTipsInput): Promise<Tip[]>;
  getById(id: number): Promise<Tip>;
  create(input: CreateTipInput): Promise<Tip>;
  update(id: number, input: UpdateTipInput): Promise<Tip>;
  delete(id: number): Promise<void>;
  listResources(): Promise<TipResource[]>;
  getResourceById(id: number): Promise<TipResource>;
}

