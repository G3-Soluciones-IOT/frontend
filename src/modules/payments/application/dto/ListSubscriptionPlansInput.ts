import type { BillingPeriod } from "../../domain/models/SubscriptionPlan";

export interface ListSubscriptionPlansInput {
  search?: string;
  active?: boolean;
  isPopular?: boolean;
  billingPeriod?: BillingPeriod;
}
