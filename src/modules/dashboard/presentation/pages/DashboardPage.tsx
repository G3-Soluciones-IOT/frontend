import { SharedLayout } from "@/shared/components/layout";
import { navigationConfig } from "@/shared/constants/navigation.config";
import {
  dashboardSummary,
  recentMealLogs,
  todayConsultations,
  type MealLogPreview,
} from "../../infrastructure/mock/dashboard.mock";
import { AlertIcon, PatientsIcon, SparklesIcon, TrendIcon } from "../components/DashboardIcons";
import styles from "./DashboardPage.module.css";

interface DashboardPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

function mealStatusClass(status: MealLogPreview["status"]) {
  if (status === "Approved") return `${styles.statusPill} ${styles.statusApproved}`;
  if (status === "Review Needed") return `${styles.statusPill} ${styles.statusReviewNeeded}`;
  return `${styles.statusPill} ${styles.statusLogged}`;
}

export function DashboardPage({ currentPath, onNavigate }: DashboardPageProps) {
  return (
    <SharedLayout
      title="Dashboard"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={navigationConfig.nutritionist}
      showPageTitle={false}
      topbarTabs={[
        { label: "Overview", href: "/nutritionist", active: currentPath === "/nutritionist" },
        { label: "Recent Logs", href: "/nutritionist/recent-logs", active: currentPath === "/nutritionist/recent-logs" },
      ]}
    >
      <div className={styles.dashboard}>
        <header className={styles.heroHeader}>
          <div>
            <h1 className={styles.heading}>Morning Overview</h1>
            <p className={styles.subheading}>Here is the latest data for your active patients.</p>
          </div>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => onNavigate("/communication/consultations")}
          >
            New Consultation
          </button>
        </header>

        <section className={styles.summaryGrid} aria-label="Dashboard summary">
          <article className={styles.aiCard}>
            <h2 className={styles.aiTitle}>
              <SparklesIcon />
              AI Health Summary
            </h2>
            <p className={styles.aiText}>{dashboardSummary.aiSummary}</p>
            <div className={styles.tagRow}>
              <span className={`${styles.tag} ${styles.tagGreen}`}>
                <TrendIcon />
                {dashboardSummary.tags[0]}
              </span>
              <span className={`${styles.tag} ${styles.tagRed}`}>
                <AlertIcon />
                {dashboardSummary.tags[1]}
              </span>
            </div>
          </article>

          <article className={styles.activePatientsCard}>
            <div>
              <PatientsIcon />
              <p className={styles.patientCount}>{dashboardSummary.activePatients}</p>
              <p className={styles.patientLabel}>Active Patients</p>
            </div>
          </article>
        </section>

        <section className={styles.contentGrid}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Today&apos;s Consultations</h2>
            </div>
            <div className={styles.consultationList}>
              {todayConsultations.map((consultation) => (
                <div className={styles.consultationItem} key={consultation.id}>
                  <span className={`${styles.consultationAvatar} ${consultation.tone === "blue" ? styles.avatarBlue : styles.avatarSlate}`}>
                    {consultation.initials}
                  </span>
                  <div>
                    <p className={styles.consultationName}>{consultation.patientName}</p>
                    <p className={styles.consultationMeta}>
                      {consultation.time} - {consultation.modality}
                    </p>
                  </div>
                  {consultation.status && <span className={styles.upcomingPill}>{consultation.status}</span>}
                </div>
              ))}
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Recent Meal Logs</h2>
              <button
                type="button"
                className={styles.viewAllButton}
                onClick={() => onNavigate("/nutritionist/recent-logs")}
              >
                View All
              </button>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.mealTable}>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Meal Type</th>
                    <th>Calories</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMealLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.patientName}</td>
                      <td>{log.mealType}</td>
                      <td>{log.calories}</td>
                      <td>
                        <span className={mealStatusClass(log.status)}>{log.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </div>
    </SharedLayout>
  );
}
