import { useEffect, useState, type ReactNode } from "react";
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
import { PatientIotAlertsTable } from "@/modules/patients/presentation/components/PatientIotAlertsTable";
import {
  getStoredNutritionistProfile,
  storeNutritionistProfile,
} from "@/modules/nutritionist/infrastructure/storage/nutritionistProfileStorage";
import type { ProfessionalProfile } from "@/modules/nutritionist/domain/models/ProfessionalProfile";
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
  id?: string | number;
  userId?: string | number;
  fullName?: string;
}

interface NutritionTrackingRow {
  id: string;
  patientName: string;
  tracking: TrackingResource;
}

interface DashboardLibraryItem {
  id?: number | string;
}

interface DashboardMetrics {
  myPatients: number;
  pendingRequests: number;
  recipes: number;
  mealPlans: number;
}

function getSessionUser(): SessionUser | null {
  const session = JSON.parse(localStorage.getItem("session") || "null");
  return session?.user ?? null;
}

function getFirstName(name: string) {
  const firstName = name.trim().split(/\s+/)[0] ?? "";
  return firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1) : "Nutritionist";
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function getNutritionistProfileByUser(user: SessionUser | null) {
  if (!user?.id) return null;

  const storedProfile = getStoredNutritionistProfile(String(user.id));
  if (storedProfile?.id) return storedProfile;

  const response = await fetch(apiUrl(`/api/v1/nutritionists/by-user?userId=${encodeURIComponent(String(user.id))}`), {
    headers: authHeaders(),
  });

  if (!response.ok) return null;

  const profile = (await response.json()) as ProfessionalProfile;
  storeNutritionistProfile(profile);
  return profile;
}

async function fetchDashboardJson<T>(path: string): Promise<T> {
  const response = await fetch(apiUrl(path), {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function getNutritionistDisplayName(user: SessionUser | null) {
  if (!user?.id) return "Nutritionist";

  const storedProfile = getStoredNutritionistProfile(String(user.id));
  if (storedProfile?.fullName) return getFirstName(storedProfile.fullName);

  try {
    const response = await fetch(apiUrl(`/api/v1/nutritionists/by-user?userId=${encodeURIComponent(String(user.id))}`), {
      headers: authHeaders(),
    });
    if (response.ok) {
      const profile = (await response.json()) as NutritionistProfilePreview;
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

function isPendingRelation(relation: { accepted?: boolean; status?: string }) {
  if (typeof relation.status === "string") {
    return relation.status.trim().toUpperCase() === "PENDING";
  }

  return relation.accepted === false;
}

function UsersMetricIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 20v-1.2a3.8 3.8 0 0 0-3.8-3.8H7.8A3.8 3.8 0 0 0 4 18.8V20" />
      <circle cx="10" cy="7" r="3.4" />
      <path d="M19.5 20v-1a3.2 3.2 0 0 0-2.4-3.1" />
      <path d="M16.5 4.4a3.2 3.2 0 0 1 0 5.9" />
    </svg>
  );
}

function PendingMetricIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 20v-1.2a3.8 3.8 0 0 0-3.8-3.8H7.8A3.8 3.8 0 0 0 4 18.8V20" />
      <circle cx="10" cy="7" r="3.4" />
      <path d="M18 8v6" />
      <path d="M15 11h6" />
    </svg>
  );
}

function RecipesMetricIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7h10" />
      <path d="M7 12h10" />
      <path d="M7 17h7" />
      <path d="M5 3h14a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function MealPlansMetricIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 4h6" />
      <path d="M9 2h6v4H9z" />
      <path d="M7 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1" />
      <path d="M8 11h8" />
      <path d="M8 16h6" />
    </svg>
  );
}

function MiniSparkline({ tone }: { tone: "green" | "purple" | "blue" | "amber" }) {
  return (
    <svg className={`${styles.metricSparkline} ${styles[`metricSparkline${tone}`]}`} viewBox="0 0 96 38" aria-hidden="true">
      <path d="M3 31 C13 18, 20 27, 29 17 S43 24, 51 13 S65 20, 73 10 S84 15, 93 5" />
    </svg>
  );
}

function MetricCard({
  title,
  value,
  suffix,
  detail,
  action,
  tone,
  icon,
  onClick,
}: {
  title: string;
  value: number;
  suffix: string;
  detail: string;
  action: string;
  tone: "green" | "purple" | "blue" | "amber";
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <article className={`${styles.metricCard} ${styles[`metricCard${tone}`]}`}>
      <div className={styles.metricHeader}>
        <span className={`${styles.metricIcon} ${styles[`metricIcon${tone}`]}`}>{icon}</span>
        <h2>{title}</h2>
      </div>
      <div className={styles.metricBody}>
        <div>
          <strong>{value}</strong>
          <p>{suffix}</p>
          <span>{detail}</span>
        </div>
        <MiniSparkline tone={tone} />
      </div>
      <button type="button" onClick={onClick}>
        {action}
        <span aria-hidden="true">→</span>
      </button>
    </article>
  );
}

export function DashboardPage({ currentPath, onNavigate }: DashboardPageProps) {
  const [activePatients, setActivePatients] = useState(0);
  const [nutritionistName, setNutritionistName] = useState("Nutritionist");
  const [trackingRows, setTrackingRows] = useState<NutritionTrackingRow[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    myPatients: 0,
    pendingRequests: 0,
    recipes: 0,
    mealPlans: 0,
  });

  useEffect(() => {
    let mounted = true;
    const sessionUser = getSessionUser();

    const loadDashboardData = async () => {
      try {
        const profile = await getNutritionistProfileByUser(sessionUser);
        const nutritionistId = profile?.id ?? sessionUser?.id ?? "";

        const [relations, displayName, users] = await Promise.all([
          getNutritionistPatientRelations(nutritionistId),
          getNutritionistDisplayName(sessionUser),
          getPatientUserSummaries(),
        ]);
        const acceptedRelations = relations.filter((relation) => relation.accepted);
        const [recipes, mealPlans] = await Promise.all([
          sessionUser?.id
            ? fetchDashboardJson<DashboardLibraryItem[]>(`/api/v1/recipes/nutritionists/${encodeURIComponent(String(sessionUser.id))}/templates`).catch(() => [])
            : Promise.resolve([]),
          sessionUser?.id
            ? fetchDashboardJson<DashboardLibraryItem[]>(`/api/v1/meal-plan/nutritionists/${encodeURIComponent(String(sessionUser.id))}`).catch(() => [])
            : Promise.resolve([]),
        ]);
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
          setMetrics({
            myPatients: acceptedRelations.length,
            pendingRequests: relations.filter(isPendingRelation).length,
            recipes: Array.isArray(recipes) ? recipes.length : 0,
            mealPlans: Array.isArray(mealPlans) ? mealPlans.length : 0,
          });
          setNutritionistName(displayName);
          setTrackingRows(rows.filter((row): row is NutritionTrackingRow => Boolean(row)).slice(0, 4));
        }
      } catch {
        const displayName = await getNutritionistDisplayName(sessionUser);
        if (mounted) {
          setActivePatients(0);
          setMetrics({
            myPatients: 0,
            pendingRequests: 0,
            recipes: 0,
            mealPlans: 0,
          });
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

        <section className={styles.metricsGrid}>
          <MetricCard
            title="My Patients"
            value={metrics.myPatients}
            suffix="Patients"
            detail="+3 this month"
            action="View Patients"
            tone="green"
            icon={<UsersMetricIcon />}
            onClick={() => onNavigate("/nutritionist/patients/directory")}
          />
          <MetricCard
            title="Pending Requests"
            value={metrics.pendingRequests}
            suffix="Requests"
            detail="Needs your approval"
            action="Review Requests"
            tone="purple"
            icon={<PendingMetricIcon />}
            onClick={() => onNavigate("/nutritionist/patients/request")}
          />
          <MetricCard
            title="Recipes Library"
            value={metrics.recipes}
            suffix="Recipes"
            detail="+2 this week"
            action="Manage Recipes"
            tone="blue"
            icon={<RecipesMetricIcon />}
            onClick={() => onNavigate("/nutritionist/recipes")}
          />
          <MetricCard
            title="Meal Plans Library"
            value={metrics.mealPlans}
            suffix="Meal Plans"
            detail="5 active templates"
            action="Manage Meal Plans"
            tone="amber"
            icon={<MealPlansMetricIcon />}
            onClick={() => onNavigate("/nutritionist/meal-plans")}
          />
        </section>

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

        <PatientIotAlertsTable onNavigate={onNavigate} />
      </div>
    </SharedLayout>
  );
}
