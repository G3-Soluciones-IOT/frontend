import { useEffect, useState } from "react";
import { useI18n } from "@/shared/i18n/useI18n";
import { apiUrl } from "@/app/config/env";
import type { UserProfileResource } from "../../../infrastructure/api/nutritionistPatients.api";
import styles from "../../pages/PatientsPages.module.css";

interface PatientProfileResource {
  id: number | string;
  userId?: number | string;
  name?: string;
  username?: string;
  email?: string;
  birthDate?: string;
  dateOfBirth?: string;
  birthday?: string;
  birthdate?: string;
  birth_date?: string;
  date_of_birth?: string;
  userProfileId?: number | string;
}

interface PatientOverviewTabProps {
  patientId: string;
  fallbackName: string;
  fallbackEmail?: string;
  fallbackProfile?: UserProfileResource | null;
}

interface OverviewData {
  profile?: PatientProfileResource;
  nutritionProfile?: UserProfileResource;
}

async function fetchPatientDetailJson<T>(path: string): Promise<T> {
  const token = localStorage.getItem("accessToken");
  const response = await fetch(apiUrl(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function calculateAge(birthDate?: string) {
  if (!birthDate) return "-";

  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return "-";

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return `${age} years`;
}

function formatBirthDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function getDateValue(source?: unknown) {
  if (!source || typeof source !== "object") return undefined;
  const record = source as Record<string, unknown>;
  const value =
    record.birthDate ??
    record.birthdate ??
    record.birth_date ??
    record.dateOfBirth ??
    record.date_of_birth ??
    record.birthday ??
    record.dob;

  return typeof value === "string" ? value : undefined;
}

function resolveBirthDate(profile?: PatientProfileResource, nutritionProfile?: UserProfileResource, fallbackProfile?: UserProfileResource | null) {
  return (
    getDateValue(nutritionProfile) ||
    getDateValue(profile) ||
    getDateValue(fallbackProfile)
  );
}

function findProfileByPatient(
  profiles: PatientProfileResource[],
  patientId: string,
  nutritionProfile?: UserProfileResource,
) {
  return (
    profiles.find((profile) => String(profile.userProfileId) === String(nutritionProfile?.id)) ||
    profiles.find((profile) => String(profile.userId) === String(patientId)) ||
    profiles.find((profile) => String(profile.id) === String(patientId))
  );
}

function findNutritionProfileByPatient(
  profiles: UserProfileResource[],
  patientId: string,
  accountProfile?: PatientProfileResource,
) {
  return (
    profiles.find((profile) => String(profile.id) === String(accountProfile?.userProfileId)) ||
    profiles.find((profile) => String(profile.userId) === String(patientId)) ||
    profiles.find((profile) => String(profile.id) === String(patientId))
  );
}

function formatHeight(height?: number) {
  if (!height || !Number.isFinite(height)) return "-";
  return height > 3 ? `${height} cm` : `${height.toFixed(2)} m`;
}

function formatWeight(weight?: number) {
  if (!weight || !Number.isFinite(weight)) return "-";
  return `${weight} kg`;
}

function OverviewItem({ label, value }: { label: string; value: string | number }) {
  return (
    <article className={styles.patientOverviewItem}>
      <span>{label}</span>
      <strong>{value || "-"}</strong>
    </article>
  );
}

export function PatientOverviewTab({
  patientId,
  fallbackName,
  fallbackEmail,
  fallbackProfile,
}: PatientOverviewTabProps) {
  const { t } = useI18n();
  const [overviewData, setOverviewData] = useState<OverviewData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadOverview = async () => {
      setLoading(true);
      setError(null);

      try {
        const [profileResult, nutritionProfileResult] = await Promise.allSettled([
          fetchPatientDetailJson<PatientProfileResource>(
            `/api/v1/profiles/by-user/${encodeURIComponent(String(patientId))}`,
          ),
          fetchPatientDetailJson<UserProfileResource>(
            `/api/v1/user-profiles/by-user/${encodeURIComponent(String(patientId))}`,
          ),
        ]);

        const nextProfile = profileResult.status === "fulfilled" ? profileResult.value : undefined;
        const nutritionProfileByUser =
          nutritionProfileResult.status === "fulfilled" ? nutritionProfileResult.value : undefined;

        const hasBirthDate = resolveBirthDate(nextProfile, nutritionProfileByUser, fallbackProfile);
        let resolvedProfile = nextProfile;
        let resolvedNutritionProfile = nutritionProfileByUser;

        if (!hasBirthDate) {
          const [profilesResult, nutritionProfilesResult] = await Promise.allSettled([
            fetchPatientDetailJson<PatientProfileResource[]>("/api/v1/profiles"),
            fetchPatientDetailJson<UserProfileResource[]>("/api/v1/user-profiles"),
          ]);

          const profiles = profilesResult.status === "fulfilled" ? profilesResult.value : [];
          const nutritionProfiles = nutritionProfilesResult.status === "fulfilled" ? nutritionProfilesResult.value : [];

          resolvedProfile = resolvedProfile ?? findProfileByPatient(profiles, patientId, resolvedNutritionProfile);
          resolvedNutritionProfile =
            resolvedNutritionProfile ?? findNutritionProfileByPatient(nutritionProfiles, patientId, resolvedProfile);
          resolvedProfile = resolvedProfile ?? findProfileByPatient(profiles, patientId, resolvedNutritionProfile);
        }

        if (!mounted) return;
        setOverviewData({ profile: resolvedProfile, nutritionProfile: resolvedNutritionProfile });
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load overview.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadOverview();

    return () => {
      mounted = false;
    };
  }, [patientId]);

  const overviewProfile = overviewData.profile;
  const overviewNutrition = overviewData.nutritionProfile;
  const birthDate = resolveBirthDate(overviewProfile, overviewNutrition, fallbackProfile);
  const allergies = overviewNutrition?.allergyNames?.length ? overviewNutrition.allergyNames : [];

  return (
    <section className={styles.patientOverviewPanel}>
      <div className={styles.patientOverviewTitle}>
        <h2>{t("patients.overview.title")}</h2>
        <span>{loading ? t("patients.common.loading") : t("patients.overview.realData")}</span>
      </div>
      {error && <p className={styles.errorText}>{t("patients.overview.unavailable")}: {error}</p>}
      <div className={styles.patientOverviewGrid}>
        <OverviewItem label={t("patients.overview.name")} value={overviewProfile?.name || overviewProfile?.username || fallbackName} />
        <OverviewItem label={t("patients.overview.email")} value={overviewProfile?.email || fallbackEmail || "-"} />
        <OverviewItem label={t("patients.overview.age")} value={calculateAge(birthDate)} />
        <OverviewItem label={t("patients.overview.birthDate")} value={formatBirthDate(birthDate)} />
        <OverviewItem label={t("patients.overview.weight")} value={formatWeight(overviewNutrition?.weight ?? fallbackProfile?.weight)} />
        <OverviewItem label={t("patients.overview.height")} value={formatHeight(overviewNutrition?.height ?? fallbackProfile?.height)} />
        <OverviewItem label={t("patients.overview.objective")} value={overviewNutrition?.objectiveName || fallbackProfile?.objectiveName || "-"} />
        <OverviewItem label={t("patients.overview.activityLevel")} value={overviewNutrition?.activityLevelName || fallbackProfile?.activityLevelName || "-"} />
      </div>
      <div className={styles.patientAllergiesCard}>
        <span>{t("patients.overview.allergies")}</span>
        <div className={styles.tagsRow}>
          {allergies.length > 0
            ? allergies.map((allergy) => <span key={allergy} className={styles.tag}>{allergy}</span>)
            : <span className={styles.tag}>{t("patients.overview.noAllergies")}</span>}
        </div>
      </div>
    </section>
  );
}
