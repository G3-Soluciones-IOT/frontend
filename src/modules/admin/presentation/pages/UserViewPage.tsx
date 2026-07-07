import { useEffect, useMemo, useState, type ReactNode } from "react";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import { apiUrl } from "@/app/config/env";

interface User {
  id: number | string;
  username: string;
  roles?: string[];
  role?: string;
}

interface Profile {
  id: number | string;
  name?: string;
  email?: string;
  isActive?: boolean;
  birthDate?: string;
  userProfileId?: number | string;
}

interface NutritionProfile {
  id: number | string;
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

interface ProfessionalProfile {
  id: number | string;
  userId: number | string;
  fullName?: string;
  licenseNumber?: string;
  specialty?: string;
  yearsExperience?: number;
  acceptingNewPatients?: boolean;
  bio?: string;
  profilePictureUrl?: string;
}

interface NutritionistPatientRelation {
  id: number | string;
  nutritionistId: number | string;
  patientUserId: number | string;
  serviceType?: string;
  startDate?: string;
  scheduledAt?: string;
  accepted?: boolean;
  requestedAt?: string;
}

interface RecipeIngredient {
  ingredient?: {
    name?: string;
  };
  amountGrams?: number;
}

interface Recipe {
  id: number | string;
  name?: string;
  description?: string;
  category?: string;
  createdByNutritionistId?: number | string;
  nutritionistName?: string;
  preparationTime?: number;
  difficulty?: string;
  ingredients?: RecipeIngredient[];
}

interface MealPlan {
  id: number | string;
  name?: string;
  description?: string;
  calories?: number;
  carbs?: number;
  proteins?: number;
  fats?: number;
  profileId?: number | string;
  category?: string;
  isCurrent?: boolean;
  tags?: string[];
}

interface UserViewPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

function getUserIdFromPath(path: string) {
  return path.split("/")[3] ?? "";
}

function normalizeRole(user: User | null) {
  const role = user?.roles?.[0] ?? user?.role ?? "";
  return role.replace(/^ROLE_/, "").trim().toUpperCase();
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("accessToken");

  return token ? { Authorization: `Bearer ${token}` } : {};
}

function firstItem<T>(data: T | T[]): T | null {
  return Array.isArray(data) ? data[0] ?? null : data;
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(apiUrl(path), {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRoleLabel(role: string) {
  if (!role) return "-";
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function getInitials(value?: string) {
  const parts = value?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return "N";
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
}

export function UserViewPage({ currentPath, onNavigate }: UserViewPageProps) {
  const nav = useNavigation();
  const userId = getUserIdFromPath(currentPath);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nutritionProfile, setNutritionProfile] = useState<NutritionProfile | null>(null);
  const [professionalProfile, setProfessionalProfile] = useState<ProfessionalProfile | null>(null);
  const [relations, setRelations] = useState<NutritionistPatientRelation[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [nutritionistError, setNutritionistError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const acceptedRelations = useMemo(
    () => relations.filter((relation) => relation.accepted),
    [relations],
  );

  const pendingRelations = useMemo(
    () => relations.filter((relation) => !relation.accepted),
    [relations],
  );

  useEffect(() => {
    let ignore = false;

    async function loadUser() {
      try {
        setLoading(true);
        setError(null);
        setProfile(null);
        setNutritionProfile(null);
        setProfessionalProfile(null);
        setRelations([]);
        setRecipes([]);
        setMealPlans([]);
        setProfileError(null);
        setNutritionistError(null);

        const data = await fetchJson<User>(`/api/v1/users/${userId}`);
        if (ignore) return;

        setUser(data);

        const role = normalizeRole(data);

        if (role === "NUTRITIONIST") {
          try {
            const nextProfessionalProfile = await fetchJson<ProfessionalProfile>(
              `/api/v1/nutritionists/by-user?userId=${encodeURIComponent(String(data.id))}`,
            );
            if (ignore) return;

            setProfessionalProfile(nextProfessionalProfile);

            const [nextRelations, nextRecipes, nextMealPlans] = await Promise.all([
              fetchJson<NutritionistPatientRelation[]>(
                `/api/v1/nutritionist-patients/nutritionist/${nextProfessionalProfile.id}`,
              ),
              fetchJson<Recipe[]>(
                `/api/v1/recipes/nutritionists/${data.id}/templates/detailed`,
              ),
              fetchJson<MealPlan[]>(`/api/v1/meal-plan/nutritionists/${data.id}`),
            ]);

            if (ignore) return;

            setRelations(Array.isArray(nextRelations) ? nextRelations : []);
            setRecipes(Array.isArray(nextRecipes) ? nextRecipes : []);
            setMealPlans(Array.isArray(nextMealPlans) ? nextMealPlans : []);
          } catch (err) {
            if (!ignore) {
              setNutritionistError(err instanceof Error ? err.message : "Failed to load nutritionist details.");
            }
          }

          return;
        }

        if (role !== "PATIENT") return;

        try {
          const profileData = await fetchJson<Profile | Profile[]>(`/api/v1/profiles/${data.id}`);
          if (ignore) return;

          const resolvedProfile = firstItem(profileData);
          setProfile(resolvedProfile);

          if (!resolvedProfile?.userProfileId) return;

          const nutritionData = await fetchJson<NutritionProfile | NutritionProfile[]>(
            `/api/v1/user-profiles/${resolvedProfile.userProfileId}`,
          );

          if (!ignore) setNutritionProfile(firstItem(nutritionData));
        } catch (err) {
          if (!ignore) {
            setProfileError(err instanceof Error ? err.message : "Failed to load patient profile.");
          }
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load user.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadUser();

    return () => {
      ignore = true;
    };
  }, [userId]);

  return (
    <SharedLayout
      title="User Details"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={nav}
      breadcrumbs={["Admin", "Management", "Users", `#${userId}`]}
    >
      <div style={pageStyle}>
        <button type="button" style={backButtonStyle} onClick={() => onNavigate("/admin/users")}>
          Back to users
        </button>

        {normalizeRole(user) === "NUTRITIONIST" && user ? (
          <section className="admin-nutritionist-view">
            <div className="admin-nutritionist-heading">
              <div>
                <h2>Nutritionist Details</h2>
                <p>View nutritionist information and activity.</p>
              </div>
            </div>

            {nutritionistError && (
              <div className="admin-patient-warning">
                Nutritionist details could not be fully loaded: {nutritionistError}
              </div>
            )}

            <div className="admin-nutritionist-top-grid">
              <aside className="admin-nutritionist-profile-card">
                <div className="admin-nutritionist-avatar-wrap">
                  {professionalProfile?.profilePictureUrl ? (
                    <img
                      src={professionalProfile.profilePictureUrl}
                      alt={professionalProfile.fullName || user.username}
                      className="admin-nutritionist-avatar"
                    />
                  ) : (
                    <div className="admin-nutritionist-avatar admin-nutritionist-avatar-fallback">
                      {getInitials(professionalProfile?.fullName || user.username)}
                    </div>
                  )}
                  <span className={`admin-nutritionist-online ${professionalProfile?.acceptingNewPatients ? "" : "admin-nutritionist-offline"}`}>
                    {professionalProfile?.acceptingNewPatients ? "Available" : "Closed"}
                  </span>
                </div>

                <h3>{professionalProfile?.fullName || user.username}</h3>
                <p>{formatRoleLabel(normalizeRole(user))}</p>

                <div className="admin-nutritionist-account-list">
                  <AccountRow label="User ID" value={`#${user.id}`} />
                  <AccountRow label="Username" value={user.username || "-"} />
                  <AccountRow label="Role" value={formatRoleLabel(normalizeRole(user))} badge />
                </div>
              </aside>

              <section className="admin-nutritionist-card">
                <div className="admin-nutritionist-section-title">Professional Information</div>
                <div className="admin-nutritionist-info-grid">
                  <DetailItem label="Full Name" value={professionalProfile?.fullName || "-"} />
                  <DetailItem label="License Number" value={professionalProfile?.licenseNumber || "-"} />
                  <DetailItem label="Specialty" value={professionalProfile?.specialty || "-"} />
                  <DetailItem
                    label="Years of Experience"
                    value={professionalProfile?.yearsExperience === undefined ? "-" : `${professionalProfile.yearsExperience} years`}
                  />
                  <DetailItem
                    label="Accepting New Patients"
                    value={professionalProfile?.acceptingNewPatients === undefined ? "-" : professionalProfile.acceptingNewPatients ? "Yes" : "No"}
                  />
                  <DetailItem label="Profile ID" value={professionalProfile?.id === undefined ? "-" : `#${professionalProfile.id}`} />
                </div>
                <div className="admin-nutritionist-bio">
                  <span>Bio</span>
                  <p>{professionalProfile?.bio || "-"}</p>
                </div>
              </section>
            </div>

            <div className="admin-nutritionist-stats">
              <MetricCard value={acceptedRelations.length} label="Patients" detail="Accepted patients" tone="purple" />
              <MetricCard value={pendingRelations.length} label="Requests" detail="Pending requests" tone="amber" />
              <MetricCard value={recipes.length} label="Recipes Created" detail="Total recipes" tone="green" />
              <MetricCard value={mealPlans.length} label="Meal Plans" detail="Total meal plans" tone="blue" />
            </div>

            <section className="admin-nutritionist-card">
              <div className="admin-nutritionist-table-header">
                <div>
                  <h3>Patients ({relations.length})</h3>
                  <p>Patients assigned to this nutritionist.</p>
                </div>
              </div>
              <div className="admin-nutritionist-table-wrap">
                <table className="admin-nutritionist-table">
                  <thead>
                    <tr>
                      <th>Patient User ID</th>
                      <th>Service Type</th>
                      <th>Start Date</th>
                      <th>Scheduled At</th>
                      <th>Accepted</th>
                      <th>Requested At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relations.slice(0, 5).map((relation) => (
                      <tr key={relation.id}>
                        <td>#{relation.patientUserId}</td>
                        <td>{relation.serviceType || "-"}</td>
                        <td>{formatDate(relation.startDate)}</td>
                        <td>{formatDateTime(relation.scheduledAt)}</td>
                        <td>
                          <span className={relation.accepted ? "admin-status-active" : "admin-status-pending"}>
                            {relation.accepted ? "Accepted" : "Pending"}
                          </span>
                        </td>
                        <td>{formatDateTime(relation.requestedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {relations.length === 0 && <p className="admin-nutritionist-empty">No patient relations found.</p>}
              {relations.length > 0 && (
                <div className="admin-nutritionist-footnote">
                  Showing 1 to {Math.min(5, relations.length)} of {relations.length} patients
                </div>
              )}
            </section>

            <div className="admin-nutritionist-bottom-grid">
              <section className="admin-nutritionist-card">
                <div className="admin-nutritionist-list-header">
                  <h3>Recent Recipes</h3>
                </div>
                <div className="admin-nutritionist-list">
                  {recipes.slice(0, 3).map((recipe) => (
                    <article className="admin-nutritionist-list-item" key={recipe.id}>
                      <div className="admin-nutritionist-list-icon">R</div>
                      <div>
                        <h4>{recipe.name || "-"}</h4>
                        <p>{[recipe.category, recipe.difficulty].filter(Boolean).join(" · ") || "-"}</p>
                        <p>{recipe.ingredients?.map((item) => item.ingredient?.name).filter(Boolean).join(", ") || "No ingredients listed"}</p>
                      </div>
                      <div className="admin-nutritionist-list-meta">
                        <span>{recipe.preparationTime === undefined ? "-" : `${recipe.preparationTime} min`}</span>
                        <small>{recipe.nutritionistName || "-"}</small>
                      </div>
                    </article>
                  ))}
                  {recipes.length === 0 && <p className="admin-nutritionist-empty">No recipes found.</p>}
                </div>
              </section>

              <section className="admin-nutritionist-card">
                <div className="admin-nutritionist-list-header">
                  <h3>Meal Plans</h3>
                </div>
                <div className="admin-nutritionist-list">
                  {mealPlans.slice(0, 3).map((mealPlan) => (
                    <article className="admin-nutritionist-list-item" key={mealPlan.id}>
                      <div className="admin-nutritionist-list-icon admin-nutritionist-list-icon-blue">M</div>
                      <div>
                        <h4>{mealPlan.name || "-"}</h4>
                        <p>{mealPlan.category || "-"}</p>
                        <p>{mealPlan.tags?.join(", ") || "No tags"}</p>
                      </div>
                      <div className="admin-nutritionist-list-meta">
                        <span>{mealPlan.calories === undefined ? "-" : `${mealPlan.calories} kcal`}</span>
                        <small>
                          P {mealPlan.proteins ?? "-"} · C {mealPlan.carbs ?? "-"} · F {mealPlan.fats ?? "-"}
                        </small>
                      </div>
                    </article>
                  ))}
                  {mealPlans.length === 0 && <p className="admin-nutritionist-empty">No meal plans found.</p>}
                </div>
              </section>
            </div>
          </section>
        ) : (
        <section className="admin-user-view-card" style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h2 style={headingStyle}>User Details</h2>
            <p style={descriptionStyle}>Read-only account information from GET /api/v1/users/{userId}.</p>
          </div>

          {loading && <div style={stateStyle}>Loading user...</div>}
          {error && <div style={{ ...stateStyle, color: "#b91c1c" }}>{error}</div>}

          {!loading && !error && user && (
            <>
              <div style={detailsGridStyle}>
                <DetailItem label="Username" value={user.username || "-"} />
                <DetailItem label="Role" value={normalizeRole(user) || "-"} />
                <DetailItem label="User ID" value={`#${user.id}`} />
              </div>

              {normalizeRole(user) === "PATIENT" && (
                <div className="admin-patient-sections">
                  {profileError && (
                    <div className="admin-patient-warning">
                      Patient profile could not be loaded: {profileError}
                    </div>
                  )}

                  <InfoSection title="Personal Information">
                    <DetailItem label="Name" value={profile?.name || user.username || "-"} />
                    <DetailItem label="Email" value={profile?.email || "-"} />
                    <DetailItem label="Birth date" value={formatDate(profile?.birthDate)} />
                    <DetailItem label="Status" value={profile?.isActive === undefined ? "-" : profile.isActive ? "Active" : "Inactive"} />
                  </InfoSection>

                  <InfoSection title="Nutrition Profile">
                    <DetailItem label="Gender" value={nutritionProfile?.gender || "-"} />
                    <DetailItem label="Height" value={nutritionProfile?.height === undefined ? "-" : `${nutritionProfile.height}`} />
                    <DetailItem label="Weight" value={nutritionProfile?.weight === undefined ? "-" : `${nutritionProfile.weight}`} />
                    <DetailItem label="Objective" value={nutritionProfile?.objectiveName || "-"} />
                    <DetailItem label="Activity level" value={nutritionProfile?.activityLevelName || "-"} />
                    <DetailItem label="Allergies" value={nutritionProfile?.allergyNames?.join(", ") || "-"} />
                    <DetailItem label="User score" value={nutritionProfile?.userScore === undefined ? "-" : `${nutritionProfile.userScore}`} />
                  </InfoSection>
                </div>
              )}
            </>
          )}
        </section>
        )}
      </div>
    </SharedLayout>
  );
}

function AccountRow({ label, value, badge = false }: { label: string; value: string; badge?: boolean }) {
  return (
    <div className="admin-nutritionist-account-row">
      <span>{label}</span>
      <strong className={badge ? "admin-nutritionist-role-badge" : ""}>{value}</strong>
    </div>
  );
}

function MetricCard({ value, label, detail, tone }: { value: number; label: string; detail: string; tone: string }) {
  return (
    <article className="admin-nutritionist-metric">
      <div className={`admin-nutritionist-metric-icon admin-nutritionist-metric-${tone}`}>{label.charAt(0)}</div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="admin-patient-section">
      <h3 className="admin-patient-section-title">{title}</h3>
      <div style={detailsGridStyle}>{children}</div>
    </section>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={detailItemStyle}>
      <span style={detailLabelStyle}>{label}</span>
      <strong style={detailValueStyle}>{value}</strong>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  padding: 24,
  background: "#f8fafc",
  minHeight: "100%",
};

const backButtonStyle: React.CSSProperties = {
  height: 36,
  border: "1px solid #d1d5db",
  borderRadius: 6,
  background: "#ffffff",
  color: "#111827",
  padding: "0 12px",
  font: "inherit",
  cursor: "pointer",
  marginBottom: 16,
};

const cardStyle: React.CSSProperties = {
  maxWidth: 760,
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
  overflow: "hidden",
};

const cardHeaderStyle: React.CSSProperties = {
  padding: 20,
  borderBottom: "1px solid #e5e7eb",
};

const headingStyle: React.CSSProperties = {
  margin: 0,
  color: "#111827",
  fontSize: 24,
};

const descriptionStyle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#6b7280",
};

const detailsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 14,
  padding: 20,
};

const detailItemStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 16,
  background: "#fbfdff",
};

const detailLabelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  color: "#6b7280",
  fontSize: 13,
  fontWeight: 600,
};

const detailValueStyle: React.CSSProperties = {
  color: "#111827",
  fontSize: 18,
};

const stateStyle: React.CSSProperties = {
  padding: 20,
  color: "#4b5563",
};
