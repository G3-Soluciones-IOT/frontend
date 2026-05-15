import type { SubscriptionPlan } from "../../domain/models/SubscriptionPlan";

export const mockSubscriptionPlans: SubscriptionPlan[] = [
  {
    id: 1,
    tag: "Starter",
    name: "Basic Tier",
    price: 45,
    currency: "USD",
    billingPeriod: "MONTHLY",
    description:
      "Essential features for individuals starting their fitness journey.",
    features: [
      "Monthly Consultation",
      "Basic Meal Plan Template",
      "Standard Chat Support",
    ],
    isPopular: false,
    active: true,
    createdAt: "2026-05-14T00:00:00Z",
    updatedAt: "2026-05-14T00:00:00Z",
  },
  {
    id: 2,
    tag: "Professional",
    name: "Premium Tier",
    price: 129,
    currency: "USD",
    billingPeriod: "MONTHLY",
    description: "Comprehensive tracking and unlimited communication.",
    features: [
      "4 Monthly Consultations",
      "Custom Meal & Workout Plans",
      "Priority 24/7 Chat Support",
      "Advanced Analytics Dashboard",
    ],
    isPopular: true,
    active: true,
    createdAt: "2026-05-14T00:00:00Z",
    updatedAt: "2026-05-14T00:00:00Z",
  },
  {
    id: 3,
    tag: "Elite",
    name: "Annual Pass",
    price: 999,
    currency: "USD",
    billingPeriod: "YEARLY",
    description:
      "The ultimate long-term commitment package with max savings.",
    features: [
      "All Premium Features",
      "Save $549 annually",
      "1 Free Guest Pass/Month",
    ],
    isPopular: false,
    active: true,
    createdAt: "2026-05-14T00:00:00Z",
    updatedAt: "2026-05-14T00:00:00Z",
  },
];
