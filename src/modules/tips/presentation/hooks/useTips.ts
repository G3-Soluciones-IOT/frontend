import { useState, useEffect } from "react";
import { getListTipsUseCase } from "../../application/use-cases/getListTipsUseCase";
import { HttpTipRepository } from "../../infrastructure/repositories/HttpTipRepository";
import { mockTips } from "../../infrastructure/mock/tips.mock";
import type { Tip } from "../../domain/models/Tip";

const repository = new HttpTipRepository();
const listTips = getListTipsUseCase(repository);

export function useTips() {
  const [tips, setTips] = useState<Tip[]>(mockTips);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listTips();
      setTips(data);
    } catch {
      setTips(mockTips);
      setError("Failed to load tips. Using mock data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadTips = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listTips();
        if (mounted) setTips(data);
      } catch {
        if (mounted) {
          setTips(mockTips);
          setError("Failed to load tips. Using mock data.");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadTips();

    return () => {
      mounted = false;
    };
  }, []);

  return { tips, isLoading, error, refetch: fetch, setTips };
}

