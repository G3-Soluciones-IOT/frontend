import { useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/app/config/env";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import { useI18n } from "@/shared/i18n/useI18n";
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

type TabKey = "requests" | "patients" | "all";

interface NutritionistProfile {
  id: number | string;
  userId: number | string;
}

interface PatientProfile {
  id: number | string;
  name?: string;
  email?: string;
  birthDate?: string;
  userProfileId?: number | string;
}

interface PatientNutritionProfile {
  birthDate?: string;
  objectiveName?: string;
  activityLevelName?: string;
  height?: number;
  weight?: number;
}

interface PatientRequestDetails {
  profile?: PatientProfile;
  nutritionProfile?: PatientNutritionProfile;
}

function getSessionUserId() {
  const session = JSON.parse(localStorage.getItem("session") || "null");
  return session?.user?.id ?? "";
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(apiUrl(path), {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function firstItem<T>(data: T | T[]) {
  return Array.isArray(data) ? data[0] ?? null : data;
}

async function getNutritionistProfileByUser(userId: number | string) {
  return fetchJson<NutritionistProfile>(`/api/v1/nutritionists/by-user?userId=${encodeURIComponent(String(userId))}`);
}

async function getPatientRequestDetails(patientUserId: number | string): Promise<PatientRequestDetails> {
  const nutritionData = await fetchJson<PatientNutritionProfile & { id?: number | string }>(
    `/api/v1/user-profiles/by-user/${encodeURIComponent(String(patientUserId))}`,
  );
  const profiles = await fetchJson<PatientProfile[]>("/api/v1/profiles");
  const profile = profiles.find((item) => String(item.userProfileId) === String(nutritionData.id));

  if (!profile?.userProfileId) return { profile };

  try {
    const nutritionData = await fetchJson<PatientNutritionProfile | PatientNutritionProfile[]>(
      `/api/v1/user-profiles/${profile.userProfileId}`,
    );

    return { profile, nutritionProfile: firstItem(nutritionData) ?? undefined };
  } catch {
    return { profile };
  }
}

function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "P"
  );
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calculateAge(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

function serviceLabel(value?: string) {
  if (!value) return "-";

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function patientNameFor(
  relation: NutritionistPatientRelation,
  users: PatientUserSummary[],
  details: Record<string, PatientRequestDetails>,
) {
  const detail = details[String(relation.patientUserId)];
  if (detail?.profile?.name) return detail.profile.name;

  const patient = users.find((user) => String(user.id) === String(relation.patientUserId));
  return patient?.fullName || patient?.username || `Patient #${relation.patientUserId}`;
}

export function NutritionistPatientsPage({ currentPath, onNavigate }: NutritionistPatientsPageProps) {
  const { t } = useI18n();
  const [relations, setRelations] = useState<NutritionistPatientRelation[]>([]);
  const [patientUsers, setPatientUsers] = useState<PatientUserSummary[]>([]);
  const [patientDetails, setPatientDetails] = useState<Record<string, PatientRequestDetails>>({});
  const [activeTab, setActiveTab] = useState<TabKey>("requests");
  const [search, setSearch] = useState("");
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

  const dietPlanRequests = useMemo(
    () => relations.filter((relation) => relation.serviceType === "DIET_PLAN").length,
    [relations],
  );

  const visibleRelations = useMemo(() => {
    const byTab = activeTab === "requests" ? pendingRequests : activeTab === "patients" ? acceptedPatients : relations;
    const query = search.trim().toLowerCase();

    if (!query) return byTab;

    return byTab.filter((relation) => {
      const name = patientNameFor(relation, patientUsers, patientDetails).toLowerCase();
      const patientId = String(relation.patientUserId).toLowerCase();
      const relationId = String(relation.id).toLowerCase();
      return name.includes(query) || patientId.includes(query) || relationId.includes(query);
    });
  }, [acceptedPatients, activeTab, patientDetails, patientUsers, pendingRequests, relations, search]);

  const loadRelations = async () => {
    const userId = getSessionUserId();
    setLoading(true);
    setError(null);

    try {
      const nutritionist = await getNutritionistProfileByUser(userId);
      const [items, users] = await Promise.all([
        getNutritionistPatientRelations(nutritionist.id),
        getPatientUserSummaries(),
      ]);

      const detailResults = await Promise.allSettled(
        items.map(async (relation) => ({
          patientUserId: String(relation.patientUserId),
          details: await getPatientRequestDetails(relation.patientUserId),
        })),
      );

      const nextDetails = detailResults.reduce<Record<string, PatientRequestDetails>>((map, result) => {
        if (result.status === "fulfilled") {
          map[result.value.patientUserId] = result.value.details;
        }
        return map;
      }, {});

      setRelations(items);
      setPatientUsers(users);
      setPatientDetails(nextDetails);
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
      title={t("requests.title")}
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={navigationItems}
      breadcrumbs={[t("patients.breadcrumb.patients"), t("requests.breadcrumb")]}
      showPageTitle={false}
    >
      <div className={`${styles.stack} ${styles.requestsPage}`}>
        <header className={styles.requestsHero}>
          <div>
            <h1>{t("requests.title")}</h1>
            <p>{t("requests.description")}</p>
          </div>
        </header>

        <div className={styles.requestStatsGrid}>
          <RequestStatCard
            tone="amber"
            icon={<ClockIcon />}
            label={t("requests.stats.pending")}
            value={pendingRequests.length}
            description={t("requests.stats.pending.description")}
          />
          <RequestStatCard
            tone="green"
            icon={<CheckCircleIcon />}
            label={t("requests.stats.accepted")}
            value={acceptedPatients.length}
            description={t("requests.stats.accepted.description")}
          />
          <RequestStatCard
            tone="blue"
            icon={<RelationsIcon />}
            label={t("requests.stats.total")}
            value={relations.length}
            description={t("requests.stats.total.description")}
          />
          <RequestStatCard
            tone="purple"
            icon={<CalendarCardIcon />}
            label={t("requests.stats.dietPlan")}
            value={dietPlanRequests}
            description={t("requests.stats.dietPlan.description")}
          />
        </div>

        <div className={styles.requestsToolbar}>
          <div className={styles.requestTabs}>
            <button
              type="button"
              className={`${styles.requestTab} ${activeTab === "requests" ? styles.requestTabActive : ""}`}
              onClick={() => setActiveTab("requests")}
            >
              {t("requests.tab.pending")} ({pendingRequests.length})
            </button>
            <button
              type="button"
              className={`${styles.requestTab} ${activeTab === "patients" ? styles.requestTabActive : ""}`}
              onClick={() => setActiveTab("patients")}
            >
              {t("requests.tab.accepted")} ({acceptedPatients.length})
            </button>
            <button
              type="button"
              className={`${styles.requestTab} ${activeTab === "all" ? styles.requestTabActive : ""}`}
              onClick={() => setActiveTab("all")}
            >
              {t("requests.tab.all")} ({relations.length})
            </button>
          </div>

          <label className={styles.requestSearchWrap}>
            <span className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              placeholder={t("requests.search.placeholder")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        <section className={`${styles.panel} ${styles.requestsTablePanel}`}>
          {error && <p className={styles.errorText}>{error}</p>}
          {loading && <p className={styles.muted}>{t("requests.loading")}</p>}

          {!loading && (
            <div className={styles.requestsTableScroll}>
              <table className={`${styles.table} ${styles.requestsTable}`}>
                <thead>
                  <tr>
                    <th>{t("patients.table.patient")}</th>
                    <th>{t("requests.table.serviceType")}</th>
                    <th>{t("requests.table.requestedAt")}</th>
                    <th>{t("requests.table.scheduledAt")}</th>
                    <th>{t("patients.table.status")}</th>
                    <th className={styles.alignCenter}>{t("requests.table.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRelations.map((relation) => {
                    const patientName = patientNameFor(relation, patientUsers, patientDetails);
                    const detail = patientDetails[String(relation.patientUserId)];
                    const age =
                      calculateAge(detail?.profile?.birthDate) ??
                      calculateAge(detail?.nutritionProfile?.birthDate);
                    const busy = actionId === relation.id;

                    return (
                      <tr key={relation.id}>
                        <td>
                          <div className={styles.personCell}>
                            <span className={styles.requestAvatar}>{getInitials(patientName)}</span>
                            <div>
                              <span className={styles.personName}>{patientName}</span>
                              <span className={styles.personSubtext}>
                                ID: #USR-{String(relation.patientUserId).padStart(4, "0")}
                              </span>
                              {age !== null && <span className={styles.personSubtext}>{age} {t("requests.yearsOld")}</span>}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={styles.requestServicePill}>
                            {serviceLabel(relation.serviceType)}
                            <small>{t("requests.nutritionService")}</small>
                          </span>
                        </td>
                        <td className={styles.requestDateCell}>
                          <span className={styles.requestDateValue}>
                            <span className={styles.calendarIcon} aria-hidden="true" />
                            {formatDateTime(relation.requestedAt)}
                          </span>
                        </td>
                        <td className={styles.requestDateCell}>
                          <span className={styles.requestDateValue}>
                            <span className={styles.calendarIcon} aria-hidden="true" />
                            {formatDateTime(relation.scheduledAt || relation.startDate)}
                          </span>
                        </td>
                        <td>
                          <span className={relation.accepted ? styles.statusAccepted : styles.statusPending}>
                            {relation.accepted ? t("patients.status.accepted") : t("patients.status.pending")}
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
                                {busy ? t("requests.action.approving") : t("requests.action.approve")}
                              </button>
                            )}
                            <button
                              type="button"
                              className={styles.requestRemoveButton}
                              onClick={() => removeRelation(relation.id)}
                              disabled={busy}
                            >
                              {relation.accepted ? t("requests.action.remove") : t("requests.action.reject")}
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
                ? t("requests.empty.pending")
                : activeTab === "patients"
                  ? t("requests.empty.accepted")
                  : t("requests.empty.all")}
            </p>
          )}

          <div className={styles.requestsFooter}>
            <span>
              {t("patients.directory.showing")} {visibleRelations.length > 0 ? 1 : 0} {t("patients.directory.to")} {visibleRelations.length} {t("patients.directory.of")} {visibleRelations.length}{" "}
              {activeTab === "requests" ? t("requests.footer.requests") : activeTab === "patients" ? t("patients.directory.patients") : t("requests.footer.relations")}
            </span>
            <div className={styles.requestsPager}>
              <button type="button" disabled>{"<"}</button>
              <span>1</span>
              <button type="button" disabled>{">"}</button>
            </div>
          </div>
        </section>

        <aside className={styles.requestTipBox}>
          <div className={styles.requestTipIcon}><TipIcon /></div>
          <div>
            <strong>{t("requests.tip.title")}</strong>
            <p>{t("requests.tip.description")}</p>
          </div>
          <button type="button" onClick={() => onNavigate("/nutritionist/patients/directory")}>
            {t("requests.tip.button")}
          </button>
        </aside>
      </div>
    </SharedLayout>
  );
}

function RequestStatCard({
  tone,
  icon,
  label,
  value,
  description,
}: {
  tone: "amber" | "green" | "blue" | "purple";
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
}) {
  const toneClass =
    tone === "amber"
      ? styles.requestStatAmber
      : tone === "green"
        ? styles.requestStatGreen
        : tone === "blue"
          ? styles.requestStatBlue
          : styles.requestStatPurple;

  return (
    <article className={`${styles.requestStatCard} ${toneClass}`}>
      <div className={styles.requestStatIcon}>{icon}</div>
      <div className={styles.requestStatBody}>
        <p className={styles.requestStatLabel}>{label}</p>
        <p className={styles.requestStatValue}>{value}</p>
        <span>{description}</span>
      </div>
    </article>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="m8.5 12.5 2.4 2.4 4.8-5.3" />
    </svg>
  );
}

function RelationsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M16 20v-1.5A3.5 3.5 0 0 0 12.5 15h-5A3.5 3.5 0 0 0 4 18.5V20" />
      <circle cx="10" cy="8" r="3.5" />
      <path d="M20 20v-1.2a3 3 0 0 0-2-2.8" />
      <path d="M17 5.5a3 3 0 0 1 0 5" />
    </svg>
  );
}

function CalendarCardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M5 10h14" />
    </svg>
  );
}

function TipIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M8.5 14.5A6 6 0 1 1 15.5 14c-.9.7-1.5 1.5-1.5 2.5h-4c0-.9-.6-1.6-1.5-2Z" />
    </svg>
  );
}
