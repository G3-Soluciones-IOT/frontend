import type { ProfessionalProfile } from "../models/ProfessionalProfile";
import type { CreateProfessionalProfileInput } from "../../application/dto/CreateProfessionalProfileInput";
import type { UpdateProfessionalProfileInput } from "../../application/dto/UpdateProfessionalProfileInput";

export interface NutritionistRepository {
  getProfile(): Promise<ProfessionalProfile>;
  createProfile(input: CreateProfessionalProfileInput): Promise<ProfessionalProfile>;
  updateProfile(input: UpdateProfessionalProfileInput): Promise<ProfessionalProfile>;
  uploadAvatar(file: File): Promise<{ avatarUrl: string }>;
  uploadCertification(file: File): Promise<{ fileUrl: string }>;
}
