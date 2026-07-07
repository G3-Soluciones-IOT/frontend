import { useEffect, useState } from "react";
import { apiUrl } from "@/app/config/env";
import type { UserProfileResource } from "../../../infrastructure/api/nutritionistPatients.api";
import styles from "../../pages/PatientsPages.module.css";

interface PatientProfileResource {
  id: number | string;
  name?: string;
  username?: string;
  email?: string;
  birthDate?: string;
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

function firstItem<T>(data: T | T[]) {
  return Array.isArray(data) ? data[0] ?? undefined : data;
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
  const [overviewData, setOverviewData] = useState<OverviewData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadOverview = async () => {
      setLoading(true);
      setError(null);

      try {
        const profileData = await fetchPatientDetailJson<PatientProfileResource | PatientProfileResource[]>(
          `/api/v1/profiles/${patientId}`,
        );
        const nextProfile = firstItem(profileData);
        const nutritionProfile = nextProfile?.userProfileId
          ? firstItem(
              await fetchPatientDetailJson<UserProfileResource | UserProfileResource[]>(
                `/api/v1/user-profiles/${nextProfile.userProfileId}`,
              ),
            )
          : undefined;

        if (!mounted) return;
        setOverviewData({ profile: nextProfile, nutritionProfile });
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
  const birthDate = overviewNutrition?.birthDate || overviewProfile?.birthDate || fallbackProfile?.birthDate;
  const allergies = overviewNutrition?.allergyNames?.length ? overviewNutrition.allergyNames : [];

  return (
    <section className={styles.patientOverviewPanel}>
      <div className={styles.patientOverviewTitle}>
        <h2>Patient Overview</h2>
        <span>{loading ? "Loading" : "Real profile data"}</span>
      </div>
      {error && <p className={styles.errorText}>Overview endpoint unavailable: {error}</p>}
      <div className={styles.patientOverviewGrid}>
        <OverviewItem label="Name" value={overviewProfile?.name || overviewProfile?.username || fallbackName} />
        <OverviewItem label="Email" value={overviewProfile?.email || fallbackEmail || "-"} />
        <OverviewItem label="Age" value={calculateAge(birthDate)} />
        <OverviewItem label="Birth Date" value={formatBirthDate(birthDate)} />
        <OverviewItem label="Weight" value={formatWeight(overviewNutrition?.weight ?? fallbackProfile?.weight)} />
        <OverviewItem label="Height" value={formatHeight(overviewNutrition?.height ?? fallbackProfile?.height)} />
        <OverviewItem label="Objective" value={overviewNutrition?.objectiveName || fallbackProfile?.objectiveName || "-"} />
        <OverviewItem label="Activity Level" value={overviewNutrition?.activityLevelName || fallbackProfile?.activityLevelName || "-"} />
      </div>
      <div className={styles.patientAllergiesCard}>
        <span>Allergies</span>
        <div className={styles.tagsRow}>
          {allergies.length > 0
            ? allergies.map((allergy) => <span key={allergy} className={styles.tag}>{allergy}</span>)
            : <span className={styles.tag}>No allergies registered</span>}
        </div>
      </div>
    </section>
  );
}
