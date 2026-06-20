export interface UpdateProfessionalProfileInput {
  id: number | string;
  bio: string;
  fullName: string;
  licenseNumber?: string;
  specialty?: string;
  profilePictureUrl: string;
  acceptingNewPatients: boolean;
  yearsExperience: number;
}
