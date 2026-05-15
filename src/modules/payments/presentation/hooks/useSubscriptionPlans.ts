import { useState, useEffect } from "react";
import { getSubscriptionPlansUseCase } from "../../application/use-cases/getSubscriptionPlansUseCase";
import { HttpSubscriptionPlanRepository } from "../../infrastructure/repositories/HttpSubscriptionPlanRepository";
import { mockSubscriptionPlans } from "../../infrastructure/mock/subscriptionPlans.mock";
import type { SubscriptionPlan } from "../../domain/models/SubscriptionPlan";

const repository = new HttpSubscriptionPlanRepository();
const getPlans = getSubscriptionPlansUseCase(repository);

export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(mockSubscriptionPlans);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPlans();
      setPlans(data);
    } catch {
      setPlans(mockSubscriptionPlans);
      setError("Failed to load plans. Using mock data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadPlans = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getPlans();
        if (mounted) setPlans(data);
      } catch {
        if (mounted) {
          setPlans(mockSubscriptionPlans);
          setError("Failed to load plans. Using mock data.");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadPlans();

    return () => {
      mounted = false;
    };
  }, []);

  return { plans, isLoading, error, refetch: fetch, setPlans };
}
