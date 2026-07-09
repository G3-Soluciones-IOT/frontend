import { useEffect, useState, type CSSProperties } from "react";
import { apiUrl } from "@/app/config/env";
import type { TrackingResource } from "../../../infrastructure/api/nutritionistPatients.api";
import styles from "../../pages/PatientsPages.module.css";

interface MacroValues {
  id?: number | string;
  calories?: number;
  carbs?: number;
  proteins?: number;
  fats?: number;
}

interface TrackingProgressApiResponse {
  consumed?: MacroValues;
  target?: MacroValues;
  calories?: { consumed?: number; target?: number; percentage?: number };
  carbs?: { consumed?: number; target?: number; percentage?: number };
  proteins?: { consumed?: number; target?: number; percentage?: number };
  fats?: { consumed?: number; target?: number; percentage?: number };
}

interface TrackingGoalApiResponse {
  id?: number | string;
  userId?: number | string;
  targetMacros?: MacroValues;
}

interface MealHistoryEntry {
  id: number | string;
  recipeId?: number | string;
  mealPlanType?: string;
  dayNumber?: number;
}

interface WaterToday {
  userId?: number | string;
  date?: string;
  totalWaterMl?: number;
}

interface WeeklyHydration {
  userId?: number | string;
  averageWaterMl?: number;
  daysBelowGoal?: number;
  bestDayMl?: number;
}

interface TrackingTabData {
  tracking?: TrackingResource;
  progress?: TrackingProgressApiResponse;
  goal?: TrackingGoalApiResponse;
  mealEntries: MealHistoryEntry[];
  waterToday?: WaterToday;
  weeklyHydration?: WeeklyHydration;
}

interface PatientTrackingTabProps {
  patientId: string;
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

function asArray<T>(data: T | T[]) {
  return Array.isArray(data) ? data : [data];
}

function numberOrZero(value?: number) {
  return Number.isFinite(value) ? Number(value) : 0;
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function percent(consumed?: number, target?: number, explicit?: number) {
  if (Number.isFinite(explicit)) return clampPercent(Math.round(Number(explicit)));
  if (!target) return 0;
  return clampPercent(Math.round((numberOrZero(consumed) / target) * 100));
}

function macroProgress(progress: TrackingProgressApiResponse | undefined, key: "calories" | "carbs" | "proteins" | "fats") {
  const fromNested = progress?.[key];
  const consumed = progress?.consumed?.[key] ?? fromNested?.consumed;
  const target = progress?.target?.[key] ?? fromNested?.target;
  return {
    consumed: numberOrZero(consumed),
    target: numberOrZero(target),
    percentage: percent(consumed, target, fromNested?.percentage),
  };
}

function dayLabel(day?: number) {
  const labels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  if (!day || day < 1) return "-";
  return labels[(day - 1) % 7] ?? `Day ${day}`;
}

export function PatientTrackingTab({ patientId }: PatientTrackingTabProps) {
  const [data, setData] = useState<TrackingTabData>({ mealEntries: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadTrackingTab = async () => {
      setLoading(true);
      setError(null);

      try {
        const [nextTracking, nextProgress, nextGoal, waterToday, weeklyHydration] = await Promise.all([
          fetchPatientDetailJson<TrackingResource>(`/api/v1/tracking/user/${patientId}`),
          fetchPatientDetailJson<TrackingProgressApiResponse>(`/api/v1/tracking/user/${patientId}/progress`).catch(() => undefined),
          fetchPatientDetailJson<TrackingGoalApiResponse>(`/api/v1/tracking-goals/user/${patientId}`).catch(() => undefined),
          fetchPatientDetailJson<WaterToday>(`/api/v1/water-intakes/user/${patientId}/today`).catch(() => undefined),
          fetchPatientDetailJson<WeeklyHydration>(`/api/v1/water-intakes/user/${patientId}/weekly-summary`).catch(() => undefined),
        ]);

        const mealEntries = nextTracking?.id
          ? asArray(
              await fetchPatientDetailJson<MealHistoryEntry | MealHistoryEntry[]>(
                `/api/v1/meal-plan-entries/tracking/${nextTracking.id}`,
              ).catch(() => nextTracking.mealPlanEntries as MealHistoryEntry[]),
            )
          : [];

        if (!mounted) return;
        setData({
          tracking: nextTracking,
          progress: nextProgress,
          goal: nextGoal,
          mealEntries,
          waterToday,
          weeklyHydration,
        });
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load tracking data.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadTrackingTab();

    return () => {
      mounted = false;
    };
  }, [patientId]);

  const goal = data.goal?.targetMacros;
  const calories = macroProgress(data.progress, "calories");
  const carbs = macroProgress(data.progress, "carbs");
  const proteins = macroProgress(data.progress, "proteins");
  const fats = macroProgress(data.progress, "fats");
  const waterMl = numberOrZero(data.waterToday?.totalWaterMl);
  const waterPercent = percent(waterMl, 2500);
  const weeklyAverageMl = numberOrZero(data.weeklyHydration?.averageWaterMl);
  const weeklyBestMl = numberOrZero(data.weeklyHydration?.bestDayMl);
  const weeklyBars = [72, 58, 82, 64, 49, 67, 76];
  const nutritionMetrics = [
    {
      label: "Calories",
      consumed: calories.consumed,
      target: calories.target,
      percentage: calories.percentage,
      unit: "kcal",
      tone: "green",
      icon: "flame",
    },
    {
      label: "Protein",
      consumed: proteins.consumed,
      target: proteins.target,
      percentage: proteins.percentage,
      unit: "g",
      tone: "blue",
      icon: "target",
    },
    {
      label: "Carbs",
      consumed: carbs.consumed,
      target: carbs.target,
      percentage: carbs.percentage,
      unit: "g",
      tone: "amber",
      icon: "wheat",
    },
    {
      label: "Fats",
      consumed: fats.consumed,
      target: fats.target,
      percentage: fats.percentage,
      unit: "g",
      tone: "purple",
      icon: "drop",
    },
  ];

  return (
    <section className={styles.patientTrackingTab}>
      <div className={styles.patientOverviewTitle}>
        <h2>Tracking</h2>
      </div>

      {loading && <p className={styles.directoryMessage}>Loading tracking data...</p>}
      {error && <p className={styles.errorText}>Tracking endpoint unavailable: {error}</p>}

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={`${styles.panelTitle} ${styles.panelTitleSm}`}>Daily Nutrition Progress</h2>
        </div>
        <div className={styles.nutritionProgressGrid}>
          {nutritionMetrics.map((metric) => (
            <article key={metric.label} className={`${styles.nutritionMetricCard} ${styles[`nutritionMetric${metric.tone}`]}`}>
              <div className={styles.nutritionMetricLabel}>
                <span className={styles.nutritionMetricIcon}>{metric.icon === "flame" ? "Cal" : metric.icon === "target" ? "Pro" : metric.icon === "wheat" ? "Carb" : "Fat"}</span>
                <span>{metric.label}</span>
              </div>
              <div className={styles.nutritionRing} style={{ "--progress": `${metric.percentage}%` } as CSSProperties}>
                <div>
                  <strong>{metric.consumed.toLocaleString()}</strong>
                  <span>/ {metric.target.toLocaleString()} {metric.unit}</span>
                </div>
              </div>
              <p className={styles.nutritionPercent}>{metric.percentage}%</p>
            </article>
          ))}
        </div>
        <div className={styles.nutritionLegend}>
          <span><i className={styles.legendExcellent} />Excellent (90%+)</span>
          <span><i className={styles.legendGood} />Good (70-89%)</span>
          <span><i className={styles.legendNeeds} />Needs Improvement (50-69%)</span>
          <span><i className={styles.legendPoor} />Poor (&lt;50%)</span>
        </div>
      </section>

      <div className={styles.trackingContentGrid}>
        <section className={styles.trackingVisualCard}>
          <div className={styles.trackingVisualHeader}>
            <span className={`${styles.trackingHeaderIcon} ${styles.trackingHeaderIconBlue}`}>G</span>
            <div>
              <h3>Daily Goal</h3>
              <p>Target macros for this patient</p>
            </div>
          </div>
          <div className={styles.goalMetricGrid}>
            <GoalMetric value={numberOrZero(goal?.calories).toLocaleString()} unit="kcal" label="Calories" />
            <GoalMetric value={numberOrZero(goal?.carbs).toLocaleString()} unit="g" label="Carbohydrates" />
            <GoalMetric value={numberOrZero(goal?.proteins).toLocaleString()} unit="g" label="Proteins" />
            <GoalMetric value={numberOrZero(goal?.fats).toLocaleString()} unit="g" label="Fats" />
          </div>
          <small className={styles.trackingCardFootnote}>Goal data synced from the patient's active tracking goal.</small>
        </section>

        <section className={styles.trackingVisualCard}>
          <div className={styles.trackingVisualHeader}>
            <span className={`${styles.trackingHeaderIcon} ${styles.trackingHeaderIconAmber}`}>M</span>
            <div>
              <h3>Meal History</h3>
              <p>Meals assigned to the current tracking day</p>
            </div>
          </div>
          <div className={styles.trackingMealTableWrap}>
            <table className={styles.trackingMealTableClean}>
              <thead>
                <tr>
                  <th>Meal</th>
                  <th>Recipe</th>
                  <th>Day</th>
                </tr>
              </thead>
              <tbody>
                {data.mealEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <span className={styles.mealTypeCell}>
                        <i>{entry.mealPlanType?.charAt(0) ?? "M"}</i>
                        {entry.mealPlanType ?? "-"}
                      </span>
                    </td>
                    <td><strong>Recipe #{entry.recipeId ?? "-"}</strong></td>
                    <td>{dayLabel(entry.dayNumber)}</td>
                  </tr>
                ))}
                {data.mealEntries.length === 0 && (
                  <tr>
                    <td colSpan={3}>No meal entries found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className={styles.hydrationVisualGrid}>
        <section className={styles.trackingVisualCard}>
          <div className={styles.trackingVisualHeader}>
            <span className={`${styles.trackingHeaderIcon} ${styles.trackingHeaderIconBlue}`}>W</span>
            <div>
              <h3>Today's Water</h3>
              <p>Current intake against daily goal</p>
            </div>
          </div>
          <div className={styles.waterFocus}>
            <strong>{waterMl.toLocaleString()} <span>ml</span></strong>
            <small>of 2500 ml goal</small>
            <div className={styles.waterRing} style={{ "--progress": `${waterPercent}%` } as CSSProperties}>
              <div>
                <strong>{waterPercent}%</strong>
                <span>of daily goal</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.trackingVisualCard}>
          <div className={styles.trackingVisualHeader}>
            <span className={`${styles.trackingHeaderIcon} ${styles.trackingHeaderIconBlue}`}>H</span>
            <div>
              <h3>Weekly Hydration</h3>
              <p>Seven-day intake summary</p>
            </div>
          </div>
          <div className={styles.weeklyHydrationStats}>
            <div><span>Average</span><strong>{weeklyAverageMl.toLocaleString()} ml/day</strong></div>
            <div><span>Best Day</span><strong>{weeklyBestMl.toLocaleString()} ml</strong></div>
            <div><span>Days Below Goal</span><strong>{numberOrZero(data.weeklyHydration?.daysBelowGoal)} days</strong></div>
          </div>
          <div className={styles.weeklyHydrationBars}>
            {weeklyBars.map((value, index) => (
              <div key={index}>
                <span style={{ height: `${value}%` }} />
                <small>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}</small>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function GoalMetric({ value, unit, label }: { value: string; unit: string; label: string }) {
  return (
    <article className={styles.goalMetricTile}>
      <strong>{value} <span>{unit}</span></strong>
      <small>{label}</small>
    </article>
  );
}
