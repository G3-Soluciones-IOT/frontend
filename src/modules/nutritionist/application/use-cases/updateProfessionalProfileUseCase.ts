import type { NutritionistRepository } from "../../domain/repositories/NutritionistRepository";
import type { UpdateProfessionalProfileInput } from "../dto/UpdateProfessionalProfileInput";
import type { ProfessionalProfile } from "../../domain/models/ProfessionalProfile";
import { MaxSpecialtiesReachedError, BioTooLongError } from "../../domain/errors/NutritionistDomainError";

export function updateProfessionalProfileUseCase(repository: NutritionistRepository) {
  return async (input: UpdateProfessionalProfileInput): Promise<ProfessionalProfile> => {
    if (input.specialties.length > 5) throw new MaxSpecialtiesReachedError();
    if (input.bio.length > 500) throw new BioTooLongError();

    return repository.updateProfile({
      ...input,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      professionalTitle: input.professionalTitle.trim(),
    });
  };
}