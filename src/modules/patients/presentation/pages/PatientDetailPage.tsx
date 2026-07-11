import { useEffect, useState } from "react";
import { apiUrl } from "@/app/config/env";
import { patientDetail } from "../../infrastructure/mock/patients.mock";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import { useI18n } from "@/shared/i18n/useI18n";
import type { TranslationKey } from "@/shared/i18n/translations";
import { PatientOverviewTab } from "../components/patient-detail/PatientOverviewTab";
import { PatientPlaceholderTab } from "../components/patient-detail/PatientPlaceholderTab";
import { PatientPlansRecipesTab } from "../components/patient-detail/PatientPlansRecipesTab";
import { PatientTrackingTab } from "../components/patient-detail/PatientTrackingTab";
import { PatientIotDevicesTab } from "../components/patient-detail/PatientIotDevicesTab";
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

const detailTabs: Array<{ key: PatientDetailTab; labelKey: TranslationKey }> = [
  { key: "overview", labelKey: "patients.detail.tab.overview" },
  { key: "tracking", labelKey: "patients.detail.tab.tracking" },
  { key: "iot", labelKey: "patients.detail.tab.iot" },
  { key: "plans", labelKey: "patients.detail.tab.plans" },
  { key: "communication", labelKey: "patients.detail.tab.communication" },
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

interface PatientAccountProfile {
  id: number | string;
  name?: string;
  email?: string;
  userProfileId?: number | string;
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchPatientJson<T>(path: string): Promise<T> {
  const response = await fetch(apiUrl(path), {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function getPatientAccountProfile(patientUserId: string) {
  return fetchPatientJson<PatientAccountProfile>(
    `/api/v1/profiles/by-user/${encodeURIComponent(patientUserId)}`,
  );
}

export function PatientDetailPage({ currentPath, onNavigate }: PatientDetailPageProps) {
  const { t } = useI18n();
  const patientId = currentPath.split("/").filter(Boolean).at(-1) || patientDetail.id;
  const [activeTab, setActiveTab] = useState<PatientDetailTab>("overview");
  const [profile, setProfile] = useState<UserProfileResource | null>(null);
  const [patientUser, setPatientUser] = useState<PatientUserSummary | null>(null);
  const [accountProfile, setAccountProfile] = useState<PatientAccountProfile | null>(null);

  const patientName =
    accountProfile?.name
    || patientUser?.fullName
    || patientUser?.username
    || (profile ? `Patient #${profile.userId ?? profile.id}` : `Patient #${patientId}`);

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
        const nextAccountProfile = await getPatientAccountProfile(patientId).catch(() => null);

        if (!mounted) return;
        setProfile(nextProfile);
        setPatientUser(nextUser);
        setAccountProfile(nextAccountProfile);
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
      breadcrumbs={[t("patients.breadcrumb.patients"), t("patients.breadcrumb.directory"), patientName]}
      showPageTitle={false}
    >
      <div className={styles.stack}>
        <button type="button" className={styles.backButton} onClick={() => onNavigate("/nutritionist/patients/directory")}>
          &larr; {t("patients.detail.back")}
        </button>

        <section className={`${styles.panel} ${styles.patientDetailShell}`}>
          <div className={styles.patientDetailHeader}>
            <div className={styles.profileAvatar}>{getInitials(patientName)}</div>
          <div>
            <h1>{patientName}</h1>
            <p>{accountProfile?.email || patientUser?.email || "-"}</p>
          </div>
          </div>

          <nav className={styles.patientDetailTabs} aria-label={t("patients.detail.tabsLabel")}>
            {detailTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={activeTab === tab.key ? styles.patientDetailTabActive : ""}
                onClick={() => {
                  if (tab.key === "communication") {
                    onNavigate("/communication/chat");
                    return;
                  }

                  setActiveTab(tab.key);
                }}
              >
                {t(tab.labelKey)}
              </button>
            ))}
          </nav>

          {activeTab === "overview" && (
            <PatientOverviewTab
              patientId={patientId}
              fallbackName={patientName}
              fallbackEmail={accountProfile?.email || patientUser?.email}
              fallbackProfile={profile}
            />
          )}

          {activeTab === "tracking" && (
            <PatientTrackingTab patientId={patientId} />
          )}

          {activeTab === "iot" && (
            <PatientIotDevicesTab patientId={patientId} />
          )}

          {activeTab === "plans" && (
            <PatientPlansRecipesTab
              patientUserId={patientId}
              profileId={accountProfile?.userProfileId}
              accountProfileId={accountProfile?.id}
            />
          )}

          {activeTab === "communication" && (
            <PatientPlaceholderTab title={t("patients.detail.tab.communication")} description={t("patients.detail.communication.description")} />
          )}
        </section>
      </div>
    </SharedLayout>
  );
}
