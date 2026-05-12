export type VerificationStatus = "pending" | "verified" | "rejected";
export type ExperienceRange =
  | "0-1 years"
  | "1-3 years"
  | "3-5 years"
  | "6-10 years"
  | "10+ years";

export interface Specialty {
  id: string;
  label: string;
}

export interface ProfessionalProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  professionalTitle: string;
  bio: string;
  avatarUrl?: string;
  primaryCertification: string;
  certificationFileUrl?: string;
  specialties: Specialty[];
  experienceRange: ExperienceRange;
  identityVerified: boolean;
  credentialsVerified: boolean;
  verificationStatus: VerificationStatus;
  updatedAt: string;
}