import { useState, useEffect } from "react";
import { getNutritionistProfileUseCase } from "../../application/use-cases/getNutritionistProfileUseCase";
import { HttpNutritionistRepository } from "../../infrastructure/repositories/HttpNutritionistRepository";
import type { ProfessionalProfile } from "../../domain/models/ProfessionalProfile";

const repository = new HttpNutritionistRepository();
const getProfile = getNutritionistProfileUseCase(repository);

export function useNutritionistProfile() {
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProfile();
      setProfile(data);
    } catch {
      setError("Failed to load profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  return { profile, isLoading, error, refetch: fetch, setProfile };
}