import { useEffect, useState } from "react";
import { apiUrl } from "@/app/config/env";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import {
  dashboardSummary,
  todayConsultations,
} from "../../infrastructure/mock/dashboard.mock";
import {
  getNutritionistPatientRelations,
  getPatientUserSummaries,
  getTrackingByUser,
  type TrackingResource,
} from "@/modules/patients/infrastructure/api/nutritionistPatients.api";
import { getStoredNutritionistProfile } from "@/modules/nutritionist/infrastructure/storage/nutritionistProfileStorage";
import { AlertIcon, PatientsIcon, SparklesIcon, TrendIcon } from "../components/DashboardIcons";
import styles from "./DashboardPage.module.css";

interface DashboardPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

interface SessionUser {
  id: string | number;
  username?: string;
  fullName?: string;
}

interface NutritionistProfilePreview {
  userId?: string | number;
  fullName?: string;
}

interface NutritionTrackingRow {
  id: string;
  patientName: string;
  tracking: TrackingResource;
}

function getSessionUser(): SessionUser | null {
  const session = JSON.parse(localStorage.getItem("session") || "null");
  return session?.user ?? null;
}

function getFirstName(name: string) {
  const firstName = name.trim().split(/\s+/)[0] ?? "";
  return firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : "Nutritionist";
}

async function getNutritionistDisplayName(user: SessionUser | null) {
  if (!user?.id) return "Nutritionist";

  const storedProfile = getStoredNutritionistProfile(String(user.id));
  if (storedProfile?.fullName) return getFirstName(storedProfile.fullName);

  try {
    const response = await fetch(apiUrl(`/nutritionists?userId=${encodeURIComponent(String(user.id))}`));
    if (response.ok) {
      const profiles = (await response.json()) as NutritionistProfilePreview[];
      const profile = profiles.find((item) => String(item.userId) === String(user.id)) ?? profiles[0];
      if (profile?.fullName) return getFirstName(profile.fullName);
    }
  } catch {
    // Fallback to the session username when the profile endpoint is unavailable.
  }

  return getFirstName(user.fullName || user.username || "Nutritionist");
}

function formatTrackingDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function DashboardPage({ currentPath, onNavigate }: DashboardPageProps) {
  const [activePatients, setActivePatients] = useState(0);
  const [nutritionistName, setNutritionistName] = useState("Nutritionist");
  const [trackingRows, setTrackingRows] = useState<NutritionTrackingRow[]>([]);

  useEffect(() => {
    let mounted = true;
    const sessionUser = getSessionUser();

    const loadDashboardData = async () => {
      try {
        const [relations, displayName, users] = await Promise.all([
          getNutritionistPatientRelations(sessionUser?.id ?? ""),
          getNutritionistDisplayName(sessionUser),
          getPatientUserSummaries(),
        ]);
        const acceptedRelations = relations.filter((relation) => relation.accepted);
        const rows = await Promise.all(
          acceptedRelations.map(async (relation) => {
            try {
              const tracking = await getTrackingByUser(relation.patientUserId);
              if (!tracking) return null;

              const patient = users.find((user) => String(user.id) === String(relation.patientUserId));
              return {
                id: String(tracking.id),
                patientName: patient?.fullName || patient?.username || `Patient #${relation.patientUserId}`,
                tracking,
              };
            } catch {
              return null;
            }
          })
        );

        if (mounted) {
          setActivePatients(acceptedRelations.length);
          setNutritionistName(displayName);
          setTrackingRows(rows.filter((row): row is NutritionTrackingRow => Boolean(row)).slice(0, 4));
        }
      } catch {
        const displayName = await getNutritionistDisplayName(sessionUser);
        if (mounted) {
          setActivePatients(0);
          setNutritionistName(displayName);
          setTrackingRows([]);
        }
      }
    };

    loadDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SharedLayout
      title="Dashboard"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={useNavigation()}
      showPageTitle={false}
      topbarTabs={[
        { label: "Overview", href: "/nutritionist", active: currentPath === "/nutritionist" },
        { label: "Recent Logs", href: "/nutritionist/recent-logs", active: currentPath === "/nutritionist/recent-logs" },
      ]}
    >
      <div className={styles.dashboard}>
        <header className={styles.dashboardHero}>
          <h1>Good morning, {nutritionistName}! <span aria-hidden="true">{"\uD83D\uDC4B"}</span></h1>
          <p>Here&apos;s what&apos;s happening with your patients today.</p>
        </header>

        <section className={styles.topGrid}>
          <article className={styles.aiSummaryCard}>
            <div className={styles.cardTitleRow}>
              <h2>
                <SparklesIcon />
                AI Health Summary (Mock)
              </h2>
              <span className={styles.mockPill}>AI Powered (Mock)</span>
            </div>
            <p>{dashboardSummary.aiSummary}</p>
            <div className={styles.tagRow}>
              <span className={`${styles.tag} ${styles.tagGreen}`}>
                <TrendIcon />
                12% {dashboardSummary.tags[0]} (Mock)
              </span>
              <span className={`${styles.tag} ${styles.tagRed}`}>
                <AlertIcon />
                2 Patients Need Attention (Mock)
              </span>
            </div>
          </article>

          <article className={styles.activePatientsPanel}>
            <button
              type="button"
              className={styles.requestsButton}
              onClick={() => onNavigate("/nutritionist/patients/request")}
            >
              View Requests
              <span aria-hidden="true">&rarr;</span>
            </button>
            <div className={styles.activePatientIcon}>
              <PatientsIcon />
            </div>
            <p className={styles.activePatientLabel}>Active Patients</p>
            <strong>{activePatients}</strong>
            <span className={styles.realLabel}>Active Patients (Real)</span>
            <p className={styles.trendText}>&uarr; 5% from last week (Real)</p>
            <svg className={styles.sparkline} viewBox="0 0 180 80" aria-hidden="true">
              <path d="M5 62 C30 34, 42 44, 55 28 S82 52, 96 38 S120 20, 135 32 S158 50, 175 16" />
            </svg>
          </article>
        </section>

        <section className={styles.bottomGrid}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Today&apos;s Consultations (Mock)</h2>
              <button type="button" className={styles.outlineButton}>View All</button>
            </div>
            <div className={styles.consultationList}>
              {todayConsultations.map((consultation) => (
                <div className={styles.consultationItem} key={consultation.id}>
                  <span className={`${styles.consultationAvatar} ${consultation.tone === "blue" ? styles.avatarBlue : styles.avatarSlate}`}>
                    {consultation.initials}
                  </span>
                  <div>
                    <p className={styles.consultationName}>{consultation.patientName}</p>
                    <p className={styles.consultationMeta}>
                      {consultation.time} &middot; {consultation.modality}
                    </p>
                  </div>
                  <span className={styles.upcomingPill}>{consultation.status ?? "Confirmed"}</span>
                </div>
              ))}
            </div>
            <button type="button" className={styles.linkFooter}>View all consultations &rarr;</button>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Recent Nutrition Tracking (Real)</h2>
              <button type="button" className={styles.outlineButton} onClick={() => onNavigate("/nutritionist/recent-logs")}>
                View All
              </button>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.mealTable}>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Tracking Date</th>
                    <th>Calories</th>
                    <th>Protein</th>
                    <th>Carbs</th>
                    <th>Fats</th>
                  </tr>
                </thead>
                <tbody>
                  {trackingRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className={styles.mealPatientCell}>
                          <span>{getInitials(row.patientName)}</span>
                          {row.patientName}
                        </div>
                      </td>
                      <td>{formatTrackingDate(row.tracking.date)}</td>
                      <td>{row.tracking.consumedMacros.calories} kcal</td>
                      <td>{row.tracking.consumedMacros.proteins}g</td>
                      <td>{row.tracking.consumedMacros.carbs}g</td>
                      <td>{row.tracking.consumedMacros.fats}g</td>
                    </tr>
                  ))}
                  {!trackingRows.length && (
                    <tr>
                      <td colSpan={6}>
                        <div className={styles.emptyTableState}>No nutrition tracking records found.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <button type="button" className={styles.linkFooter}>View all meal logs &rarr;</button>
          </article>
        </section>
      </div>
    </SharedLayout>
  );
}
