import { patientDirectory } from "../../infrastructure/mock/patients.mock";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import styles from "./PatientsPages.module.css";

interface PatientsDirectoryPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

function statusClass(status: "active" | "on_hold" | "completed") {
  if (status === "active") return `${styles.statusPill} ${styles.pill}`;
  if (status === "on_hold") return `${styles.statusPill} ${styles.severityPill} ${styles.severityInfo}`;
  return `${styles.statusPill} ${styles.severityPill} ${styles.severityWarning}`;
}

export function PatientsDirectoryPage({ currentPath, onNavigate }: PatientsDirectoryPageProps) {
  return (
    <SharedLayout
      title="Patient Directory"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={useNavigation()}
      breadcrumbs={["Patients", "Directory"]}
    >
      <div className={styles.stack}>
        <div className={styles.toolbar}>
          <div />
          <label className={styles.searchWrap}>
            <span className={styles.searchIcon}>⌕</span>
            <input className={styles.searchInput} type="search" placeholder="Search patients..." />
          </label>
        </div>

        <section className={`${styles.panel} ${styles.directoryCard}`}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Goal</th>
                <th>Last Activity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {patientDirectory.slice(0, 4).map((patient) => (
                <tr key={patient.id}>
                  <td>
                    <button
                      type="button"
                      className={styles.textLink}
                      onClick={() => onNavigate("/nutritionist/patients/michael-chen")}
                    >
                      <span className={styles.personCell}>
                        <span className={styles.avatar}>{patient.avatarLabel}</span>
                        <span>
                          <span className={styles.personName}>{patient.name}</span>
                          <span className={styles.personSubtext}>{patient.email}</span>
                        </span>
                      </span>
                    </button>
                  </td>
                  <td>
                    <span className={styles.personName}>{patient.goal}</span>
                    <span className={styles.personSubtext}>{patient.phase}</span>
                  </td>
                  <td>{patient.lastActivity}</td>
                  <td>
                    <span className={statusClass(patient.status)}>
                      {patient.status === "active"
                        ? "Active"
                        : patient.status === "on_hold"
                          ? "On Hold"
                          : "Completed"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.tableFooter}>
            <span className={styles.footnote}>Showing 1 to 4 of 124 results</span>
            <div className={styles.pager}>
              <button type="button" className={styles.secondaryButton} disabled>
                Previous
              </button>
              <button type="button" className={styles.secondaryButton}>
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </SharedLayout>
  );
}
