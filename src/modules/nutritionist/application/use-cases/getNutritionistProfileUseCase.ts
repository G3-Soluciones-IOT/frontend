import type { NutritionistRepository } from "../../domain/repositories/NutritionistRepository";
import type { ProfessionalProfile } from "../../domain/models/ProfessionalProfile";

export function getNutritionistProfileUseCase(repository: NutritionistRepository) {
  return (): Promise<ProfessionalProfile> => {
    return repository.getProfile();
  };
}