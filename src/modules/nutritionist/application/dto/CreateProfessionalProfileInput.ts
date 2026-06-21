export interface CreateProfessionalProfileInput {
  userId: number | string;
  fullName: string;
  licenseNumber: string;
  specialty: string;
  yearsExperience: number;
  acceptingNewPatients: boolean;
  bio: string;
  profilePictureUrl: string;
}
