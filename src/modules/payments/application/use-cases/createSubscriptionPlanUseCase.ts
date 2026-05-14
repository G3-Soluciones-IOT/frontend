import type { CreateSubscriptionPlanInput } from "../dto/CreateSubscriptionPlanInput";
import type { SubscriptionPlan } from "../../domain/models/SubscriptionPlan";
import type { SubscriptionPlanRepository } from "../../domain/repositories/SubscriptionPlanRepository";
import { InvalidSubscriptionPlanError } from "../../domain/errors/SubscriptionPlanDomainError";

function normalizeFeatures(features: string[]) {
  const normalized = features.map((feature) => feature.trim()).filter(Boolean);
  return Array.from(new Set(normalized));
}

function validateCreateInput(input: CreateSubscriptionPlanInput) {
  if (!input.tag.trim()) throw new InvalidSubscriptionPlanError("Plan tag is required.");
  if (!input.name.trim()) throw new InvalidSubscriptionPlanError("Plan name is required.");
  if (!Number.isFinite(input.price) || input.price < 0) {
    throw new InvalidSubscriptionPlanError("Plan price must be a valid number greater than or equal to 0.");
  }

  const features = normalizeFeatures(input.features);
  if (features.length === 0) {
    throw new InvalidSubscriptionPlanError("At least one feature is required.");
  }

  return {
    ...input,
    tag: input.tag.trim(),
    name: input.name.trim(),
    currency: input.currency?.trim() || undefined,
    description: input.description.trim(),
    features,
    isPopular: input.isPopular ?? false,
    active: input.active ?? true,
  };
}

export function createSubscriptionPlanUseCase(repository: SubscriptionPlanRepository) {
  return async (input: CreateSubscriptionPlanInput): Promise<SubscriptionPlan> => {
    return repository.create(validateCreateInput(input));
  };
}
