import { useEffect, useMemo, useState } from "react";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import {
  approveNutritionistPatientRelation,
  deleteNutritionistPatientRelation,
  getNutritionistPatientRelations,
  getPatientUserSummaries,
  type NutritionistPatientRelation,
  type PatientUserSummary,
} from "../../infrastructure/api/nutritionistPatients.api";
import styles from "./PatientsPages.module.css";

interface NutritionistPatientsPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

type TabKey = "requests" | "patients";

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

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function patientNameFor(relation: NutritionistPatientRelation, users: PatientUserSummary[]) {
  const patient = users.find((user) => String(user.id) === String(relation.patientUserId));
  return patient?.fullName || patient?.username || `Patient #${relation.patientUserId}`;
}

export function NutritionistPatientsPage({ currentPath, onNavigate }: NutritionistPatientsPageProps) {
  const [relations, setRelations] = useState<NutritionistPatientRelation[]>([]);
  const [patientUsers, setPatientUsers] = useState<PatientUserSummary[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("requests");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);
  const navigationItems = useNavigation();

  const pendingRequests = useMemo(
    () => relations.filter((relation) => !relation.accepted),
    [relations],
  );

  const acceptedPatients = useMemo(
    () => relations.filter((relation) => relation.accepted),
    [relations],
  );

  const visibleRelations = activeTab === "requests" ? pendingRequests : acceptedPatients;

  const loadRelations = async () => {
    const nutritionistId = getSessionUserId();
    setLoading(true);
    setError(null);

    try {
      const [items, users] = await Promise.all([
        getNutritionistPatientRelations(nutritionistId),
        getPatientUserSummaries(),
      ]);
      setRelations(items);
      setPatientUsers(users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load patients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRelations();
  }, []);

  const approveRequest = async (id: number) => {
    setActionId(id);
    setError(null);

    try {
      await approveNutritionistPatientRelation(id);
      setRelations((current) =>
        current.map((relation) =>
          relation.id === id ? { ...relation, accepted: true } : relation,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve request.");
    } finally {
      setActionId(null);
    }
  };

  const removeRelation = async (id: number) => {
    setActionId(id);
    setError(null);

    try {
      await deleteNutritionistPatientRelation(id);
      setRelations((current) => current.filter((relation) => relation.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove relation.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <SharedLayout
      title="Patient Requests"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={navigationItems}
      breadcrumbs={["Patients", "Requests"]}
      showPageTitle={false}
    >
      <div className={`${styles.stack} ${styles.requestsPage}`}>
        <header className={styles.requestsHero}>
          <div>
            <h1>Patient Requests</h1>
            <p>Review and manage new patient requests.</p>
          </div>
        </header>

        <div className={styles.requestStatsGrid}>
          <article className={`${styles.requestStatCard} ${styles.requestStatAmber}`}>
            <div className={styles.requestStatIcon}>◷</div>
            <div className={styles.requestStatBody}>
              <p className={styles.requestStatLabel}>Pending Requests</p>
              <p className={styles.requestStatValue}>{pendingRequests.length}</p>
              <span>Awaiting your response</span>
            </div>
            <span className={styles.requestStatBadge}>!</span>
          </article>

          <article className={`${styles.requestStatCard} ${styles.requestStatGreen}`}>
            <div className={styles.requestStatIcon}>✓</div>
            <div className={styles.requestStatBody}>
              <p className={styles.requestStatLabel}>Accepted Patients</p>
              <p className={styles.requestStatValue}>{acceptedPatients.length}</p>
              <span>Successfully added</span>
            </div>
            <span className={styles.requestStatBadge}>+</span>
          </article>

          <article className={`${styles.requestStatCard} ${styles.requestStatBlue}`}>
            <div className={styles.requestStatIcon}>#</div>
            <div className={styles.requestStatBody}>
              <p className={styles.requestStatLabel}>Total Relations</p>
              <p className={styles.requestStatValue}>{relations.length}</p>
              <span>All time relations</span>
            </div>
            <span className={styles.requestStatBadge}>#</span>
          </article>
        </div>

        <div className={styles.requestsToolbar}>
          <label className={styles.requestSearchWrap}>
            <span className={styles.searchIcon} aria-hidden="true" />
            <input type="search" placeholder="Search patient by name or ID..." />
          </label>
          <button type="button" className={styles.requestRefreshButton} onClick={loadRelations} disabled={loading}>
            ↻ Refresh
          </button>
        </div>

        <section className={`${styles.panel} ${styles.requestsTablePanel}`}>
          <div className={styles.requestTabs}>
            <button
              type="button"
              className={`${styles.requestTab} ${activeTab === "requests" ? styles.requestTabActive : ""}`}
              onClick={() => setActiveTab("requests")}
            >
              Requests ({pendingRequests.length})
            </button>
            <button
              type="button"
              className={`${styles.requestTab} ${activeTab === "patients" ? styles.requestTabActive : ""}`}
              onClick={() => setActiveTab("patients")}
            >
              Patients ({acceptedPatients.length})
            </button>
          </div>

          {error && <p className={styles.errorText}>{error}</p>}
          {loading && <p className={styles.muted}>Loading patient relations...</p>}

          {!loading && (
            <div className={styles.requestsTableScroll}>
              <table className={`${styles.table} ${styles.requestsTable}`}>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Service</th>
                    <th>Requested</th>
                    <th>Scheduled</th>
                    <th>Status</th>
                    <th className={styles.alignCenter}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRelations.map((relation) => {
                    const patientName = patientNameFor(relation, patientUsers);
                    const busy = actionId === relation.id;

                    return (
                      <tr key={relation.id}>
                        <td>
                          <div className={styles.personCell}>
                            <span className={styles.requestAvatar}>{getInitials(patientName)}</span>
                            <div>
                              <span className={styles.personName}>{patientName}</span>
                              <span className={styles.personSubtext}>Relation #{relation.id}</span>
                            </div>
                          </div>
                        </td>
                        <td>{relation.serviceType || "-"}</td>
                        <td className={styles.requestDateCell}>
                          <span className={styles.requestDateValue}>
                            <span className={styles.calendarIcon} aria-hidden="true" />
                            {formatDate(relation.requestedAt)}
                          </span>
                        </td>
                        <td className={styles.requestDateCell}>
                          <span className={styles.requestDateValue}>
                            <span className={styles.calendarIcon} aria-hidden="true" />
                            {formatDate(relation.scheduledAt || relation.startDate)}
                          </span>
                        </td>
                        <td>
                          <span className={relation.accepted ? styles.statusAccepted : styles.statusPending}>
                            {relation.accepted ? "Accepted" : "Pending"}
                          </span>
                        </td>
                        <td>
                          <div className={styles.requestActionGroup}>
                            {!relation.accepted && (
                              <button
                                type="button"
                                className={styles.primaryActionButton}
                                onClick={() => approveRequest(relation.id)}
                                disabled={busy}
                              >
                                {busy ? "Approving" : "Approve"}
                              </button>
                            )}
                            <button
                              type="button"
                              className={styles.requestRemoveButton}
                              onClick={() => removeRelation(relation.id)}
                              disabled={busy}
                            >
                              {relation.accepted ? "Remove" : "Reject"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && visibleRelations.length === 0 && (
            <p className={styles.emptyState}>
              {activeTab === "requests"
                ? "No pending requests."
                : "No accepted patients yet."}
            </p>
          )}

          <div className={styles.requestsFooter}>
            <span>Showing {visibleRelations.length > 0 ? 1 : 0} to {visibleRelations.length} of {visibleRelations.length} {activeTab === "requests" ? "requests" : "patients"}</span>
            <div className={styles.requestsPager}>
              <button type="button" disabled>‹</button>
              <span>1</span>
              <button type="button" disabled>›</button>
              <select defaultValue="10">
                <option value="10">10 / page</option>
              </select>
            </div>
          </div>
        </section>
      </div>
    </SharedLayout>
  );
}
