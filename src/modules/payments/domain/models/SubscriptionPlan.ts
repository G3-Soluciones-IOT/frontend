export type BillingPeriod = "MONTHLY" | "YEARLY";

export type SubscriptionPlanStatus = "active" | "inactive";

export interface SubscriptionPlan {
  id: number;
  tag: string;
  name: string;
  price: number;
  currency?: string;
  billingPeriod: BillingPeriod;
  description: string;
  features: string[];
  isPopular: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
