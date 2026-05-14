import type { CreateSubscriptionPlanInput } from "../../application/dto/CreateSubscriptionPlanInput";
import type { ListSubscriptionPlansInput } from "../../application/dto/ListSubscriptionPlansInput";
import type { UpdateSubscriptionPlanInput } from "../../application/dto/UpdateSubscriptionPlanInput";
import type { SubscriptionPlan } from "../../domain/models/SubscriptionPlan";
import type { SubscriptionPlanRepository } from "../../domain/repositories/SubscriptionPlanRepository";
import { paymentsApi } from "../api/payments.api";

function buildListParams(input?: ListSubscriptionPlansInput) {
  if (!input) return undefined;

  return {
    ...(input.search ? { search: input.search } : {}),
    ...(input.active !== undefined ? { active: input.active } : {}),
    ...(input.isPopular !== undefined ? { isPopular: input.isPopular } : {}),
    ...(input.billingPeriod ? { billingPeriod: input.billingPeriod } : {}),
  };
}

export class HttpSubscriptionPlanRepository implements SubscriptionPlanRepository {
  async list(input?: ListSubscriptionPlansInput): Promise<SubscriptionPlan[]> {
    const { data } = await paymentsApi.get<SubscriptionPlan[]>("/subscription-plans", {
      params: buildListParams(input),
    });
    return data;
  }

  async getById(id: number): Promise<SubscriptionPlan> {
    const { data } = await paymentsApi.get<SubscriptionPlan>(`/subscription-plans/${id}`);
    return data;
  }

  async create(input: CreateSubscriptionPlanInput): Promise<SubscriptionPlan> {
    const { data } = await paymentsApi.post<SubscriptionPlan>("/subscription-plans", input);
    return data;
  }

  async update(id: number, input: UpdateSubscriptionPlanInput): Promise<SubscriptionPlan> {
    const { data } = await paymentsApi.put<SubscriptionPlan>(`/subscription-plans/${id}`, input);
    return data;
  }

  async delete(id: number): Promise<void> {
    await paymentsApi.delete(`/subscription-plans/${id}`);
  }
}
