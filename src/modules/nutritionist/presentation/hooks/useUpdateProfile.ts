import { useState } from "react";
import { updateProfessionalProfileUseCase } from "../../application/use-cases/updateProfessionalProfileUseCase";
import { HttpNutritionistRepository } from "../../infrastructure/repositories/HttpNutritionistRepository";
import type { UpdateProfessionalProfileInput } from "../../application/dto/UpdateProfessionalProfileInput";
import type { ProfessionalProfile } from "../../domain/models/ProfessionalProfile";

const repository = new HttpNutritionistRepository();
const updateProfile = updateProfessionalProfileUseCase(repository);

export function useUpdateProfile() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const execute = async (
    input: UpdateProfessionalProfileInput
  ): Promise<ProfessionalProfile | null> => {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateProfile(input);
      setSavedAt(new Date());
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  return { execute, isSaving, error, savedAt };
}