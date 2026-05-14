export class SubscriptionPlanDomainError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "SubscriptionPlanDomainError";
    this.code = code;
  }
}

export class SubscriptionPlanNotFoundError extends SubscriptionPlanDomainError {
  constructor(id?: number) {
    super(
      id === undefined
        ? "Subscription plan not found."
        : `Subscription plan with id ${id} not found.`,
      "SUBSCRIPTION_PLAN_NOT_FOUND"
    );
  }
}

export class InvalidSubscriptionPlanError extends SubscriptionPlanDomainError {
  constructor(message = "Subscription plan data is invalid.") {
    super(message, "INVALID_SUBSCRIPTION_PLAN");
  }
}
