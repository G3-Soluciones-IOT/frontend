import type { ListSubscriptionPlansInput } from "../dto/ListSubscriptionPlansInput";
import type { SubscriptionPlan } from "../../domain/models/SubscriptionPlan";
import type { SubscriptionPlanRepository } from "../../domain/repositories/SubscriptionPlanRepository";

export function getSubscriptionPlansUseCase(repository: SubscriptionPlanRepository) {
  return (input?: ListSubscriptionPlansInput): Promise<SubscriptionPlan[]> => {
    return repository.list(input);
  };
}
