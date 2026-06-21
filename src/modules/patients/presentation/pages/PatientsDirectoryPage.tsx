import { useEffect, useMemo, useState } from "react";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import {
  getNutritionistPatientRelations,
  getPatientUserSummaries,
  getUserProfiles,
  type NutritionistPatientRelation,
  type PatientUserSummary,
  type UserProfileResource,
} from "../../infrastructure/api/nutritionistPatients.api";
import styles from "./PatientsPages.module.css";

interface PatientsDirectoryPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

interface DirectoryRow {
  profile: UserProfileResource;
  relation?: NutritionistPatientRelation;
  user?: PatientUserSummary;
}

function getSessionUserId() {
  const session = JSON.parse(localStorage.getItem("session") || "null");
  return session?.user?.id ?? "";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "P";
}

function displayName(row: DirectoryRow) {
  return row.user?.fullName || row.user?.username || `Patient #${row.profile.userId ?? row.profile.id}`;
}

function profileUserId(profile: UserProfileResource) {
  return profile.userId ? String(profile.userId) : "";
}

function bodyParts(profile: UserProfileResource) {
  const weight = Number.isFinite(profile.weight) ? `${profile.weight} kg` : "-";
  const heightValue = profile.height > 3 ? profile.height / 100 : profile.height;
  const height = Number.isFinite(heightValue) ? `${heightValue.toFixed(2)} m` : "-";
  return { weight, height };
}

function activityTone(activityLevelName?: string) {
  const value = activityLevelName?.toLowerCase() ?? "";
  if (value.includes("high")) return "High";
  if (value.includes("light") || value.includes("low")) return "Low";
  return "Moderate";
}

function objectiveTone(objectiveName?: string) {
  const value = objectiveName?.toLowerCase() ?? "";
  if (value.includes("loss")) return "Green";
  if (value.includes("muscle")) return "Purple";
  if (value.includes("maintenance")) return "Amber";
  return "Blue";
}

function hasProfileUserIds(profiles: UserProfileResource[]) {
  return profiles.some((profile) => Boolean(profile.userId));
}

export function PatientsDirectoryPage({ currentPath, onNavigate }: PatientsDirectoryPageProps) {
  const [profiles, setProfiles] = useState<UserProfileResource[]>([]);
  const [relations, setRelations] = useState<NutritionistPatientRelation[]>([]);
  const [users, setUsers] = useState<PatientUserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const acceptedRelations = useMemo(
    () => relations.filter((relation) => relation.accepted),
    [relations],
  );

  const rows = useMemo<DirectoryRow[]>(() => {
    const profilesIncludeUserId = hasProfileUserIds(profiles);

    if (!profilesIncludeUserId) {
      return profiles.map((profile) => ({ profile }));
    }

    return acceptedRelations.reduce<DirectoryRow[]>((nextRows, relation) => {
      const profile = profiles.find((item) => profileUserId(item) === String(relation.patientUserId));
      if (!profile) return nextRows;

      const user = users.find((item) => String(item.id) === String(relation.patientUserId));
      nextRows.push({ profile, relation, user });
      return nextRows;
    }, []);
  }, [acceptedRelations, profiles, users]);

  const loadDirectory = async () => {
    const nutritionistId = getSessionUserId();
    setLoading(true);
    setError(null);

    try {
      const [profileItems, relationItems, userItems] = await Promise.all([
        getUserProfiles(),
        getNutritionistPatientRelations(nutritionistId),
        getPatientUserSummaries(),
      ]);

      setProfiles(profileItems);
      setRelations(relationItems);
      setUsers(userItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load patient directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDirectory();
  }, []);

  return (
    <SharedLayout
      title="Patient Directory"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={useNavigation()}
      breadcrumbs={["Patients", "Directory"]}
      showPageTitle={false}
    >
      <div className={`${styles.stack} ${styles.directoryStack}`}>
        <header className={styles.directoryHero}>
          <h1>Patient Directory</h1>
          <p>View and manage all your active patients.</p>
        </header>

        <div className={styles.directoryStatsGrid}>
          <article className={styles.directoryStatCard}>
            <span className={`${styles.directoryStatIcon} ${styles.directoryStatGreen}`}>◉</span>
            <div>
              <p>Total Patients</p>
              <strong>{rows.length || profiles.length}</strong>
              <span>All assigned patients</span>
            </div>
          </article>
          <article className={styles.directoryStatCard}>
            <span className={`${styles.directoryStatIcon} ${styles.directoryStatBlue}`}>✓</span>
            <div>
              <p>Active Patients</p>
              <strong>{rows.length}</strong>
              <span>Currently active</span>
            </div>
          </article>
          <article className={styles.directoryStatCard}>
            <span className={`${styles.directoryStatIcon} ${styles.directoryStatPurple}`}>♙</span>
            <div>
              <p>Inactive Patients</p>
              <strong>0</strong>
              <span>Not active recently</span>
            </div>
          </article>
          <article className={styles.directoryStatCard}>
            <span className={`${styles.directoryStatIcon} ${styles.directoryStatAmber}`}>☼</span>
            <div>
              <p>New This Month</p>
              <strong>{rows.length}</strong>
              <span>New patients added</span>
            </div>
          </article>
        </div>

        <div className={styles.directoryFilterBar}>
          <div className={styles.directoryFilterGroup}>
            <label className={styles.searchWrap}>
              <span className={styles.searchIcon} aria-hidden="true" />
              <input className={styles.searchInput} type="search" placeholder="Search patients by name or ID..." />
            </label>
          </div>
          <button type="button" className={styles.directoryExportButton} onClick={loadDirectory} disabled={loading}>
            Export
          </button>
        </div>

        <section className={`${styles.panel} ${styles.directoryCard}`}>
          {error && <p className={styles.errorText}>{error}</p>}
          {loading && <p className={styles.directoryMessage}>Loading patient profiles...</p>}

          {!loading && rows.length > 0 && (
            <div className={styles.directoryTableScroll}>
              <table className={`${styles.table} ${styles.directoryTable}`}>
                <colgroup>
                  <col className={styles.directoryNameCol} />
                  <col className={styles.directoryGoalCol} />
                  <col className={styles.directoryActivityCol} />
                  <col className={styles.directoryBodyCol} />
                  <col className={styles.directoryStatusCol} />
                  <col className={styles.directoryActionsCol} />
                </colgroup>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Objective</th>
                    <th>Activity Level</th>
                    <th>Body Data</th>
                    <th>Status</th>
                    <th className={styles.alignRight}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const name = displayName(row);
                    const patientId = row.profile.userId ?? row.relation?.patientUserId ?? row.profile.id;

                    return (
                      <tr key={`${row.profile.id}-${patientId}`}>
                        <td>
                          <button
                            type="button"
                            className={styles.patientLink}
                            onClick={() => onNavigate(`/nutritionist/patients/${patientId}`)}
                          >
                            <span className={styles.personCell}>
                              <span className={styles.avatar}>{getInitials(name)}</span>
                              <span>
                                <span className={styles.personName}>{name}</span>
                                <span className={styles.personSubtext}>Profile #{row.profile.id}</span>
                              </span>
                            </span>
                          </button>
                        </td>
                        <td><span className={`${styles.objectivePill} ${styles[`objective${objectiveTone(row.profile.objectiveName)}`]}`}>{row.profile.objectiveName || "-"}</span></td>
                        <td>
                          <div className={styles.directoryActivityCell}>
                            <span className={`${styles.directoryActivityIcon} ${styles[`directoryActivity${activityTone(row.profile.activityLevelName)}`]}`}>⌁</span>
                            <div>
                              <span className={styles.personName}>{row.profile.activityLevelName || "-"}</span>
                              <span className={styles.personSubtext}>{activityTone(row.profile.activityLevelName)} Activity</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.directoryBodyData}>
                            <span>{bodyParts(row.profile).weight}</span>
                            <i />
                            <span>{bodyParts(row.profile).height}</span>
                          </div>
                          <span className={styles.personSubtext}>BMI: 25.5</span>
                        </td>
                        <td>
                          <span className={row.relation?.accepted === false ? styles.statusPending : styles.statusAccepted}>
                            {row.relation?.accepted === false ? "Pending" : "Active"}
                          </span>
                        </td>
                        <td className={styles.alignRight}>
                          <button
                            type="button"
                            className={styles.trackingButton}
                            onClick={() => onNavigate(`/nutritionist/patients/${patientId}`)}
                          >
                            View Profile
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && rows.length === 0 && (
            <p className={styles.emptyState}>No accepted patient profiles found.</p>
          )}

          <div className={styles.tableFooter}>
            <span className={styles.footnote}>Showing {rows.length > 0 ? 1 : 0} to {rows.length} of {rows.length} patients</span>
            <div className={styles.pager}>
              <button type="button" className={styles.secondaryButton} disabled>
                ‹
              </button>
              <button type="button" className={`${styles.secondaryButton} ${styles.directoryPageButton}`}>
                1
              </button>
              <button type="button" className={styles.secondaryButton} disabled>
                ›
              </button>
              <select className={styles.rangeSelect} defaultValue="10">
                <option value="10">10 / page</option>
              </select>
            </div>
          </div>
        </section>
      </div>
    </SharedLayout>
  );
}
