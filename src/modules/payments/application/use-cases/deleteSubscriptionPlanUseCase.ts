import type { SubscriptionPlanRepository } from "../../domain/repositories/SubscriptionPlanRepository";

export function deleteSubscriptionPlanUseCase(repository: SubscriptionPlanRepository) {
  return async (id: number): Promise<void> => {
    await repository.delete(id);
  };
}
