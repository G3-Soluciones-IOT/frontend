import { useEffect, useState } from "react";
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
  onOpenFullTracking: () => void;
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

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function dayLabel(day?: number) {
  const labels = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  if (!day || day < 1) return "-";
  return labels[(day - 1) % 7] ?? `Day ${day}`;
}

function OverviewItem({ label, value }: { label: string; value: string | number }) {
  return (
    <article className={styles.patientOverviewItem}>
      <span>{label}</span>
      <strong>{value || "-"}</strong>
    </article>
  );
}

function MacroProgressBar({
  label,
  consumed,
  target,
  unit,
  percentage,
}: {
  label: string;
  consumed: number;
  target: number;
  unit: string;
  percentage: number;
}) {
  return (
    <div className={styles.trackingProgressRow}>
      <div>
        <strong>{label}</strong>
        <span>{consumed} / {target} {unit}</span>
      </div>
      <em>{percentage}%</em>
      <div className={styles.macroProgress}>
        <span style={{ width: `${percentage}%`, background: "#16a34a" }} />
      </div>
    </div>
  );
}

export function PatientTrackingTab({ patientId, onOpenFullTracking }: PatientTrackingTabProps) {
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

  const tracking = data.tracking;
  const goal = data.goal?.targetMacros;
  const calories = macroProgress(data.progress, "calories");
  const carbs = macroProgress(data.progress, "carbs");
  const proteins = macroProgress(data.progress, "proteins");
  const fats = macroProgress(data.progress, "fats");
  const waterMl = numberOrZero(data.waterToday?.totalWaterMl);
  const waterPercent = percent(waterMl, 2500);

  return (
    <section className={styles.patientTrackingTab}>
      <div className={styles.patientOverviewTitle}>
        <h2>Tracking</h2>
        <button type="button" className={styles.primaryButton} onClick={onOpenFullTracking}>
          Full Tracking View
        </button>
      </div>

      {loading && <p className={styles.directoryMessage}>Loading tracking data...</p>}
      {error && <p className={styles.errorText}>Tracking endpoint unavailable: {error}</p>}

      <div className={styles.trackingSummaryGrid}>
        <OverviewItem label="Tracking Date" value={formatDate(tracking?.date)} />
        <OverviewItem label="Calories" value={`${numberOrZero(tracking?.consumedMacros?.calories)} kcal`} />
        <OverviewItem label="Carbs" value={`${numberOrZero(tracking?.consumedMacros?.carbs)} g`} />
        <OverviewItem label="Proteins" value={`${numberOrZero(tracking?.consumedMacros?.proteins)} g`} />
        <OverviewItem label="Fats" value={`${numberOrZero(tracking?.consumedMacros?.fats)} g`} />
        <OverviewItem label="Meals" value={tracking?.mealPlanEntries?.length ?? data.mealEntries.length} />
      </div>

      <div className={styles.trackingContentGrid}>
        <section className={styles.trackingBlock}>
          <h3>Nutrition Progress</h3>
          <MacroProgressBar label="Calories" consumed={calories.consumed} target={calories.target} unit="kcal" percentage={calories.percentage} />
          <MacroProgressBar label="Carbohydrates" consumed={carbs.consumed} target={carbs.target} unit="g" percentage={carbs.percentage} />
          <MacroProgressBar label="Proteins" consumed={proteins.consumed} target={proteins.target} unit="g" percentage={proteins.percentage} />
          <MacroProgressBar label="Fats" consumed={fats.consumed} target={fats.target} unit="g" percentage={fats.percentage} />
        </section>

        <section className={styles.trackingBlock}>
          <h3>Daily Goal</h3>
          <div className={styles.dailyGoalGrid}>
            <OverviewItem label="Calories" value={`${numberOrZero(goal?.calories)} kcal`} />
            <OverviewItem label="Carbs" value={`${numberOrZero(goal?.carbs)} g`} />
            <OverviewItem label="Proteins" value={`${numberOrZero(goal?.proteins)} g`} />
            <OverviewItem label="Fats" value={`${numberOrZero(goal?.fats)} g`} />
          </div>
        </section>
      </div>

      <div className={styles.trackingContentGrid}>
        <section className={styles.trackingBlock}>
          <h3>Meal History</h3>
          <div className={styles.trackingMealTableWrap}>
            <table className={styles.trackingMealTable}>
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
                    <td>{entry.mealPlanType ?? "-"}</td>
                    <td>Recipe #{entry.recipeId ?? "-"}</td>
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

        <section className={styles.trackingBlock}>
          <h3>Hydration</h3>
          <div className={styles.hydrationCards}>
            <article>
              <span>Today's Water</span>
              <strong>{waterMl} ml</strong>
              <div className={styles.macroProgress}>
                <span style={{ width: `${waterPercent}%`, background: "#16a34a" }} />
              </div>
              <p>{waterPercent}%</p>
            </article>
            <article>
              <span>Weekly Hydration</span>
              <strong>{numberOrZero(data.weeklyHydration?.averageWaterMl)} ml/day</strong>
              <p>Best Day: {numberOrZero(data.weeklyHydration?.bestDayMl)} ml</p>
              <p>Days Below Goal: {numberOrZero(data.weeklyHydration?.daysBelowGoal)}</p>
            </article>
          </div>
        </section>
      </div>
    </section>
  );
}
