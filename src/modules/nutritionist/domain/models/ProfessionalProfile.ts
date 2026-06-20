export interface ProfessionalProfile {
  id: number | string;
  userId: number | string;
  fullName: string;
  licenseNumber?: string;
  specialty?: string;
  yearsExperience: number;
  acceptingNewPatients: boolean;
  bio: string;
  profilePictureUrl: string;
}
