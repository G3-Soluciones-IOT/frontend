import { patientAlerts } from "../../infrastructure/mock/patients.mock";
import styles from "../pages/PatientsPages.module.css";

interface PatientIotAlertsTableProps {
  onNavigate: (href: string) => void;
}

function severityClass(severity: "high" | "warning" | "info") {
  if (severity === "high") return `${styles.severityPill} ${styles.severityHigh}`;
  if (severity === "warning") return `${styles.severityPill} ${styles.severityWarning}`;
  return `${styles.severityPill} ${styles.severityInfo}`;
}

export function PatientIotAlertsTable({ onNavigate }: PatientIotAlertsTableProps) {
  return (
    <section className={`${styles.panel} ${styles.panelBorderBlend}`}>
      <div className={styles.panelHeader}>
        <h2 className={`${styles.panelTitle} ${styles.panelTitleSm}`}>
          <span className={styles.panelIcon}>IoT</span>
          Patients with IoT Alerts
        </h2>
        <span className={styles.pill}>AI Monitored</span>
      </div>

      <div className={styles.tableScroll}>
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
      </div>
    </section>
  );
}
