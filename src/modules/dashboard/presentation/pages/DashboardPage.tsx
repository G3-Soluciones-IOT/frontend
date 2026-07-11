import { useEffect, useState, type ReactNode } from "react";
import { apiUrl } from "@/app/config/env";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import { useI18n } from "@/shared/i18n/useI18n";
import type { TranslationKey } from "@/shared/i18n/translations";
import {
  getNutritionistPatientRelations,
  getPatientUserSummaries,
  type MacroResource,
  type NutritionistPatientRelation,
} from "@/modules/patients/infrastructure/api/nutritionistPatients.api";
import { PatientIotAlertsTable } from "@/modules/patients/presentation/components/PatientIotAlertsTable";
import {
  getStoredNutritionistProfile,
  storeNutritionistProfile,
} from "@/modules/nutritionist/infrastructure/storage/nutritionistProfileStorage";
import type { ProfessionalProfile } from "@/modules/nutritionist/domain/models/ProfessionalProfile";
import { AlertIcon, SparklesIcon, TrendIcon } from "../components/DashboardIcons";
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
  tracking: {
    id: number | string;
    date: string;
    consumedMacros: MacroResource;
  };
}

interface PatientProfilePreview {
  id?: number | string;
  name?: string;
  fullName?: string;
  username?: string;
}

interface AttentionPatient {
  id: string;
  patientName: string;
  initials: string;
  lowestMetric: string;
  lowestPercentage: number;
  metrics: Array<{
    label: string;
    percentage: number;
  }>;
}

interface RecentPatientRequest {
  id: string;
  patientName: string;
  initials: string;
  requestedAt?: string;
  serviceType: string;
  accepted: boolean;
}

interface AiHealthSummary {
  text: string;
  onTrackPercentage: number;
  attentionCount: number;
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

async function getDashboardMealPlans(nutritionistId?: number | string, userId?: number | string) {
  if (nutritionistId) {
    const mealPlans = await fetchDashboardJson<DashboardLibraryItem[]>(
      `/api/v1/meal-plan/nutritionists/${encodeURIComponent(String(nutritionistId))}`,
    ).catch(() => null);

    if (Array.isArray(mealPlans)) return mealPlans;
  }

  if (userId && String(userId) !== String(nutritionistId ?? "")) {
    const mealPlans = await fetchDashboardJson<DashboardLibraryItem[]>(
      `/api/v1/meal-plan/nutritionists/${encodeURIComponent(String(userId))}`,
    ).catch(() => null);

    if (Array.isArray(mealPlans)) return mealPlans;
  }

  return fetchDashboardJson<DashboardLibraryItem[]>("/api/v1/meal-plan").catch(() => []);
}

function firstItem<T>(data: T | T[]) {
  return Array.isArray(data) ? data[0] ?? null : data;
}

async function getPatientProfileName(userId: number | string, fallbackName: string) {
  const profileData = await fetchDashboardJson<PatientProfilePreview | PatientProfilePreview[]>(
    `/api/v1/profiles/by-user/${encodeURIComponent(String(userId))}`,
  )
    .catch(() =>
      fetchDashboardJson<PatientProfilePreview | PatientProfilePreview[]>(
        `/api/v1/profiles/${encodeURIComponent(String(userId))}`,
      ),
    )
    .catch(() => null);

  const profile = firstItem(profileData);
  return profile?.name || profile?.fullName || profile?.username || fallbackName;
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

function formatShortDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
  }).format(date);
}

function requestTime(request: RecentPatientRequest) {
  const time = request.requestedAt ? new Date(request.requestedAt).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
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

function trackingTime(row: NutritionTrackingRow) {
  const time = new Date(row.tracking.date).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function numericSeed(value: number | string) {
  return String(value)
    .split("")
    .reduce((seed, character) => seed + character.charCodeAt(0), 0);
}

function buildMockTracking(patientUserId: number | string): NutritionTrackingRow["tracking"] {
  const seed = numericSeed(patientUserId);
  const date = new Date();
  date.setDate(date.getDate() - (seed % 5));

  return {
    id: `mock-tracking-${patientUserId}`,
    date: date.toISOString(),
    consumedMacros: {
      id: seed,
      calories: 1450 + (seed % 520),
      proteins: 72 + (seed % 38),
      carbs: 150 + (seed % 70),
      fats: 42 + (seed % 24),
    },
  };
}

function isPendingRelation(relation: { accepted?: boolean; status?: string }) {
  if (typeof relation.status === "string") {
    return relation.status.trim().toUpperCase() === "PENDING";
  }

  return relation.accepted === false;
}

function mockAttentionPercentage(patientId: number | string, metricIndex: number) {
  const seed = String(patientId)
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  return 45 + ((seed + metricIndex * 17) % 51);
}

function buildAttentionPatient(patientName: string, patientId: number | string) {
  const metrics = [
    { label: "Calories", percentage: mockAttentionPercentage(patientId, 0) },
    { label: "Protein", percentage: mockAttentionPercentage(patientId, 1) },
    { label: "Carbs", percentage: mockAttentionPercentage(patientId, 2) },
    { label: "Fats", percentage: mockAttentionPercentage(patientId, 3) },
  ];
  const lowest = metrics.reduce((currentLowest, metric) =>
    metric.percentage < currentLowest.percentage ? metric : currentLowest,
  );

  if (lowest.percentage >= 70) return null;

  return {
    id: String(patientId),
    patientName,
    initials: getInitials(patientName),
    lowestMetric: lowest.label,
    lowestPercentage: lowest.percentage,
    metrics,
  } satisfies AttentionPatient;
}

function fillTemplate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (nextText, [key, value]) => nextText.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function metricLabel(metric: string, t: (key: TranslationKey) => string) {
  const labels: Record<string, TranslationKey> = {
    Calories: "dashboard.metric.calories",
    Protein: "dashboard.metric.protein",
    Carbs: "dashboard.metric.carbs",
    Fats: "dashboard.metric.fats",
  };

  return t(labels[metric] ?? "dashboard.metric.calories");
}

function buildAiHealthSummary(totalPatients: number, attentionPatients: AttentionPatient[], t: (key: TranslationKey) => string): AiHealthSummary {
  if (totalPatients === 0) {
    return {
      text: t("dashboard.ai.empty"),
      onTrackPercentage: 0,
      attentionCount: 0,
    };
  }

  const attentionCount = attentionPatients.length;
  const onTrackCount = Math.max(totalPatients - attentionCount, 0);
  const onTrackPercentage = Math.round((onTrackCount / totalPatients) * 100);
  const mostUrgent = attentionPatients[0];

  if (!mostUrgent) {
    return {
      text: fillTemplate(t("dashboard.ai.allOnTrack"), {
        totalPatients,
      }),
      onTrackPercentage,
      attentionCount,
    };
  }

  return {
    text: fillTemplate(t("dashboard.ai.needsReview"), {
      totalPatients,
      onTrackCount,
      patientName: mostUrgent.patientName,
      metric: metricLabel(mostUrgent.lowestMetric, t).toLowerCase(),
      percentage: mostUrgent.lowestPercentage,
    }),
    onTrackPercentage,
    attentionCount,
  };
}

async function buildRecentRequest(relation: NutritionistPatientRelation, fallbackName: string) {
  const patientName = await getPatientProfileName(relation.patientUserId, fallbackName);

  return {
    id: String(relation.id),
    patientName,
    initials: getInitials(patientName),
    requestedAt: relation.requestedAt,
    serviceType: relation.serviceType,
    accepted: relation.accepted,
  } satisfies RecentPatientRequest;
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
  const { t } = useI18n();
  const [nutritionistName, setNutritionistName] = useState("Nutritionist");
  const [trackingRows, setTrackingRows] = useState<NutritionTrackingRow[]>([]);
  const [attentionPatients, setAttentionPatients] = useState<AttentionPatient[]>([]);
  const [recentRequests, setRecentRequests] = useState<RecentPatientRequest[]>([]);
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
          getDashboardMealPlans(profile?.id, sessionUser?.id),
        ]);
        const rows = await Promise.all(
          acceptedRelations.map(async (relation) => {
            const patient = users.find((user) => String(user.id) === String(relation.patientUserId));
            const fallbackName = patient?.fullName || patient?.username || `Patient #${relation.patientUserId}`;
            const patientName = await getPatientProfileName(relation.patientUserId, fallbackName);
            const tracking = buildMockTracking(relation.patientUserId);

            return {
              id: String(tracking.id),
              patientName,
              tracking,
            };
          })
        );
        const attentionRows = await Promise.all(
          acceptedRelations.map(async (relation) => {
            const patient = users.find((user) => String(user.id) === String(relation.patientUserId));
            const fallbackName = patient?.fullName || patient?.username || `Patient #${relation.patientUserId}`;
            const patientName = await getPatientProfileName(relation.patientUserId, fallbackName).catch(() => fallbackName);
            return buildAttentionPatient(patientName, relation.patientUserId);
          })
        );
        const requestRows = await Promise.all(
          relations.map(async (relation) => {
            const patient = users.find((user) => String(user.id) === String(relation.patientUserId));
            const fallbackName = patient?.fullName || patient?.username || `Patient #${relation.patientUserId}`;
            return buildRecentRequest(relation, fallbackName);
          }),
        );

        if (mounted) {
          const sortedAttentionRows = attentionRows
            .filter((row): row is AttentionPatient => Boolean(row))
            .sort((first, second) => first.lowestPercentage - second.lowestPercentage)
            .slice(0, 3);

          setMetrics({
            myPatients: acceptedRelations.length,
            pendingRequests: relations.filter(isPendingRelation).length,
            recipes: Array.isArray(recipes) ? recipes.length : 0,
            mealPlans: Array.isArray(mealPlans) ? mealPlans.length : 0,
          });
          setNutritionistName(displayName);
          setTrackingRows(
            rows
              .filter((row): row is NutritionTrackingRow => Boolean(row))
              .sort((first, second) => trackingTime(second) - trackingTime(first))
              .slice(0, 4),
          );
          setAttentionPatients(sortedAttentionRows);
          setRecentRequests(
            requestRows
              .sort((first, second) => requestTime(second) - requestTime(first))
              .slice(0, 4),
          );
        }
      } catch {
        const displayName = await getNutritionistDisplayName(sessionUser);
        if (mounted) {
          setMetrics({
            myPatients: 0,
            pendingRequests: 0,
            recipes: 0,
            mealPlans: 0,
          });
          setNutritionistName(displayName);
          setTrackingRows([]);
          setAttentionPatients([]);
          setRecentRequests([]);
        }
      }
    };

    loadDashboardData();

    return () => {
      mounted = false;
    };
  }, []);

  const aiHealthSummary = buildAiHealthSummary(metrics.myPatients, attentionPatients, t);
  const dashboardGreeting = fillTemplate(t("dashboard.greeting"), { name: nutritionistName });

  return (
    <SharedLayout
      title={t("dashboard.title")}
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={useNavigation()}
      showPageTitle={false}
      topbarTabs={[
        { label: t("dashboard.tab.overview"), href: "/nutritionist", active: currentPath === "/nutritionist" },
        { label: t("dashboard.tab.recentLogs"), href: "/nutritionist/recent-logs", active: currentPath === "/nutritionist/recent-logs" },
      ]}
    >
      <div className={styles.dashboard}>
        <header className={styles.dashboardHero}>
          <h1>{dashboardGreeting} <span aria-hidden="true">{"\uD83D\uDC4B"}</span></h1>
          <p>{t("dashboard.hero.description")}</p>
        </header>

        <section className={styles.metricsGrid}>
          <MetricCard
            title={t("dashboard.metrics.patients.title")}
            value={metrics.myPatients}
            suffix={t("dashboard.metrics.patients.suffix")}
            detail={t("dashboard.metrics.patients.detail")}
            action={t("dashboard.metrics.patients.action")}
            tone="green"
            icon={<UsersMetricIcon />}
            onClick={() => onNavigate("/nutritionist/patients/directory")}
          />
          <MetricCard
            title={t("dashboard.metrics.pending.title")}
            value={metrics.pendingRequests}
            suffix={t("dashboard.metrics.pending.suffix")}
            detail={t("dashboard.metrics.pending.detail")}
            action={t("dashboard.metrics.pending.action")}
            tone="purple"
            icon={<PendingMetricIcon />}
            onClick={() => onNavigate("/nutritionist/patients/request")}
          />
          <MetricCard
            title={t("dashboard.metrics.recipes.title")}
            value={metrics.recipes}
            suffix={t("dashboard.metrics.recipes.suffix")}
            detail={t("dashboard.metrics.recipes.detail")}
            action={t("dashboard.metrics.recipes.action")}
            tone="blue"
            icon={<RecipesMetricIcon />}
            onClick={() => onNavigate("/nutritionist/recipes")}
          />
          <MetricCard
            title={t("dashboard.metrics.mealPlans.title")}
            value={metrics.mealPlans}
            suffix={t("dashboard.metrics.mealPlans.suffix")}
            detail={t("dashboard.metrics.mealPlans.detail")}
            action={t("dashboard.metrics.mealPlans.action")}
            tone="amber"
            icon={<MealPlansMetricIcon />}
            onClick={() => onNavigate("/nutritionist/meal-plans")}
          />
        </section>

        <section className={styles.dashboardColumns}>
          <div className={styles.dashboardColumn}>
            <article className={`${styles.panel} ${styles.recentTrackingPanel}`}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>{t("dashboard.tracking.title")}</h2>
                <button type="button" className={styles.outlineButton} onClick={() => onNavigate("/nutritionist/patients/directory")}>
                  {t("dashboard.action.viewAll")}
                </button>
              </div>
              <div className={styles.tableWrap}>
                <table className={`${styles.mealTable} ${styles.recentTrackingTable}`}>
                  <thead>
                    <tr>
                      <th>{t("dashboard.table.patient")}</th>
                      <th>{t("dashboard.table.trackingDate")}</th>
                      <th>{t("dashboard.metric.calories")}</th>
                      <th>{t("dashboard.metric.protein")}</th>
                      <th>{t("dashboard.metric.carbs")}</th>
                      <th>{t("dashboard.metric.fats")}</th>
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
                          <div className={styles.emptyTableState}>{t("dashboard.tracking.empty")}</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <button type="button" className={styles.linkFooter} onClick={() => onNavigate("/nutritionist/patients/directory")}>
              {t("dashboard.action.viewAllPatients")} &rarr;
            </button>
          </article>

            <PatientIotAlertsTable onNavigate={onNavigate} />
          </div>

          <div className={styles.dashboardColumn}>
            <article className={styles.attentionPanel}>
              <div className={styles.attentionHeader}>
                <span className={styles.attentionIcon}>
                  <AlertIcon />
                </span>
                <div>
                  <h2>{t("dashboard.attention.title")}</h2>
                  <p>{t("dashboard.attention.description")}</p>
                </div>
              </div>

              <div className={styles.attentionSummary}>
                <strong>{attentionPatients.length}</strong>
                <span>{t("dashboard.attention.belowThreshold")}</span>
              </div>

              <div className={styles.attentionList}>
                {attentionPatients.map((patient) => (
                  <article key={patient.id} className={styles.attentionItem}>
                    <span className={styles.attentionAvatar}>{patient.initials}</span>
                    <div className={styles.attentionBody}>
                      <div className={styles.attentionItemHeader}>
                        <strong>{patient.patientName}</strong>
                        <em>{patient.lowestPercentage}%</em>
                      </div>
                      <p>{fillTemplate(t("dashboard.attention.metricNeedsReview"), { metric: metricLabel(patient.lowestMetric, t) })}</p>
                      <div className={styles.attentionProgress}>
                        <span style={{ width: `${patient.lowestPercentage}%` }} />
                      </div>
                    </div>
                  </article>
                ))}

                {!attentionPatients.length && (
                  <div className={styles.attentionEmpty}>
                  <strong>{t("dashboard.attention.empty.title")}</strong>
                  <span>{t("dashboard.attention.empty.description")}</span>
                  </div>
                )}
              </div>

              <button type="button" className={styles.attentionAction} onClick={() => onNavigate("/nutritionist/patients/directory")}>
                {t("dashboard.action.reviewPatients")}
                <span aria-hidden="true">&rarr;</span>
              </button>
            </article>

            <article className={styles.aiSummaryCard}>
              <div className={styles.cardTitleRow}>
                <h2>
                  <SparklesIcon />
                  {t("dashboard.ai.title")}
                </h2>
                <span className={styles.mockPill}>{t("dashboard.ai.powered")}</span>
              </div>
              <p>{aiHealthSummary.text}</p>
              <div className={styles.tagRow}>
                <span className={`${styles.tag} ${styles.tagGreen}`}>
                  <TrendIcon />
                  {aiHealthSummary.onTrackPercentage}% {t("dashboard.ai.onTrack")}
                </span>
                <span className={`${styles.tag} ${styles.tagRed}`}>
                  <AlertIcon />
                  {aiHealthSummary.attentionCount} {t("dashboard.ai.needAttention")}
                </span>
              </div>
            </article>

            <article className={`${styles.panel} ${styles.recentRequestsPanel}`}>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>{t("dashboard.requests.title")}</h2>
                <button type="button" className={styles.outlineButton} onClick={() => onNavigate("/nutritionist/patients/request")}>
                  {t("dashboard.action.viewAll")}
                </button>
              </div>
              <div className={styles.requestPreviewList}>
                {recentRequests.map((request) => (
                  <article className={styles.requestPreviewItem} key={request.id}>
                    <span className={styles.requestPreviewAvatar}>{request.initials}</span>
                    <div className={styles.requestPreviewBody}>
                      <strong>{request.patientName}</strong>
                      <span>{t("dashboard.requests.requested")}: {formatShortDate(request.requestedAt)}</span>
                      <small>{request.serviceType.replaceAll("_", " ")}</small>
                    </div>
                    <span className={request.accepted ? styles.requestStatusAccepted : styles.requestStatusPending}>
                      {request.accepted ? t("dashboard.status.accepted") : t("dashboard.status.pending")}
                    </span>
                  </article>
                ))}
                {!recentRequests.length && (
                  <div className={styles.emptyTableState}>{t("dashboard.requests.empty")}</div>
                )}
              </div>
            </article>
          </div>
        </section>

      </div>
    </SharedLayout>
  );
}
