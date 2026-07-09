import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL, apiUrl } from "@/app/config/env";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import {
  getNutritionistPatientRelations,
  getTrackingProgressByUser,
  type MacroResource,
  type TrackingProgressResource,
} from "@/modules/patients/infrastructure/api/nutritionistPatients.api";
import {
  getStoredNutritionistProfile,
  storeNutritionistProfile,
} from "@/modules/nutritionist/infrastructure/storage/nutritionistProfileStorage";
import type { ProfessionalProfile } from "@/modules/nutritionist/domain/models/ProfessionalProfile";
import styles from "./AnalyticsPage.module.css";

interface AnalyticsPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

interface SessionUser {
  id: number | string;
}

interface PatientProfilePreview {
  name?: string;
  fullName?: string;
  username?: string;
}

interface LibraryItem {
  id?: number | string;
  category?: string;
  tags?: string[];
}

type ProgressResponse = TrackingProgressResource | {
  consumed?: MacroResource;
  target?: MacroResource;
};

interface PatientProgressRow {
  id: string;
  patientName: string;
  completion: number;
}

interface AnalyticsState {
  totalPatients: number;
  averageCompletion: number;
  recipesCreated: number;
  mealPlanCategories: Array<{ label: string; count: number }>;
  macroDistribution: Array<{ label: string; value: number }>;
  ranking: PatientProgressRow[];
}

const emptyState: AnalyticsState = {
  totalPatients: 0,
  averageCompletion: 0,
  recipesCreated: 0,
  mealPlanCategories: [],
  macroDistribution: [
    { label: "Calories", value: 0 },
    { label: "Protein", value: 0 },
    { label: "Carbs", value: 0 },
    { label: "Fats", value: 0 },
  ],
  ranking: [],
};

function getSessionUser(): SessionUser | null {
  const session = JSON.parse(localStorage.getItem("session") || "null");
  return session?.user ?? null;
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(apiUrl(path), {
    headers: authHeaders(),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

async function getNutritionistProfileByUser(userId?: number | string) {
  if (!userId) return null;

  const storedProfile = getStoredNutritionistProfile(String(userId));
  if (storedProfile?.id) return storedProfile;

  if (API_BASE_URL.includes("localhost:3001")) {
    const profiles = await fetchJson<ProfessionalProfile[]>(`/nutritionists?userId=${encodeURIComponent(String(userId))}`).catch(() => []);
    return profiles[0] ?? null;
  }

  const profile = await fetchJson<ProfessionalProfile>(`/api/v1/nutritionists/by-user?userId=${encodeURIComponent(String(userId))}`);
  storeNutritionistProfile(profile);
  return profile;
}

async function getProfileName(userId: number | string) {
  if (API_BASE_URL.includes("localhost:3001")) {
    const users = await fetchJson<Array<PatientProfilePreview & { id: number | string }>>("/users").catch(() => []);
    const user = users.find((item) => String(item.id) === String(userId));
    return user?.fullName || user?.name || user?.username || `Patient #${userId}`;
  }

  const data = await fetchJson<PatientProfilePreview | PatientProfilePreview[]>(`/api/v1/profiles/${encodeURIComponent(String(userId))}`);
  const profile = Array.isArray(data) ? data[0] : data;
  return profile?.name || profile?.fullName || profile?.username || `Patient #${userId}`;
}

async function getRecipes(userId?: number | string) {
  if (!userId) return [] as LibraryItem[];
  if (API_BASE_URL.includes("localhost:3001")) {
    return fetchJson<LibraryItem[]>(`/recipes?createdByNutritionistId=${encodeURIComponent(String(userId))}`).catch(() => []);
  }
  return fetchJson<LibraryItem[]>(`/api/v1/recipes/nutritionists/${encodeURIComponent(String(userId))}/templates`).catch(() => []);
}

async function getMealPlans(userId?: number | string) {
  if (!userId) return [] as LibraryItem[];
  if (API_BASE_URL.includes("localhost:3001")) {
    return fetchJson<LibraryItem[]>(`/mealPlans?nutritionistUserId=${encodeURIComponent(String(userId))}`).catch(() => []);
  }
  return fetchJson<LibraryItem[]>(`/api/v1/meal-plan/nutritionists/${encodeURIComponent(String(userId))}`).catch(() => []);
}

function metricPercent(consumed?: number, target?: number) {
  if (!target) return 0;
  return Math.max(0, Math.min(100, Math.round(((consumed ?? 0) / target) * 100)));
}

function progressMetrics(progress: ProgressResponse) {
  const consumed = "consumed" in progress ? progress.consumed : undefined;
  const target = "target" in progress ? progress.target : undefined;
  const normalized = "calories" in progress ? progress : null;

  return [
    { label: "Calories", value: normalized?.calories?.percentage ?? metricPercent(consumed?.calories, target?.calories) },
    { label: "Protein", value: normalized?.proteins?.percentage ?? metricPercent(consumed?.proteins, target?.proteins) },
    { label: "Carbs", value: normalized?.carbs?.percentage ?? metricPercent(consumed?.carbs, target?.carbs) },
    { label: "Fats", value: normalized?.fats?.percentage ?? metricPercent(consumed?.fats, target?.fats) },
  ];
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function categoryLabel(plan: LibraryItem) {
  const raw = plan.category || plan.tags?.[0] || "Uncategorized";
  return raw
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function AnalyticsPage({ currentPath, onNavigate }: AnalyticsPageProps) {
  const [state, setState] = useState<AnalyticsState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadAnalytics() {
      const sessionUser = getSessionUser();
      setLoading(true);
      setError(null);

      try {
        const profile = await getNutritionistProfileByUser(sessionUser?.id);
        const nutritionistId = profile?.id ?? sessionUser?.id ?? "";

        const [relations, recipes, mealPlans] = await Promise.all([
          getNutritionistPatientRelations(nutritionistId),
          getRecipes(sessionUser?.id),
          getMealPlans(sessionUser?.id),
        ]);
        const accepted = relations.filter((relation) => relation.accepted);
        const patientProgress = await Promise.all(
          accepted.map(async (relation) => {
            try {
              const progress = await getTrackingProgressByUser(relation.patientUserId);
              if (!progress) return null;
              const metrics = progressMetrics(progress as ProgressResponse);
              const patientName = await getProfileName(relation.patientUserId).catch(() => `Patient #${relation.patientUserId}`);

              return {
                id: String(relation.patientUserId),
                patientName,
                completion: average(metrics.map((metric) => metric.value)),
                metrics,
              };
            } catch {
              return null;
            }
          }),
        );

        const validProgress = patientProgress.filter((item): item is NonNullable<typeof item> => Boolean(item));
        const allMetrics = validProgress.flatMap((item) => item.metrics);
        const macroDistribution = ["Calories", "Protein", "Carbs", "Fats"].map((label) => ({
          label,
          value: average(allMetrics.filter((metric) => metric.label === label).map((metric) => metric.value)),
        }));
        const categoryCounts = mealPlans.reduce<Record<string, number>>((counts, plan) => {
          const label = categoryLabel(plan);
          counts[label] = (counts[label] ?? 0) + 1;
          return counts;
        }, {});

        if (!mounted) return;
        setState({
          totalPatients: accepted.length,
          averageCompletion: average(validProgress.map((item) => item.completion)),
          recipesCreated: recipes.length,
          mealPlanCategories: Object.entries(categoryCounts).map(([label, count]) => ({ label, count })),
          macroDistribution,
          ranking: validProgress
            .map(({ id, patientName, completion }) => ({ id, patientName, completion }))
            .sort((first, second) => second.completion - first.completion)
            .slice(0, 6),
        });
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load analytics.");
        setState(emptyState);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAnalytics();

    return () => {
      mounted = false;
    };
  }, []);

  const hydrationWeek = useMemo(() => [
    { day: "Monday", value: 2.1 },
    { day: "Tuesday", value: 2.5 },
    { day: "Wednesday", value: 1.8 },
    { day: "Thursday", value: 2.3 },
    { day: "Friday", value: 2.0 },
  ], []);

  return (
    <SharedLayout
      title="Analytics"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={useNavigation()}
      breadcrumbs={["Analytics"]}
      showPageTitle={false}
    >
      <div className={styles.analytics}>
        <header className={styles.hero}>
          <h1>Analytics</h1>
          <p>Track patient progress, nutrition performance, hydration signals, and content creation.</p>
        </header>

        {loading && <p className={styles.stateText}>Loading analytics...</p>}
        {error && <p className={styles.errorText}>{error}</p>}

        <section className={styles.metricGrid}>
          <MetricCard title="Total Patients" value={String(state.totalPatients)} detail="Accepted patients" />
          <MetricCard title="Average Goal Completion" value={`${state.averageCompletion}%`} detail="Average macro compliance" />
          <MetricCard title="Average Water Intake (No JSON)" value="2.1 L" detail="IoT hydration summary pending" />
          <MetricCard title="Recipes Created" value={String(state.recipesCreated)} detail="Nutritionist templates" />
        </section>

        <section className={styles.contentGrid}>
          <ChartCard title="Macronutrient Distribution">
            {state.macroDistribution.map((metric) => (
              <BarRow key={metric.label} label={metric.label} value={metric.value} suffix="%" />
            ))}
          </ChartCard>

          <ChartCard title="Hydration Analytics (No JSON)">
            {hydrationWeek.map((day) => (
              <BarRow key={day.day} label={day.day} value={Math.round((day.value / 3) * 100)} display={`${day.value}L`} />
            ))}
          </ChartCard>

          <ChartCard title="Meal Plans Created">
            {state.mealPlanCategories.map((category) => (
              <CountRow key={category.label} label={category.label} count={category.count} />
            ))}
            {!state.mealPlanCategories.length && <p className={styles.emptyText}>No meal plans found.</p>}
          </ChartCard>

          <ChartCard title="Patients Progress Ranking">
            <div className={styles.rankingList}>
              {state.ranking.map((patient) => (
                <div key={patient.id} className={styles.rankingRow}>
                  <strong>{patient.patientName}</strong>
                  <span>{patient.completion}%</span>
                </div>
              ))}
              {!state.ranking.length && <p className={styles.emptyText}>No progress data found.</p>}
            </div>
          </ChartCard>

          <ChartCard title="Food Scale Trend (IoT) (No JSON)">
            <div className={styles.foodScaleGrid}>
              <CountRow label="Breakfast" count={350} suffix="g" />
              <CountRow label="Lunch" count={520} suffix="g" />
              <CountRow label="Dinner" count={420} suffix="g" />
            </div>
          </ChartCard>
        </section>
      </div>
    </SharedLayout>
  );
}

function MetricCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <article className={styles.metricCard}>
      <span>{title}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className={styles.chartCard}>
      <h2>{title}</h2>
      {children}
    </article>
  );
}

function BarRow({ label, value, suffix = "", display }: { label: string; value: number; suffix?: string; display?: string }) {
  return (
    <div className={styles.barRow}>
      <div>
        <span>{label}</span>
        <strong>{display ?? `${value}${suffix}`}</strong>
      </div>
      <i><b style={{ width: `${Math.min(100, value)}%` }} /></i>
    </div>
  );
}

function CountRow({ label, count, suffix = "" }: { label: string; count: number; suffix?: string }) {
  return (
    <div className={styles.countRow}>
      <span>{label}</span>
      <strong>{count}{suffix}</strong>
    </div>
  );
}
