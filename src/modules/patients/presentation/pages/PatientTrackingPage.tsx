import { patientDetail, patientTracking } from "../../infrastructure/mock/patients.mock";
import { SharedLayout } from "@/shared/components/layout";
import { navigationConfig } from "@/shared/constants/navigation.config";
import styles from "./PatientsPages.module.css";

interface PatientTrackingPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

function insightToneClass(tone: "critical" | "positive" | "neutral") {
  if (tone === "critical") return `${styles.insightItem} ${styles.toneCritical}`;
  if (tone === "positive") return `${styles.insightItem} ${styles.tonePositive}`;
  return `${styles.insightItem} ${styles.toneNeutral}`;
}

export function PatientTrackingPage({ currentPath, onNavigate }: PatientTrackingPageProps) {
  return (
    <SharedLayout
      title={`${patientDetail.name} - Health Monitoring`}
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={navigationConfig.nutritionist}
      breadcrumbs={["Patients", "Directory", patientDetail.name, "Tracking"]}
    >
      <div className={styles.stack}>
        <div className={styles.toolbar}>
          <div>
            <p className={styles.muted}>Patient ID: #MC-8932 | Protocol: {patientTracking.protocol}</p>
          </div>
          <select className={styles.rangeSelect} defaultValue="last-7">
            <option value="last-7">{patientTracking.dateRangeLabel}</option>
          </select>
        </div>

        <div className={styles.trackingGrid}>
          <div className={styles.stack}>
            <div className={styles.metricRow}>
              {patientTracking.metrics.map((metric) => (
                <article key={metric.label} className={styles.metricCard}>
                  <div className={styles.toolbarCompact}>
                    <span>{metric.label}</span>
                    <span>{metric.icon === "heart" ? "♡" : "🏃"}</span>
                  </div>
                  <p className={styles.metricValue}>{metric.value}</p>
                  <span className={styles.metricPositive}>{metric.supportingText}</span>
                  {metric.label === "Weekly Calories" ? <span className={styles.metricAccent} /> : null}
                </article>
              ))}
            </div>

            <section className={styles.panel}>
              <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>Hydration vs Target</h3>
                <button type="button" className={styles.textLink}>
                  Export Data
                </button>
              </div>

              <div className={styles.barChart}>
                {patientTracking.hydrationWeek.map((day) => (
                  <div key={day.day} className={styles.barColumn}>
                    <div className={styles.barTrack}>
                      <div
                        className={`${styles.bar} ${day.targetReached ? styles.barHighlight : ""}`}
                        style={{ height: `${(day.amount / 3) * 100}%` }}
                      />
                    </div>
                    <span className={styles.chartLabel}>{day.day}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className={styles.insightsPanel}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>✦ AI Health Insights</h3>
            </div>
            <div className={styles.insightList}>
              {patientTracking.insights.map((insight) => (
                <article key={insight.id} className={insightToneClass(insight.tone)}>
                  <p className={styles.footnote}>{insight.timestamp}</p>
                  <h4 className={styles.personName}>{insight.title}</h4>
                  <p className={styles.muted}>{insight.description}</p>
                  <button type="button" className={styles.textLink}>
                    {insight.actionLabel}
                  </button>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </SharedLayout>
  );
}
