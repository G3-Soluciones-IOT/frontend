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
      title="Patients"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={navigationItems}
      breadcrumbs={["Nutritionist", "Patients"]}
    >
      <div className={styles.stack}>
        <div className={styles.statsGrid}>
          <article className={`${styles.statCard} ${styles.statCardAccentAmber}`}>
            <div>
              <p className={styles.statLabel}>Pending Requests</p>
              <p className={styles.statValue}>{pendingRequests.length}</p>
            </div>
            <div className={`${styles.statIcon} ${styles.iconAmber}`}>!</div>
          </article>

          <article className={`${styles.statCard} ${styles.statCardAccentGreen}`}>
            <div>
              <p className={styles.statLabel}>Accepted Patients</p>
              <p className={styles.statValue}>{acceptedPatients.length}</p>
            </div>
            <div className={`${styles.statIcon} ${styles.iconGreen}`}>+</div>
          </article>

          <article className={`${styles.statCard} ${styles.statCardAccentBlue}`}>
            <div>
              <p className={styles.statLabel}>Total Relations</p>
              <p className={styles.statValue}>{relations.length}</p>
            </div>
            <div className={`${styles.statIcon} ${styles.iconBlue}`}>#</div>
          </article>
        </div>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={`${styles.panelTitle} ${styles.panelTitleSm}`}>
              Patient Requests
            </h2>
            <button type="button" className={styles.secondaryButton} onClick={loadRelations} disabled={loading}>
              Refresh
            </button>
          </div>

          <div className={styles.segmentedTabs}>
            <button
              type="button"
              className={`${styles.segmentedTab} ${activeTab === "requests" ? styles.segmentedTabActive : ""}`}
              onClick={() => setActiveTab("requests")}
            >
              Requests ({pendingRequests.length})
            </button>
            <button
              type="button"
              className={`${styles.segmentedTab} ${activeTab === "patients" ? styles.segmentedTabActive : ""}`}
              onClick={() => setActiveTab("patients")}
            >
              Patients ({acceptedPatients.length})
            </button>
          </div>

          {error && <p className={styles.errorText}>{error}</p>}
          {loading && <p className={styles.muted}>Loading patient relations...</p>}

          {!loading && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Service</th>
                  <th>Requested</th>
                  <th>Scheduled</th>
                  <th>Status</th>
                  <th>Actions</th>
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
                          <span className={styles.avatar}>{getInitials(patientName)}</span>
                          <div>
                            <span className={styles.personName}>{patientName}</span>
                            <span className={styles.personSubtext}>Relation #{relation.id}</span>
                          </div>
                        </div>
                      </td>
                      <td>{relation.serviceType || "-"}</td>
                      <td className={styles.muted}>{formatDate(relation.requestedAt)}</td>
                      <td className={styles.muted}>{formatDate(relation.scheduledAt || relation.startDate)}</td>
                      <td>
                        <span className={relation.accepted ? styles.statusAccepted : styles.statusPending}>
                          {relation.accepted ? "Accepted" : "Pending"}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionGroup}>
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
                            className={styles.dangerActionButton}
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
          )}

          {!loading && visibleRelations.length === 0 && (
            <p className={styles.emptyState}>
              {activeTab === "requests"
                ? "No pending requests."
                : "No accepted patients yet."}
            </p>
          )}
        </section>
      </div>
    </SharedLayout>
  );
}
