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

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export function mapUserToProfessionalProfile(
  user: User,
  overrides?: Partial<UpdateProfessionalProfileInput>
): ProfessionalProfile {
  const fromName = splitFullName(user.fullName);

  return {
    id: user.id,
    userId: user.id,
    firstName: overrides?.firstName ?? fromName.firstName,
    lastName: overrides?.lastName ?? fromName.lastName,
    professionalTitle: overrides?.professionalTitle ?? "",
    bio: overrides?.bio ?? "",
    avatarUrl: user.avatarUrl,
    primaryCertification: overrides?.primaryCertification ?? "",
    specialties: overrides?.specialties ?? [],
    experienceRange: overrides?.experienceRange ?? "0-1 years",
    identityVerified: false,
    credentialsVerified: false,
    verificationStatus: "pending",
    updatedAt: new Date().toISOString(),
  };
}

export function loadProfileForUser(user: User): ProfessionalProfile {
  const stored = readStoredProfileInput(user.id);
  return mapUserToProfessionalProfile(user, stored ?? undefined);
}
