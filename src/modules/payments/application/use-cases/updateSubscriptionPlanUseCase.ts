import type { UpdateSubscriptionPlanInput } from "../dto/UpdateSubscriptionPlanInput";
import type { SubscriptionPlan } from "../../domain/models/SubscriptionPlan";
import type { SubscriptionPlanRepository } from "../../domain/repositories/SubscriptionPlanRepository";
import { InvalidSubscriptionPlanError } from "../../domain/errors/SubscriptionPlanDomainError";

function normalizeFeatures(features: string[]) {
  const normalized = features.map((feature) => feature.trim()).filter(Boolean);
  return Array.from(new Set(normalized));
}

function validateUpdateInput(input: UpdateSubscriptionPlanInput) {
  const normalized: UpdateSubscriptionPlanInput = {};

  if (input.tag !== undefined) {
    const tag = input.tag.trim();
    if (!tag) throw new InvalidSubscriptionPlanError("Plan tag cannot be empty.");
    normalized.tag = tag;
  }

  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new InvalidSubscriptionPlanError("Plan name cannot be empty.");
    normalized.name = name;
  }

  if (input.price !== undefined) {
    if (!Number.isFinite(input.price) || input.price < 0) {
      throw new InvalidSubscriptionPlanError("Plan price must be a valid number greater than or equal to 0.");
    }
    normalized.price = input.price;
  }

  if (input.currency !== undefined) {
    normalized.currency = input.currency.trim() || undefined;
  }

  if (input.billingPeriod !== undefined) {
    normalized.billingPeriod = input.billingPeriod;
  }

  if (input.description !== undefined) {
    normalized.description = input.description.trim();
  }

  if (input.features !== undefined) {
    const features = normalizeFeatures(input.features);
    if (features.length === 0) {
      throw new InvalidSubscriptionPlanError("At least one feature is required.");
    }
    normalized.features = features;
  }

  if (input.isPopular !== undefined) normalized.isPopular = input.isPopular;
  if (input.active !== undefined) normalized.active = input.active;

  return normalized;
}

export function updateSubscriptionPlanUseCase(repository: SubscriptionPlanRepository) {
  return async (id: number, input: UpdateSubscriptionPlanInput): Promise<SubscriptionPlan> => {
    return repository.update(id, validateUpdateInput(input));
  };
}
