import type { ExperienceRange, Specialty } from "../../domain/models/ProfessionalProfile";
 
export interface UpdateProfessionalProfileInput {
  firstName: string;
  lastName: string;
  professionalTitle: string;
  bio: string;
  primaryCertification: string;
  specialties: Specialty[];
  experienceRange: ExperienceRange;
}
 