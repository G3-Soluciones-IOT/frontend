// Domain
export type {
  ExperienceRange,
  ProfessionalProfile,
  Specialty,
  VerificationStatus,
} from "./domain/models/ProfessionalProfile";
export type { NutritionistRepository } from "./domain/repositories/NutritionistRepository";
export {
  BioTooLongError,
  MaxSpecialtiesReachedError,
  NutritionistDomainError,
} from "./domain/errors/NutritionistDomainError";

// Application DTOs
export type { UpdateProfessionalProfileInput } from "./application/dto/UpdateProfessionalProfileInput";

// Infrastructure
export { HttpNutritionistRepository } from "./infrastructure/repositories/HttpNutritionistRepository";

// Presentation
export { NutritionistProfilePage } from "./presentation/pages/NutritionistProfilePage";
export { useNutritionistProfile } from "./presentation/hooks/useNutritionistProfile";
export { useUpdateProfile } from "./presentation/hooks/useUpdateProfile";
