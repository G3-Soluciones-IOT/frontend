import { patientsOverviewStats } from "../../infrastructure/mock/patients.mock";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import { PatientIotAlertsTable } from "../components/PatientIotAlertsTable";
import styles from "./PatientsPages.module.css";

interface PatientsOverviewPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

export function PatientsOverviewPage({ currentPath, onNavigate }: PatientsOverviewPageProps) {
  return (
    <SharedLayout
      title="Patients Overview"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={useNavigation()}
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
              <p className={styles.statLabel}>Today&apos;s Alerts</p>
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

        <PatientIotAlertsTable onNavigate={onNavigate} />
      </div>
    </SharedLayout>
  );
}
