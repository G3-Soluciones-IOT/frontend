import { patientDetail } from "../../infrastructure/mock/patients.mock";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import styles from "./PatientsPages.module.css";

interface PatientDetailPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

const weightMin = Math.min(...patientDetail.weightSeries.map((point) => point.value));
const weightMax = Math.max(...patientDetail.weightSeries.map((point) => point.value));
const chartWidth = 820;
const chartHeight = 230;
const chartPadding = { top: 18, right: 22, bottom: 34, left: 52 };
const innerWidth = chartWidth - chartPadding.left - chartPadding.right;
const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom;
const yAxisLabels = [88, 86, 84, 82];

function getChartY(value: number) {
  const normalized = (value - weightMin) / Math.max(weightMax - weightMin, 0.1);
  return chartPadding.top + innerHeight - normalized * (innerHeight * 0.82 + 12);
}

export function PatientDetailPage({ currentPath, onNavigate }: PatientDetailPageProps) {
  const hydrationProgress = Math.round((patientDetail.hydrationLiters / patientDetail.hydrationTargetLiters) * 100);
  const calorieProgress = Math.round((patientDetail.caloriesConsumed / patientDetail.caloriesTarget) * 100);
  const points = patientDetail.weightSeries.map((point, index) => {
    const x = chartPadding.left + (index * innerWidth) / Math.max(patientDetail.weightSeries.length - 1, 1);
    const y = getChartY(point.value);
    return { ...point, x, y };
  });
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  return (
    <SharedLayout
      title={patientDetail.name}
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={useNavigation()}
      breadcrumbs={["Patients", "Directory", patientDetail.name]}
    >
      <div className={styles.stack}>
        <button type="button" className={styles.backButton} onClick={() => onNavigate("/nutritionist/patients/directory")}>
          ← Back to Patients Directory
        </button>

        <div className={styles.detailGrid}>
          <section className={`${styles.panel} ${styles.profileCard}`}>
            <div className={styles.profileAvatar}>MC</div>
            <div>
              <div className={styles.profileHeader}>
                <div>
                  <h2 className={styles.profileName}>{patientDetail.name}</h2>
                  <p className={styles.muted}>
                    {patientDetail.age} years old • {patientDetail.heightCm} cm • {patientDetail.weightKg} kg
                  </p>
                </div>
                <span className={styles.pill}>{patientDetail.statusLabel}</span>
              </div>

              <div className={styles.goalCard}>
                <p className={styles.goalTitle}>Primary Goal</p>
                <p className={styles.goalValue}>{patientDetail.primaryGoal}</p>
                <div className={styles.tagsRow}>
                  {patientDetail.planTags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <aside className={`${styles.panel} ${styles.analysisCard}`}>
            <h3 className={styles.analysisTitle}>✦ {patientDetail.smartAnalysis.title}</h3>
            <p className={styles.muted}>{patientDetail.smartAnalysis.description}</p>
            <button type="button" className={styles.primaryButton} onClick={() => onNavigate("/nutritionist/patients/michael-chen/tracking")}>
              {patientDetail.smartAnalysis.actionLabel}
            </button>
          </aside>
        </div>

        <section className={`${styles.panel} ${styles.chartCard}`}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Weight Progression</h3>
            <select className={styles.rangeSelect} defaultValue="last-30">
              <option value="last-30">Last 30 Days</option>
            </select>
          </div>

          <div className={styles.lineChartFrame}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className={styles.lineChartSvg} aria-label="Weight progression chart">
              {yAxisLabels.map((label) => {
                const y = chartPadding.top + ((88 - label) / 6) * innerHeight;
                return (
                  <g key={label}>
                    <text x={14} y={y + 4} className={styles.axisLabel}>
                      {label}k
                    </text>
                    <line
                      x1={chartPadding.left}
                      y1={y}
                      x2={chartWidth - chartPadding.right}
                      y2={y}
                      className={styles.gridLine}
                    />
                  </g>
                );
              })}

              <line
                x1={chartPadding.left}
                y1={chartHeight - chartPadding.bottom}
                x2={chartWidth - chartPadding.right}
                y2={chartHeight - chartPadding.bottom}
                className={styles.baseLine}
              />

              <path d={linePath} className={styles.weightLine} />

              {points.map((point) => (
                <g key={point.label}>
                  <circle cx={point.x} cy={point.y} r="4.5" className={styles.weightDot} />
                  <text
                    x={point.x}
                    y={chartHeight - 10}
                    textAnchor="middle"
                    className={styles.axisBottomLabel}
                  >
                    {point.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </section>

        <div className={styles.bottomGrid}>
          <section className={styles.miniPanel}>
            <h3 className={`${styles.panelTitle} ${styles.panelTitleSm}`}>💧 Hydration</h3>
            <div className={styles.circleProgress}>
              <div className={styles.circleValue}>
                <div>{patientDetail.hydrationLiters}L</div>
                <small>/ {patientDetail.hydrationTargetLiters}.0L Target</small>
              </div>
            </div>
            <p className={styles.muted}>
              {hydrationProgress >= 80
                ? "On track. Remind patient to drink 500ml post-workout."
                : "Below target. Consider adjusting reminders around afternoon meals."}
            </p>
          </section>

          <section className={styles.miniPanel}>
            <div className={styles.panelHeader}>
              <h3 className={`${styles.panelTitle} ${styles.panelTitleSm}`}>⌁ Daily Calories</h3>
              <span className={styles.pill}>Today</span>
            </div>
            <p className={styles.muted}>
              Consumed <strong>{patientDetail.caloriesConsumed.toLocaleString()}</strong> /{" "}
              <strong>{patientDetail.caloriesTarget.toLocaleString()} kcal</strong>
            </p>
            <div className={styles.macroProgress}>
              <span style={{ width: `${calorieProgress}%`, background: "linear-gradient(90deg, #16a34a 0%, #22c55e 100%)" }} />
            </div>

            <div className={styles.macroCards}>
              <article className={styles.macroCard}>
                <h4>Protein</h4>
                <p className={styles.macroValue}>{patientDetail.macros.protein}g</p>
                <div className={styles.macroProgress}>
                  <span style={{ width: "82%", background: "#6479b7" }} />
                </div>
              </article>
              <article className={styles.macroCard}>
                <h4>Carbs</h4>
                <p className={styles.macroValue}>{patientDetail.macros.carbs}g</p>
                <div className={styles.macroProgress}>
                  <span style={{ width: "74%", background: "#0e8cc7" }} />
                </div>
              </article>
              <article className={styles.macroCard}>
                <h4>Fats</h4>
                <p className={styles.macroValue}>{patientDetail.macros.fats}g</p>
                <div className={styles.macroProgress}>
                  <span style={{ width: "66%", background: "#f59e0b" }} />
                </div>
              </article>
            </div>
          </section>
        </div>
      </div>
    </SharedLayout>
  );
}
