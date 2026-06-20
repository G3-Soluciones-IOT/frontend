import type { NutritionistRepository } from "../../domain/repositories/NutritionistRepository";
import type { CreateProfessionalProfileInput } from "../dto/CreateProfessionalProfileInput";
import type { UpdateProfessionalProfileInput } from "../dto/UpdateProfessionalProfileInput";
import type { ProfessionalProfile } from "../../domain/models/ProfessionalProfile";
import { BioTooLongError } from "../../domain/errors/NutritionistDomainError";

export function createProfessionalProfileUseCase(repository: NutritionistRepository) {
  return async (input: CreateProfessionalProfileInput): Promise<ProfessionalProfile> => {
    if (input.bio.length > 500) throw new BioTooLongError();

    return repository.createProfile({
      ...input,
      fullName: input.fullName.trim(),
      licenseNumber: input.licenseNumber.trim(),
      specialty: input.specialty.trim(),
      profilePictureUrl: input.profilePictureUrl.trim(),
      yearsExperience: Number(input.yearsExperience),
    });
  };
}

export function updateProfessionalProfileUseCase(repository: NutritionistRepository) {
  return async (input: UpdateProfessionalProfileInput): Promise<ProfessionalProfile> => {
    if (input.bio.length > 500) throw new BioTooLongError();

    return repository.updateProfile({
      ...input,
      fullName: input.fullName.trim(),
      licenseNumber: input.licenseNumber?.trim(),
      specialty: input.specialty?.trim(),
      profilePictureUrl: input.profilePictureUrl.trim(),
      yearsExperience: Number(input.yearsExperience),
    });
  };
}
