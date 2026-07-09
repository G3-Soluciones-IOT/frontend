import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL, apiUrl } from "@/app/config/env";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import {
  getNutritionistPatientRelations,
  type NutritionistPatientRelation,
} from "../../infrastructure/api/nutritionistPatients.api";
import styles from "./PatientsPages.module.css";

interface PatientsDirectoryPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

interface NutritionistProfile {
  id: number | string;
  userId: number | string;
}

interface PatientProfile {
  id: number | string;
  name?: string;
  username?: string;
  fullName?: string;
  email?: string;
  birthDate?: string;
  profilePictureUrl?: string;
  userProfileId?: number | string;
  userId?: number | string;
}

interface PatientNutritionProfile {
  id?: number | string;
  userId?: number | string;
  gender?: string;
  height?: number;
  weight?: number;
  userScore?: number;
  birthDate?: string;
  activityLevelId?: number | string;
  activityLevelName?: string;
  objectiveId?: number | string;
  objectiveName?: string;
  allergyNames?: string[];
}

interface ObjectiveOption {
  id: number | string;
  objectiveName?: string;
  name?: string;
}

interface ActivityOption {
  id: number | string;
  name: string;
}

interface LocalUser {
  id: number | string;
  username?: string;
  fullName?: string;
  email?: string;
  profilePictureUrl?: string;
}

interface DirectoryRow {
  relation: NutritionistPatientRelation;
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

function isLocalMockApi() {
  return API_BASE_URL.includes("localhost:3001");
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
  if (isLocalMockApi()) {
    const params = new URLSearchParams({ userId: String(userId) });
    const nutritionists = await fetchJson<NutritionistProfile[]>(`/nutritionists?${params.toString()}`);
    const nutritionist = nutritionists[0];

    if (!nutritionist) {
      throw new Error(`No local nutritionist found for user ${userId}.`);
    }

    return nutritionist;
  }

  return fetchJson<NutritionistProfile>(`/api/v1/nutritionists/by-user?userId=${encodeURIComponent(String(userId))}`);
}

async function getPatientProfile(patientUserId: number | string) {
  if (isLocalMockApi()) {
    const [users, userProfiles] = await Promise.all([
      fetchJson<LocalUser[]>("/users"),
      fetchJson<PatientNutritionProfile[]>("/userProfiles").catch(() => []),
    ]);
    const user = users.find((item) => String(item.id) === String(patientUserId));
    const nutritionProfile = userProfiles.find((item) => String(item.userId) === String(patientUserId));

    if (!user && !nutritionProfile) return undefined;

    return {
      id: user?.id ?? patientUserId,
      userId: user?.id ?? patientUserId,
      userProfileId: nutritionProfile?.id,
      name: user?.fullName ?? user?.username ?? `Patient #${patientUserId}`,
      username: user?.username,
      fullName: user?.fullName,
      email: user?.email,
      birthDate: nutritionProfile?.birthDate,
      profilePictureUrl: user?.profilePictureUrl,
    } satisfies PatientProfile;
  }

  const profileData = await fetchJson<PatientProfile | PatientProfile[]>(`/api/v1/profiles/${patientUserId}`);
  return firstItem(profileData) ?? undefined;
}

async function getPatientNutritionProfile(userProfileId?: number | string, patientUserId?: number | string) {
  if (!userProfileId && !patientUserId) return undefined;

  if (isLocalMockApi()) {
    const userProfiles = await fetchJson<PatientNutritionProfile[]>("/userProfiles");
    return userProfiles.find((item) => String(item.id) === String(userProfileId))
      ?? userProfiles.find((item) => String(item.userId) === String(patientUserId))
      ?? undefined;
  }

  if (!userProfileId) return undefined;

  const nutritionProfileData = await fetchJson<PatientNutritionProfile | PatientNutritionProfile[]>(
    `/api/v1/user-profiles/${userProfileId}`,
  );

  return firstItem(nutritionProfileData) ?? undefined;
}

async function getObjectiveOptions() {
  if (!isLocalMockApi()) {
    return fetchJson<ObjectiveOption[]>("/api/v1/objectives").catch(() => []);
  }

  const profiles = await fetchJson<PatientNutritionProfile[]>("/userProfiles").catch(() => []);
  const byName = new Map<string, ObjectiveOption>();

  profiles.forEach((profile) => {
    if (!profile.objectiveName) return;
    byName.set(normalize(profile.objectiveName), {
      id: profile.objectiveId ?? profile.objectiveName,
      objectiveName: profile.objectiveName,
    });
  });

  return Array.from(byName.values());
}

async function getActivityOptions() {
  if (!isLocalMockApi()) {
    return fetchJson<ActivityOption[]>("/api/v1/activity-levels").catch(() => []);
  }

  const profiles = await fetchJson<PatientNutritionProfile[]>("/userProfiles").catch(() => []);
  const byName = new Map<string, ActivityOption>();

  profiles.forEach((profile) => {
    if (!profile.activityLevelName) return;
    byName.set(normalize(profile.activityLevelName), {
      id: profile.activityLevelId ?? profile.activityLevelName,
      name: profile.activityLevelName,
    });
  });

  return Array.from(byName.values());
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

function patientName(row: DirectoryRow) {
  return row.profile?.name || row.profile?.fullName || row.profile?.username || `Patient #${row.relation.patientUserId}`;
}

function normalize(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function bodyParts(profile?: PatientNutritionProfile) {
  const weight = Number.isFinite(profile?.weight) ? `${profile?.weight} kg` : "-";
  const rawHeight = profile?.height;
  const heightValue = rawHeight && rawHeight > 3 ? rawHeight / 100 : rawHeight;
  const height = Number.isFinite(heightValue) ? `${heightValue?.toFixed(2)} m` : "-";
  return { weight, height };
}

function bmi(profile?: PatientNutritionProfile) {
  if (!profile?.weight || !profile.height) return "-";
  const heightMeters = profile.height > 3 ? profile.height / 100 : profile.height;
  if (!heightMeters) return "-";
  return (profile.weight / (heightMeters * heightMeters)).toFixed(1);
}

function objectiveTone(objectiveName?: string) {
  const value = normalize(objectiveName);
  if (value.includes("loss")) return "Green";
  if (value.includes("muscle")) return "Purple";
  if (value.includes("maintenance")) return "Amber";
  return "Blue";
}

function activityTone(activityLevelName?: string) {
  const value = normalize(activityLevelName);
  if (value.includes("high") || value.includes("active")) return "High";
  if (value.includes("sedentary") || value.includes("low")) return "Low";
  return "Moderate";
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

export function PatientsDirectoryPage({ currentPath, onNavigate }: PatientsDirectoryPageProps) {
  const [relations, setRelations] = useState<NutritionistPatientRelation[]>([]);
  const [rows, setRows] = useState<DirectoryRow[]>([]);
  const [objectives, setObjectives] = useState<ObjectiveOption[]>([]);
  const [activityLevels, setActivityLevels] = useState<ActivityOption[]>([]);
  const [search, setSearch] = useState("");
  const [objectiveFilter, setObjectiveFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const acceptedRelations = useMemo(
    () => relations.filter((relation) => relation.accepted),
    [relations],
  );

  const pendingRequests = useMemo(
    () => relations.filter((relation) => !relation.accepted),
    [relations],
  );

  const weightLossCount = useMemo(
    () => rows.filter((row) => normalize(row.nutritionProfile?.objectiveName) === "weight loss").length,
    [rows],
  );

  const muscleGainCount = useMemo(
    () => rows.filter((row) => normalize(row.nutritionProfile?.objectiveName) === "muscle gain").length,
    [rows],
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const name = patientName(row).toLowerCase();
      const email = normalize(row.profile?.email);
      const id = String(row.relation.patientUserId).toLowerCase();
      const objective = row.nutritionProfile?.objectiveName ?? "";
      const activity = row.nutritionProfile?.activityLevelName ?? "";
      const matchesSearch = !query || name.includes(query) || email.includes(query) || id.includes(query);
      const matchesObjective = objectiveFilter === "all" || normalize(objective) === normalize(objectiveFilter);
      const matchesActivity = activityFilter === "all" || normalize(activity) === normalize(activityFilter);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && row.relation.accepted) ||
        (statusFilter === "pending" && !row.relation.accepted);

      return matchesSearch && matchesObjective && matchesActivity && matchesStatus;
    });
  }, [activityFilter, objectiveFilter, rows, search, statusFilter]);

  const loadDirectory = async () => {
    const userId = getSessionUserId();
    setLoading(true);
    setError(null);

    try {
      const nutritionist = await getNutritionistProfileByUser(userId);

      const [relationItems, objectiveItems, activityItems] = await Promise.all([
        getNutritionistPatientRelations(nutritionist.id),
        getObjectiveOptions(),
        getActivityOptions(),
      ]);

      const rowResults = await Promise.allSettled(
        relationItems.map(async (relation) => {
          const profile = await getPatientProfile(relation.patientUserId).catch(() => undefined);
          const nutritionProfile = await getPatientNutritionProfile(profile?.userProfileId, relation.patientUserId).catch(() => undefined);
          return { relation, profile, nutritionProfile } satisfies DirectoryRow;
        }),
      );

      setRelations(relationItems);
      setObjectives(Array.isArray(objectiveItems) ? objectiveItems : []);
      setActivityLevels(Array.isArray(activityItems) ? activityItems : []);
      setRows(
        rowResults.reduce<DirectoryRow[]>((nextRows, result) => {
          if (result.status === "fulfilled") nextRows.push(result.value);
          return nextRows;
        }, []),
      );
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
          <h1>Patients Directory</h1>
          <p>View and manage all your accepted patients.</p>
        </header>

        <div className={styles.directoryStatsGrid}>
          <DirectoryStatCard tone="green" icon={<UsersIcon />} label="Total Patients" value={acceptedRelations.length} detail="Accepted patients" />
          <DirectoryStatCard tone="blue" icon={<TargetIcon />} label="Weight Loss" value={weightLossCount} detail="Patients" />
          <DirectoryStatCard tone="purple" icon={<DumbbellIcon />} label="Muscle Gain" value={muscleGainCount} detail="Patients" />
          <DirectoryStatCard tone="amber" icon={<PendingIcon />} label="Pending Requests" value={pendingRequests.length} detail="Awaiting response" />
        </div>

        <div className={styles.directoryFilterBar}>
          <div className={styles.directoryFilterGroup}>
            <label className={styles.searchWrap}>
              <span className={styles.searchIcon} aria-hidden="true" />
              <input
                className={styles.searchInput}
                type="search"
                placeholder="Search by patient name or email..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <select className={styles.rangeSelect} value={objectiveFilter} onChange={(event) => setObjectiveFilter(event.target.value)}>
              <option value="all">All Objectives</option>
              {objectives.map((objective) => {
                const label = objective.objectiveName ?? objective.name ?? String(objective.id);
                return (
                  <option key={objective.id} value={label}>
                    {label}
                  </option>
                );
              })}
            </select>
            <select className={styles.rangeSelect} value={activityFilter} onChange={(event) => setActivityFilter(event.target.value)}>
              <option value="all">All Activity Levels</option>
              {activityLevels.map((activity) => (
                <option key={activity.id} value={activity.name}>
                  {activity.name}
                </option>
              ))}
            </select>
            <select className={styles.rangeSelect} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <button type="button" className={styles.directoryExportButton} onClick={loadDirectory} disabled={loading}>
            Refresh
          </button>
        </div>

        <section className={`${styles.panel} ${styles.directoryCard}`}>
          {error && <p className={styles.errorText}>{error}</p>}
          {loading && <p className={styles.directoryMessage}>Loading patient profiles...</p>}

          {!loading && filteredRows.length > 0 && (
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
                  {filteredRows.map((row) => {
                    const name = patientName(row);
                    const patientId = row.relation.patientUserId;
                    const objective = row.nutritionProfile?.objectiveName ?? "-";
                    const activity = row.nutritionProfile?.activityLevelName ?? "-";
                    const body = bodyParts(row.nutritionProfile);

                    return (
                      <tr key={`${row.relation.id}-${patientId}`}>
                        <td>
                          <button
                            type="button"
                            className={styles.patientLink}
                            onClick={() => onNavigate(`/nutritionist/patients/${patientId}`)}
                          >
                            <span className={styles.personCell}>
                              {row.profile?.profilePictureUrl ? (
                                <img className={styles.directoryAvatarImage} src={row.profile.profilePictureUrl} alt="" />
                              ) : (
                                <span className={styles.avatar}>{getInitials(name)}</span>
                              )}
                              <span>
                                <span className={styles.personName}>{name}</span>
                                <span className={styles.personSubtext}>{row.profile?.email || "-"}</span>
                                <span className={styles.personSubtext}>ID: #USR-{String(patientId).padStart(4, "0")}</span>
                              </span>
                            </span>
                          </button>
                        </td>
                        <td>
                          <span className={`${styles.objectivePill} ${styles[`objective${objectiveTone(objective)}`]}`}>
                            {objective}
                          </span>
                        </td>
                        <td>
                          <div className={styles.directoryActivityCell}>
                            <span className={`${styles.directoryActivityIcon} ${styles[`directoryActivity${activityTone(activity)}`]}`}>
                              <ActivityIcon />
                            </span>
                            <div>
                              <span className={styles.personName}>{activity}</span>
                              <span className={styles.personSubtext}>{activityTone(activity)} Activity</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.directoryBodyData}>
                            <span>{body.weight}</span>
                            <i />
                            <span>{body.height}</span>
                          </div>
                          <span className={styles.personSubtext}>BMI: {bmi(row.nutritionProfile)}</span>
                        </td>
                        <td>
                          <span className={row.relation.accepted ? styles.statusAccepted : styles.statusPending}>
                            {row.relation.accepted ? "Active" : "Pending"}
                          </span>
                          <span className={styles.personSubtext}>Since {formatDate(row.relation.startDate || row.relation.requestedAt)}</span>
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

          {!loading && filteredRows.length === 0 && (
            <p className={styles.emptyState}>No accepted patient profiles found.</p>
          )}

          <div className={styles.tableFooter}>
            <span className={styles.footnote}>
              Showing {filteredRows.length > 0 ? 1 : 0} to {filteredRows.length} of {filteredRows.length} patients
            </span>
            <div className={styles.pager}>
              <button type="button" className={styles.secondaryButton} disabled>{"<"}</button>
              <button type="button" className={`${styles.secondaryButton} ${styles.directoryPageButton}`}>1</button>
              <button type="button" className={styles.secondaryButton} disabled>{">"}</button>
            </div>
          </div>
        </section>
      </div>
    </SharedLayout>
  );
}

function DirectoryStatCard({
  tone,
  icon,
  label,
  value,
  detail,
}: {
  tone: "green" | "blue" | "purple" | "amber";
  icon: React.ReactNode;
  label: string;
  value: number;
  detail: string;
}) {
  const toneClass =
    tone === "green"
      ? styles.directoryStatGreen
      : tone === "blue"
        ? styles.directoryStatBlue
        : tone === "purple"
          ? styles.directoryStatPurple
          : styles.directoryStatAmber;

  return (
    <article className={styles.directoryStatCard}>
      <span className={`${styles.directoryStatIcon} ${toneClass}`}>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
    </article>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M16 20v-1.5A3.5 3.5 0 0 0 12.5 15h-5A3.5 3.5 0 0 0 4 18.5V20" />
      <circle cx="10" cy="8" r="3.5" />
      <path d="M20 20v-1.2a3 3 0 0 0-2-2.8" />
      <path d="M17 5.5a3 3 0 0 1 0 5" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function DumbbellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M6 8v8" />
      <path d="M18 8v8" />
      <path d="M3 10v4" />
      <path d="M21 10v4" />
      <path d="M6 12h12" />
    </svg>
  );
}

function PendingIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M13 4 8 14h5l-2 6 6-10h-5l1-6Z" />
    </svg>
  );
}
