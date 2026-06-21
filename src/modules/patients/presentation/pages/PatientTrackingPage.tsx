import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import {
  getConsumedMacrosByTracking,
  getMealPlanEntriesByTracking,
  getPatientUserSummaries,
  getTrackingByUser,
  getTrackingGoalByUser,
  getTrackingProgressByUser,
  type MacroResource,
  type PatientUserSummary,
  type TrackingGoalResource,
  type TrackingMealPlanEntryResource,
  type TrackingProgressResource,
  type TrackingResource,
} from "../../infrastructure/api/nutritionistPatients.api";
import styles from "./PatientsPages.module.css";

interface PatientTrackingPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function metricProgress(consumed: number, target: number, percentage?: number) {
  return clampPercent(Math.round(percentage ?? (target > 0 ? (consumed / target) * 100 : 0)));
}

function mealLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function mealMeta(value: string) {
  const normalized = value.toUpperCase();
  if (normalized === "BREAKFAST") return { time: "8:00 AM", calories: 450, tone: "green" };
  if (normalized === "LUNCH") return { time: "1:00 PM", calories: 820, tone: "orange" };
  if (normalized === "DINNER") return { time: "7:00 PM", calories: 480, tone: "purple" };
  return { time: "4:00 PM", calories: 100, tone: "amber" };
}

export function PatientTrackingPage({ currentPath, onNavigate }: PatientTrackingPageProps) {
  const patientId = currentPath.split("/").filter(Boolean).at(-2) || "";
  const [tracking, setTracking] = useState<TrackingResource | null>(null);
  const [progress, setProgress] = useState<TrackingProgressResource | null>(null);
  const [goal, setGoal] = useState<TrackingGoalResource | null>(null);
  const [mealEntries, setMealEntries] = useState<TrackingMealPlanEntryResource[]>([]);
  const [consumedMacros, setConsumedMacros] = useState<MacroResource | null>(null);
  const [patientUser, setPatientUser] = useState<PatientUserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const nutrition = useMemo(() => {
    const consumed = consumedMacros ?? tracking?.consumedMacros;
    const target = goal?.targetMacros;

    return {
      calories: {
        label: "Calories",
        consumed: progress?.calories.consumed ?? consumed?.calories ?? 0,
        target: progress?.calories.target ?? target?.calories ?? 0,
        percentage: progress?.calories.percentage,
        unit: "kcal",
        tone: "green",
        icon: "flame",
      },
      proteins: {
        label: "Protein",
        consumed: progress?.proteins.consumed ?? consumed?.proteins ?? 0,
        target: progress?.proteins.target ?? target?.proteins ?? 0,
        percentage: progress?.proteins.percentage,
        unit: "g",
        tone: "blue",
        icon: "target",
      },
      carbs: {
        label: "Carbs",
        consumed: progress?.carbs.consumed ?? consumed?.carbs ?? 0,
        target: progress?.carbs.target ?? target?.carbs ?? 0,
        percentage: progress?.carbs.percentage,
        unit: "g",
        tone: "amber",
        icon: "wheat",
      },
      fats: {
        label: "Fats",
        consumed: progress?.fats.consumed ?? consumed?.fats ?? 0,
        target: progress?.fats.target ?? target?.fats ?? 0,
        percentage: progress?.fats.percentage,
        unit: "g",
        tone: "purple",
        icon: "drop",
      },
    };
  }, [consumedMacros, goal, progress, tracking]);

  const metrics = [nutrition.calories, nutrition.proteins, nutrition.carbs, nutrition.fats];
  const resolvedMealEntries = mealEntries.length ? mealEntries : tracking?.mealPlanEntries ?? [];
  const patientName = patientUser?.fullName || patientUser?.username || `Patient #${patientId}`;

  useEffect(() => {
    let mounted = true;

    const loadTracking = async () => {
      setLoading(true);
      setError(null);

      try {
        const [nextTracking, nextProgress, nextGoal, users] = await Promise.all([
          getTrackingByUser(patientId),
          getTrackingProgressByUser(patientId),
          getTrackingGoalByUser(patientId),
          getPatientUserSummaries(),
        ]);

        const trackingId = nextTracking?.id;
        const [nextMealEntries, nextConsumedMacros]: [TrackingMealPlanEntryResource[], MacroResource | null] = trackingId
          ? await Promise.all([
            getMealPlanEntriesByTracking(trackingId),
            getConsumedMacrosByTracking(trackingId),
          ])
          : [[], null];

        if (!mounted) return;
        setTracking(nextTracking);
        setProgress(nextProgress);
        setGoal(nextGoal);
        setMealEntries(nextMealEntries);
        setConsumedMacros(nextConsumedMacros);
        setPatientUser(users.find((user) => String(user.id) === String(patientId)) ?? null);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load nutrition tracking.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadTracking();

    return () => {
      mounted = false;
    };
  }, [patientId]);

  return (
    <SharedLayout
      title="Nutrition Tracking"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={useNavigation()}
      breadcrumbs={["Patients", "Directory", patientName, "Nutrition Tracking"]}
      showPageTitle={false}
    >
      <div className={styles.stack}>
        <div className={styles.trackingHeader}>
          <div>
            <button type="button" className={styles.backButton} onClick={() => onNavigate(`/nutritionist/patients/${patientId}`)}>
              &larr; Back to Patient Detail
            </button>
            <h1 className={styles.trackingTitle}>Nutrition Tracking</h1>
            <p className={styles.muted}>
              {patientName} - Tracking ID: {tracking?.id ?? "-"} - Date: {tracking?.date ?? "-"}
            </p>
          </div>
          {loading && <span className={styles.pill}>Loading</span>}
        </div>

        {error && <p className={styles.errorText}>{error}</p>}

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={`${styles.panelTitle} ${styles.panelTitleSm}`}>Daily Nutrition Progress</h2>
            <button type="button" className={styles.textLink}>View Details</button>
          </div>
          <div className={styles.nutritionProgressGrid}>
            {metrics.map((metric) => {
              const percentage = metricProgress(metric.consumed, metric.target, metric.percentage);
              return (
                <article key={metric.label} className={`${styles.nutritionMetricCard} ${styles[`nutritionMetric${metric.tone}`]}`}>
                  <div className={styles.nutritionMetricLabel}>
                    <span className={styles.nutritionMetricIcon}>{metric.icon === "flame" ? "♨" : metric.icon === "target" ? "⊙" : metric.icon === "wheat" ? "≋" : "♢"}</span>
                    <span>{metric.label}</span>
                  </div>
                  <div className={styles.nutritionRing} style={{ "--progress": `${percentage}%` } as CSSProperties}>
                    <div>
                      <strong>{metric.consumed.toLocaleString()}</strong>
                      <span>/ {metric.target.toLocaleString()} {metric.unit}</span>
                    </div>
                  </div>
                  <p className={styles.nutritionPercent}>{percentage}%</p>
                </article>
              );
            })}
          </div>
          <div className={styles.nutritionLegend}>
            <span><i className={styles.legendExcellent} />Excellent (90%+)</span>
            <span><i className={styles.legendGood} />Good (70-89%)</span>
            <span><i className={styles.legendNeeds} />Needs Improvement (50-69%)</span>
            <span><i className={styles.legendPoor} />Poor (&lt;50%)</span>
          </div>
        </section>

        <div className={styles.nutritionTrackingGrid}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={`${styles.panelTitle} ${styles.panelTitleSm}`}>Today's Meal Plan Entries</h2>
              <button type="button" className={styles.textLink}>+ Add Entry</button>
            </div>
            <div className={styles.mealEntryList}>
              {resolvedMealEntries.map((entry) => {
                const meta = mealMeta(entry.mealPlanType);
                return (
                <article key={entry.id} className={styles.mealEntryItem}>
                  <span className={`${styles.mealEntryIcon} ${styles[`mealEntry${meta.tone}`]}`}>{mealLabel(entry.mealPlanType).charAt(0)}</span>
                  <div className={styles.mealEntryBody}>
                    <h3>{mealLabel(entry.mealPlanType)}</h3>
                    <p className={styles.muted}>{meta.time} · Recipe #{entry.recipeId}</p>
                  </div>
                  <span className={styles.statusAccepted}>Logged</span>
                  <div className={styles.mealEntryCalories}>
                    <strong>{meta.calories} kcal</strong>
                    <span>Day {entry.dayNumber}</span>
                  </div>
                </article>
                );
              })}
              {!resolvedMealEntries.length && <p className={styles.emptyState}>No meal entries assigned to this tracking.</p>}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={`${styles.panelTitle} ${styles.panelTitleSm}`}>Nutrition Goals</h2>
              <button type="button" className={styles.textLink}>Edit Goals</button>
            </div>
            <p className={styles.goalTitle}>Target Macros (Daily)</p>
            <div className={styles.targetMacroList}>
              <div>
                <span>Calories</span>
                <strong>{goal?.targetMacros.calories?.toLocaleString() ?? "-"} kcal</strong>
              </div>
              <div>
                <span>Protein</span>
                <strong>{goal?.targetMacros.proteins ?? "-"}g</strong>
              </div>
              <div>
                <span>Carbs</span>
                <strong>{goal?.targetMacros.carbs ?? "-"}g</strong>
              </div>
              <div>
                <span>Fats</span>
                <strong>{goal?.targetMacros.fats ?? "-"}g</strong>
              </div>
            </div>
            <div className={styles.goalTypeBox}>
              <strong>Goal Type</strong>
              <span>Body Recomposition & Lean Muscle Gain</span>
              <small>High Protein · Moderate Deficit</small>
            </div>
          </section>
        </div>

        <div className={styles.mockDivider}>Additional Health Metrics (Mock Data)</div>

        <div className={styles.mockMetricsGrid}>
          <section className={`${styles.panel} ${styles.mockChartPanel}`}>
            <div className={styles.panelHeader}>
              <h2 className={`${styles.panelTitle} ${styles.panelTitleSm}`}>Weight Progression (Mock)</h2>
              <select className={styles.rangeSelect} defaultValue="last-30">
                <option value="last-30">Last 30 Days</option>
              </select>
            </div>
            <svg className={styles.mockLineChart} viewBox="0 0 520 220" aria-label="Mock weight progression">
              {[88, 86, 84, 82, 80].map((label, index) => (
                <g key={label}>
                  <text x="6" y={24 + index * 42} className={styles.axisLabel}>{label} kg</text>
                  <line x1="52" x2="500" y1={20 + index * 42} y2={20 + index * 42} className={styles.gridLine} />
                </g>
              ))}
              <path
                d="M 52 58 L 88 62 L 124 70 L 160 92 L 196 84 L 232 104 L 268 106 L 304 122 L 340 118 L 376 116 L 412 126 L 448 128 L 484 142 L 500 150"
                className={styles.mockWeightPath}
              />
              <text x="52" y="208" className={styles.axisBottomLabel}>Sep 24</text>
              <text x="158" y="208" className={styles.axisBottomLabel}>Oct 1</text>
              <text x="264" y="208" className={styles.axisBottomLabel}>Oct 8</text>
              <text x="370" y="208" className={styles.axisBottomLabel}>Oct 15</text>
              <text x="455" y="208" className={styles.axisBottomLabel}>Oct 24</text>
              <foreignObject x="430" y="52" width="58" height="48">
                <div className={styles.mockChartTooltip}>Oct 24<br />85 kg</div>
              </foreignObject>
            </svg>
          </section>

          <section className={`${styles.panel} ${styles.mockChartPanel}`}>
            <div className={styles.panelHeader}>
              <h2 className={`${styles.panelTitle} ${styles.panelTitleSm}`}>Hydration (Mock)</h2>
              <select className={styles.rangeSelect} defaultValue="last-7">
                <option value="last-7">Last 7 Days</option>
              </select>
            </div>
            <div className={styles.mockHydrationChart}>
              {[60, 74, 88, 61, 66, 81, 35].map((value, index) => (
                <div key={index} className={styles.mockHydrationColumn}>
                  <div className={styles.mockHydrationTrack}>
                    <span style={{ height: `${value}%` }} />
                  </div>
                  <small>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}</small>
                </div>
              ))}
            </div>
            <p className={styles.mockLegend}><span />% of 3L Target</p>
          </section>
        </div>

        <div className={styles.mockLowerGrid}>
          <section className={styles.panel}>
            <h2 className={`${styles.panelTitle} ${styles.panelTitleSm}`}>Activity (Mock)</h2>
            <div className={styles.mockActivityGrid}>
              <article className={styles.mockActivityCard}>
                <span>Steps</span>
                <strong>8,432</strong>
                <small>/ 10,000 steps</small>
                <div className={styles.macroProgress}><span style={{ width: "84%" }} /></div>
              </article>
              <article className={styles.mockActivityCard}>
                <span>Active Minutes</span>
                <strong>45</strong>
                <small>/ 60 min</small>
                <div className={styles.macroProgress}><span style={{ width: "75%", background: "#0f78b8" }} /></div>
              </article>
              <article className={styles.mockActivityCard}>
                <span>Calories Burned</span>
                <strong>620</strong>
                <small>kcal</small>
                <div className={styles.macroProgress}><span style={{ width: "62%", background: "#f59e0b" }} /></div>
              </article>
            </div>
          </section>

          <section className={styles.panel}>
            <h2 className={`${styles.panelTitle} ${styles.panelTitleSm}`}>Sleep (Mock)</h2>
            <div className={styles.mockSleepList}>
              <article>
                <span className={styles.mockSleepIcon}>☾</span>
                <div><strong>7h 12m</strong><small>Sleep Duration</small></div>
              </article>
              <article>
                <span className={styles.mockSleepIcon}>◎</span>
                <div><strong>Good</strong><small>Sleep Quality</small></div>
              </article>
            </div>
            <div className={styles.macroProgress}><span style={{ width: "88%", background: "#8b5bd6" }} /></div>
          </section>

          <section className={styles.panel}>
            <h2 className={`${styles.panelTitle} ${styles.panelTitleSm}`}>AI Health Insights (Mock)</h2>
            <div className={styles.mockInsightList}>
              <article><i className={styles.legendExcellent} /><div><strong>High Protein Intake</strong><p>Great job! Protein intake is within the optimal range for your goal.</p></div></article>
              <article><i className={styles.legendNeeds} /><div><strong>Hydration Reminder</strong><p>Try to drink more water in the evening to reach your daily hydration target.</p></div></article>
              <article><i className={styles.legendGood} /><div><strong>Recovery Tip</strong><p>Consider a light stretching routine before bedtime to improve recovery.</p></div></article>
            </div>
          </section>
        </div>

        <p className={styles.mockDisclaimer}>All mock data is for demonstration purposes only. Real IoT and historical data will be available soon.</p>
      </div>
    </SharedLayout>
  );
}
