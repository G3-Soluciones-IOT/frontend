import { patientAlerts, patientsOverviewStats } from "../../infrastructure/mock/patients.mock";
import { SharedLayout } from "@/shared/components/layout";
import { navigationConfig } from "@/shared/constants/navigation.config";
import styles from "./PatientsPages.module.css";

interface PatientsOverviewPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

function severityClass(severity: "high" | "warning" | "info") {
  if (severity === "high") return `${styles.severityPill} ${styles.severityHigh}`;
  if (severity === "warning") return `${styles.severityPill} ${styles.severityWarning}`;
  return `${styles.severityPill} ${styles.severityInfo}`;
}

export function PatientsOverviewPage({ currentPath, onNavigate }: PatientsOverviewPageProps) {
  return (
    <SharedLayout
      title="Patients Overview"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={navigationConfig.nutritionist}
      breadcrumbs={["Patients", "Overview"]}
    >
      <div className={styles.stack}>
        <div className={styles.statsGrid}>
          <article className={`${styles.statCard} ${styles.statCardAccentGreen}`}>
            <div>
              <p className={styles.statLabel}>Total Patients</p>
              <p className={styles.statValue}>{patientsOverviewStats.totalPatients}</p>
            </div>
            <div className={`${styles.statIcon} ${styles.iconGreen}`}>👥</div>
          </article>

          <article className={`${styles.statCard} ${styles.statCardAccentAmber}`}>
            <div>
              <p className={styles.statLabel}>Today's Alerts</p>
              <p className={styles.statValue}>{patientsOverviewStats.todaysAlerts}</p>
            </div>
            <div className={`${styles.statIcon} ${styles.iconAmber}`}>⚠️</div>
          </article>

          <article className={`${styles.statCard} ${styles.statCardAccentBlue}`}>
            <div>
              <p className={styles.statLabel}>Upcoming Consultations</p>
              <p className={styles.statValue}>{patientsOverviewStats.upcomingConsultations}</p>
            </div>
            <div className={`${styles.statIcon} ${styles.iconBlue}`}>📅</div>
          </article>
        </div>

        <section className={`${styles.panel} ${styles.panelBorderBlend}`}>
          <div className={styles.panelHeader}>
            <h2 className={`${styles.panelTitle} ${styles.panelTitleSm}`}>
              <span className={styles.panelIcon}>✚</span>
              Patients with IoT Alerts
            </h2>
            <span className={styles.pill}>AI Monitored</span>
          </div>

          <table className={styles.table}>
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Alert Type</th>
                <th>Deviation Severity</th>
                <th>Last Sync</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {patientAlerts.map((alert) => (
                <tr key={alert.id}>
                  <td>
                    <div className={styles.personCell}>
                      <span className={styles.avatar}>{alert.avatarLabel}</span>
                      <span className={styles.personName}>{alert.patientName}</span>
                    </div>
                  </td>
                  <td>{alert.alertType}</td>
                  <td>
                    <span className={severityClass(alert.severity)}>
                      {alert.severity === "high" ? "High Priority" : alert.severity === "warning" ? "Warning" : "Info"}
                    </span>
                  </td>
                  <td className={styles.muted}>{alert.lastSync}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.actionLink}
                      onClick={() => onNavigate("/nutritionist/patients/michael-chen")}
                    >
                      Review Data
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </SharedLayout>
  );
}
