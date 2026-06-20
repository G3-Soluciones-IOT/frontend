import type { User } from "@/modules/iam/domain/models/User";
import type { UpdateProfessionalProfileInput } from "../../application/dto/UpdateProfessionalProfileInput";
import type { ProfessionalProfile } from "../../domain/models/ProfessionalProfile";

const STORAGE_PREFIX = "nutritionistProfile:";

export function profileStorageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

export function readStoredProfileInput(userId: string): UpdateProfessionalProfileInput | null {
  try {
    const raw = localStorage.getItem(profileStorageKey(userId));
    return raw ? (JSON.parse(raw) as UpdateProfessionalProfileInput) : null;
  } catch {
    return null;
  }
}

export function writeStoredProfileInput(userId: string, input: UpdateProfessionalProfileInput) {
  localStorage.setItem(profileStorageKey(userId), JSON.stringify(input));
}

export function mapUserToProfessionalProfile(
  user: User,
  overrides?: Partial<UpdateProfessionalProfileInput>
): ProfessionalProfile {
  return {
    id: user.id,
    userId: user.id,
    fullName: overrides?.fullName ?? user.username,
    licenseNumber: overrides?.licenseNumber ?? "",
    specialty: overrides?.specialty ?? "CLINICAL",
    yearsExperience: overrides?.yearsExperience ?? 0,
    acceptingNewPatients: overrides?.acceptingNewPatients ?? true,
    bio: overrides?.bio ?? "",
    profilePictureUrl: overrides?.profilePictureUrl ?? "",
  };
}

export function loadProfileForUser(user: User): ProfessionalProfile {
  const stored = readStoredProfileInput(user.id);
  return mapUserToProfessionalProfile(user, stored ?? undefined);
}
