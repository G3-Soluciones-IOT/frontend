import type { BillingPeriod } from "../../domain/models/SubscriptionPlan";

export interface CreateSubscriptionPlanInput {
  tag: string;
  name: string;
  price: number;
  currency?: string;
  billingPeriod: BillingPeriod;
  description: string;
  features: string[];
  isPopular?: boolean;
  active?: boolean;
}
