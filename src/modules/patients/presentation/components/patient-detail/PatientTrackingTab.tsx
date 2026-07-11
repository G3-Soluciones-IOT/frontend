import { useMemo, type CSSProperties } from "react";
import { useI18n } from "@/shared/i18n/useI18n";
import type { TranslationKey } from "@/shared/i18n/translations";
import styles from "../../pages/PatientsPages.module.css";

interface MacroValues {
  calories: number;
  carbs: number;
  proteins: number;
  fats: number;
}

interface TrackingProgress {
  consumed: MacroValues;
  target: MacroValues;
}

interface MealHistoryEntry {
  id: number | string;
  recipeId: number | string;
  mealPlanType: string;
  dayNumber: number;
}

interface TrackingTabData {
  progress: TrackingProgress;
  mealEntries: MealHistoryEntry[];
}

interface PatientTrackingTabProps {
  patientId: string;
}

function patientSeed(patientId: string) {
  return patientId.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

function numberOrZero(value?: number) {
  return Number.isFinite(value) ? Number(value) : 0;
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function percent(consumed?: number, target?: number) {
  if (!target) return 0;
  return clampPercent(Math.round((numberOrZero(consumed) / target) * 100));
}

function dayLabel(day: number | undefined, t: (key: TranslationKey) => string) {
  const labels: TranslationKey[] = [
    "patients.day.monday",
    "patients.day.tuesday",
    "patients.day.wednesday",
    "patients.day.thursday",
    "patients.day.friday",
    "patients.day.saturday",
    "patients.day.sunday",
  ];
  if (!day || day < 1) return "-";
  return t(labels[(day - 1) % 7] ?? "patients.day.monday");
}

function buildMockTrackingData(patientId: string): TrackingTabData {
  const seed = patientSeed(patientId);
  const target: MacroValues = {
    calories: 2100 + (seed % 450),
    proteins: 120 + (seed % 36),
    carbs: 230 + (seed % 55),
    fats: 65 + (seed % 18),
  };

  const ratio = (offset: number) => 0.58 + (((seed + offset) % 39) / 100);
  const consumed: MacroValues = {
    calories: Math.round(target.calories * ratio(3)),
    proteins: Math.round(target.proteins * ratio(11)),
    carbs: Math.round(target.carbs * ratio(19)),
    fats: Math.round(target.fats * ratio(27)),
  };

  const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];
  const mealEntries = mealTypes.map((mealType, index) => ({
    id: `${patientId}-${mealType.toLowerCase()}`,
    recipeId: 100 + ((seed + index * 13) % 90),
    mealPlanType: mealType,
    dayNumber: ((seed + index) % 7) + 1,
  }));

  return {
    progress: {
      consumed,
      target,
    },
    mealEntries,
  };
}

export function PatientTrackingTab({ patientId }: PatientTrackingTabProps) {
  const { t } = useI18n();
  const data = useMemo(() => buildMockTrackingData(patientId), [patientId]);

  const goal = data.progress.target;
  const calories = {
    consumed: data.progress.consumed.calories,
    target: goal.calories,
    percentage: percent(data.progress.consumed.calories, goal.calories),
  };
  const carbs = {
    consumed: data.progress.consumed.carbs,
    target: goal.carbs,
    percentage: percent(data.progress.consumed.carbs, goal.carbs),
  };
  const proteins = {
    consumed: data.progress.consumed.proteins,
    target: goal.proteins,
    percentage: percent(data.progress.consumed.proteins, goal.proteins),
  };
  const fats = {
    consumed: data.progress.consumed.fats,
    target: goal.fats,
    percentage: percent(data.progress.consumed.fats, goal.fats),
  };
  const nutritionMetrics = [
    {
      label: t("dashboard.metric.calories"),
      consumed: calories.consumed,
      target: calories.target,
      percentage: calories.percentage,
      unit: "kcal",
      tone: "green",
      icon: "Cal",
    },
    {
      label: t("dashboard.metric.protein"),
      consumed: proteins.consumed,
      target: proteins.target,
      percentage: proteins.percentage,
      unit: "g",
      tone: "blue",
      icon: "Pro",
    },
    {
      label: t("dashboard.metric.carbs"),
      consumed: carbs.consumed,
      target: carbs.target,
      percentage: carbs.percentage,
      unit: "g",
      tone: "amber",
      icon: "Carb",
    },
    {
      label: t("dashboard.metric.fats"),
      consumed: fats.consumed,
      target: fats.target,
      percentage: fats.percentage,
      unit: "g",
      tone: "purple",
      icon: "Fat",
    },
  ];

  return (
    <section className={styles.patientTrackingTab}>
      <div className={styles.patientOverviewTitle}>
        <h2>{t("patients.detail.tab.tracking")}</h2>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={`${styles.panelTitle} ${styles.panelTitleSm}`}>{t("patients.tracking.dailyProgress")}</h2>
        </div>
        <div className={styles.nutritionProgressGrid}>
          {nutritionMetrics.map((metric) => (
            <article key={metric.label} className={`${styles.nutritionMetricCard} ${styles[`nutritionMetric${metric.tone}`]}`}>
              <div className={styles.nutritionMetricLabel}>
                <span className={styles.nutritionMetricIcon}>{metric.icon}</span>
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
          <span><i className={styles.legendExcellent} />{t("patients.tracking.legend.excellent")}</span>
          <span><i className={styles.legendGood} />{t("patients.tracking.legend.good")}</span>
          <span><i className={styles.legendNeeds} />{t("patients.tracking.legend.needs")}</span>
          <span><i className={styles.legendPoor} />{t("patients.tracking.legend.poor")}</span>
        </div>
      </section>

      <div className={styles.trackingContentGrid}>
        <section className={styles.trackingVisualCard}>
          <div className={styles.trackingVisualHeader}>
            <span className={`${styles.trackingHeaderIcon} ${styles.trackingHeaderIconBlue}`}>G</span>
            <div>
              <h3>{t("patients.tracking.dailyGoal")}</h3>
              <p>{t("patients.tracking.dailyGoal.description")}</p>
            </div>
          </div>
          <div className={styles.goalMetricGrid}>
            <GoalMetric value={goal.calories.toLocaleString()} unit="kcal" label={t("dashboard.metric.calories")} />
            <GoalMetric value={goal.carbs.toLocaleString()} unit="g" label={t("patients.tracking.carbohydrates")} />
            <GoalMetric value={goal.proteins.toLocaleString()} unit="g" label={t("patients.tracking.proteins")} />
            <GoalMetric value={goal.fats.toLocaleString()} unit="g" label={t("dashboard.metric.fats")} />
          </div>
          <small className={styles.trackingCardFootnote}>{t("patients.tracking.mockFootnote")}</small>
        </section>

        <section className={styles.trackingVisualCard}>
          <div className={styles.trackingVisualHeader}>
            <span className={`${styles.trackingHeaderIcon} ${styles.trackingHeaderIconAmber}`}>M</span>
            <div>
              <h3>{t("patients.tracking.mealHistory")}</h3>
              <p>{t("patients.tracking.mealHistory.description")}</p>
            </div>
          </div>
          <div className={styles.trackingMealTableWrap}>
            <table className={styles.trackingMealTableClean}>
              <thead>
                <tr>
                  <th>{t("patients.tracking.meal")}</th>
                  <th>{t("patients.tracking.recipe")}</th>
                  <th>{t("patients.tracking.day")}</th>
                </tr>
              </thead>
              <tbody>
                {data.mealEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <span className={styles.mealTypeCell}>
                        <i>{entry.mealPlanType.charAt(0)}</i>
                        {entry.mealPlanType}
                      </span>
                    </td>
                    <td><strong>{t("patients.tracking.recipe")} #{entry.recipeId}</strong></td>
                    <td>{dayLabel(entry.dayNumber, t)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
