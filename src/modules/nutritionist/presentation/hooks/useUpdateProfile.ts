import { useState } from "react";
import {
  createProfessionalProfileUseCase,
  updateProfessionalProfileUseCase,
} from "../../application/use-cases/updateProfessionalProfileUseCase";
import { HttpNutritionistRepository } from "../../infrastructure/repositories/HttpNutritionistRepository";
import type { CreateProfessionalProfileInput } from "../../application/dto/CreateProfessionalProfileInput";
import type { UpdateProfessionalProfileInput } from "../../application/dto/UpdateProfessionalProfileInput";
import type { ProfessionalProfile } from "../../domain/models/ProfessionalProfile";

const repository = new HttpNutritionistRepository();
const createProfile = createProfessionalProfileUseCase(repository);
const updateProfile = updateProfessionalProfileUseCase(repository);

type SaveProfileInput = CreateProfessionalProfileInput | UpdateProfessionalProfileInput;

export function useUpdateProfile() {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const execute = async (
    input: SaveProfileInput,
    mode: "create" | "update" = "update"
  ): Promise<ProfessionalProfile | null> => {
    setIsSaving(true);
    setError(null);
    try {
      const updated =
        mode === "create"
          ? await createProfile(input as CreateProfessionalProfileInput)
          : await updateProfile(input as UpdateProfessionalProfileInput);
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
