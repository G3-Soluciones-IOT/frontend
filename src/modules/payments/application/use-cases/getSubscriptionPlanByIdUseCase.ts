import type { SubscriptionPlan } from "../../domain/models/SubscriptionPlan";
import type { SubscriptionPlanRepository } from "../../domain/repositories/SubscriptionPlanRepository";

export function getSubscriptionPlanByIdUseCase(repository: SubscriptionPlanRepository) {
  return (id: number): Promise<SubscriptionPlan> => {
    return repository.getById(id);
  };
}
