import { useEffect, useState } from "react";
import { patientDetail } from "../../infrastructure/mock/patients.mock";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import { PatientOverviewTab } from "../components/patient-detail/PatientOverviewTab";
import { PatientPlaceholderTab } from "../components/patient-detail/PatientPlaceholderTab";
import { PatientPlansRecipesTab } from "../components/patient-detail/PatientPlansRecipesTab";
import { PatientTrackingTab } from "../components/patient-detail/PatientTrackingTab";
import {
  getPatientUserSummaries,
  getUserProfiles,
  type PatientUserSummary,
  type UserProfileResource,
} from "../../infrastructure/api/nutritionistPatients.api";
import styles from "./PatientsPages.module.css";

interface PatientDetailPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

type PatientDetailTab = "overview" | "tracking" | "iot" | "plans" | "communication";

const detailTabs: Array<{ key: PatientDetailTab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "tracking", label: "Tracking" },
  { key: "iot", label: "IoT Devices" },
  { key: "plans", label: "Plans & Recipes" },
  { key: "communication", label: "Communication" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "P";
}

function profileForPatient(profiles: UserProfileResource[], patientId: string) {
  return profiles.find((profile) => String(profile.userId) === patientId)
    ?? profiles.find((profile) => String(profile.id) === patientId)
    ?? null;
}

export function PatientDetailPage({ currentPath, onNavigate }: PatientDetailPageProps) {
  const patientId = currentPath.split("/").filter(Boolean).at(-1) || patientDetail.id;
  const [activeTab, setActiveTab] = useState<PatientDetailTab>("overview");
  const [profile, setProfile] = useState<UserProfileResource | null>(null);
  const [patientUser, setPatientUser] = useState<PatientUserSummary | null>(null);

  const patientName =
    patientUser?.fullName
    || patientUser?.username
    || (profile ? `Patient #${profile.userId ?? profile.id}` : patientDetail.name);

  useEffect(() => {
    let mounted = true;

    const loadPatientHeader = async () => {
      try {
        const [profiles, users] = await Promise.all([
          getUserProfiles(),
          getPatientUserSummaries(),
        ]);
        const nextProfile = profileForPatient(profiles, patientId);
        const nextUser = users.find((user) => String(user.id) === String(nextProfile?.userId ?? patientId)) ?? null;

        if (!mounted) return;
        setProfile(nextProfile);
        setPatientUser(nextUser);
      } catch (err) {
        console.error("Failed to load patient header data.", err);
      }
    };

    loadPatientHeader();

    return () => {
      mounted = false;
    };
  }, [patientId]);

  return (
    <SharedLayout
      title={patientName}
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={useNavigation()}
      breadcrumbs={["Patients", "Directory", patientName]}
      showPageTitle={false}
    >
      <div className={styles.stack}>
        <button type="button" className={styles.backButton} onClick={() => onNavigate("/nutritionist/patients/directory")}>
          &larr; Back to Patients Directory
        </button>

        <section className={`${styles.panel} ${styles.patientDetailShell}`}>
          <div className={styles.patientDetailHeader}>
            <div className={styles.profileAvatar}>{getInitials(patientName)}</div>
            <div>
              <h1>{patientName}</h1>
              <p>{patientUser?.email || "-"}</p>
            </div>
          </div>

          <nav className={styles.patientDetailTabs} aria-label="Patient detail views">
            {detailTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={activeTab === tab.key ? styles.patientDetailTabActive : ""}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {activeTab === "overview" && (
            <PatientOverviewTab
              patientId={patientId}
              fallbackName={patientName}
              fallbackEmail={patientUser?.email}
              fallbackProfile={profile}
            />
          )}

          {activeTab === "tracking" && (
            <PatientTrackingTab patientId={patientId} />
          )}

          {activeTab === "iot" && (
            <PatientPlaceholderTab title="IoT Devices" description="Device data and alerts will be shown here." />
          )}

          {activeTab === "plans" && (
            <PatientPlansRecipesTab patientUserId={patientId} profileId={profile?.id} />
          )}

          {activeTab === "communication" && (
            <PatientPlaceholderTab title="Communication" description="Messages and recommendations will be shown here." />
          )}
        </section>
      </div>
    </SharedLayout>
  );
}
