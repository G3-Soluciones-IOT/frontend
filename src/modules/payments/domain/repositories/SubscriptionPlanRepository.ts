import type { CreateSubscriptionPlanInput } from "../../application/dto/CreateSubscriptionPlanInput";
import type { ListSubscriptionPlansInput } from "../../application/dto/ListSubscriptionPlansInput";
import type { UpdateSubscriptionPlanInput } from "../../application/dto/UpdateSubscriptionPlanInput";
import type { SubscriptionPlan } from "../models/SubscriptionPlan";

export interface SubscriptionPlanRepository {
  list(input?: ListSubscriptionPlansInput): Promise<SubscriptionPlan[]>;
  getById(id: number): Promise<SubscriptionPlan>;
  create(input: CreateSubscriptionPlanInput): Promise<SubscriptionPlan>;
  update(id: number, input: UpdateSubscriptionPlanInput): Promise<SubscriptionPlan>;
  delete(id: number): Promise<void>;
}
