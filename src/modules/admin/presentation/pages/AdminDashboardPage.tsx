import { useEffect, useMemo, useState, type ReactNode } from "react";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import { apiUrl } from "@/app/config/env";

interface AdminDashboardPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

interface User {
  id: number | string;
  username?: string;
  roles?: string[];
  role?: string;
}

interface MealPlan {
  id: number | string;
  name?: string;
  category?: string;
  calories?: number;
  isCurrent?: boolean;
}

interface Recipe {
  id: number | string;
  name?: string;
  category?: string;
  nutritionistName?: string;
  difficulty?: string;
}

interface Nutritionist {
  id: number | string;
  acceptingNewPatients?: boolean;
}

interface Ingredient {
  id: number | string;
  name?: string;
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
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

function hasRole(user: User, role: string) {
  const roles = user.roles ?? (user.role ? [user.role] : []);
  return roles.map((item) => item.replace(/^ROLE_/, "").toUpperCase()).includes(role);
}

function roleLabel(user: User) {
  const role = (user.roles?.[0] ?? user.role ?? "").replace(/^ROLE_/, "");
  if (!role) return "-";
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

function formatKcal(value?: number) {
  return value === undefined ? "-" : `${value.toLocaleString("en-US")} kcal`;
}

export function AdminDashboardPage({ currentPath, onNavigate }: AdminDashboardPageProps) {
  const nav = useNavigation();
  const [users, setUsers] = useState<User[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [nutritionists, setNutritionists] = useState<Nutritionist[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const [usersResult, mealPlansResult, recipesResult, nutritionistsResult, ingredientsResult] = await Promise.allSettled([
          fetchJson<User[]>("/api/v1/users"),
          fetchJson<MealPlan[]>("/api/v1/meal-plan"),
          fetchJson<Recipe[]>("/api/v1/recipes/templates/detailed"),
          fetchJson<Nutritionist[]>("/api/v1/nutritionists"),
          fetchJson<Ingredient[]>("/api/v1/ingredients"),
        ]);

        if (ignore) return;

        const nextUsers = usersResult.status === "fulfilled" && Array.isArray(usersResult.value) ? usersResult.value : [];
        const nextMealPlans =
          mealPlansResult.status === "fulfilled" && Array.isArray(mealPlansResult.value) ? mealPlansResult.value : [];
        const nextRecipes = recipesResult.status === "fulfilled" && Array.isArray(recipesResult.value) ? recipesResult.value : [];
        const nextNutritionists =
          nutritionistsResult.status === "fulfilled" && Array.isArray(nutritionistsResult.value)
            ? nutritionistsResult.value
            : [];
        const nextIngredients =
          ingredientsResult.status === "fulfilled" && Array.isArray(ingredientsResult.value) ? ingredientsResult.value : [];

        setUsers(nextUsers);
        setMealPlans(nextMealPlans);
        setRecipes(nextRecipes);
        setNutritionists(nextNutritionists);
        setIngredients(nextIngredients);

        const failedSections = [
          mealPlansResult.status === "rejected" ? "meal plans" : null,
          recipesResult.status === "rejected" ? "recipes" : null,
          nutritionistsResult.status === "rejected" ? "nutritionists" : null,
          ingredientsResult.status === "rejected" ? "ingredients" : null,
        ].filter(Boolean);

        if (usersResult.status === "rejected") {
          setError("Users could not be loaded. Some dashboard data may be unavailable.");
        } else if (failedSections.length > 0) {
          setError(`Some dashboard sections could not be loaded: ${failedSections.join(", ")}.`);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  const patientCount = useMemo(() => users.filter((user) => hasRole(user, "PATIENT")).length, [users]);
  const nutritionistUserCount = useMemo(() => users.filter((user) => hasRole(user, "NUTRITIONIST")).length, [users]);
  const activeMealPlanCount = useMemo(() => mealPlans.filter((plan) => plan.isCurrent).length, [mealPlans]);
  const activeNutritionistCount = useMemo(
    () => nutritionists.filter((nutritionist) => nutritionist.acceptingNewPatients).length,
    [nutritionists],
  );

  const cards = [
    { label: "Total Users", value: users.length, icon: <UsersDashboardIcon />, tone: "purple" },
    { label: "Patients", value: patientCount, icon: <PatientDashboardIcon />, tone: "green" },
    { label: "Nutritionists", value: nutritionistUserCount, icon: <NutritionistDashboardIcon />, tone: "blue" },
    { label: "Meal Plans", value: mealPlans.length, icon: <MealPlanDashboardIcon />, tone: "amber" },
    { label: "Recipes", value: recipes.length, icon: <RecipeDashboardIcon />, tone: "rose" },
    { label: "Active Meal Plans", value: activeMealPlanCount, icon: <CheckDashboardIcon />, tone: "emerald" },
    { label: "Active Nutritionists", value: activeNutritionistCount, icon: <MedicalDashboardIcon />, tone: "indigo" },
    { label: "Ingredients", value: ingredients.length, icon: <IngredientDashboardIcon />, tone: "orange" },
  ];

  return (
    <SharedLayout
      title="Dashboard"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={nav}
      breadcrumbs={["Admin", "Dashboard"]}
    >
      <div className="admin-dashboard-page">
        <header className="admin-dashboard-header">
          <div>
            <h2>Admin Dashboard</h2>
            <p>Overview of users, nutrition content, meal plans, and platform activity.</p>
          </div>
        </header>

        {error && <div className="admin-dashboard-warning">{error}</div>}
        {loading && <div className="admin-dashboard-state">Loading dashboard...</div>}

        {!loading && (
          <>
            <section className="admin-dashboard-card-grid">
              {cards.map((card) => (
                <DashboardMetricCard key={card.label} {...card} />
              ))}
            </section>

            <section className="admin-dashboard-tables">
              <DashboardPanel title="Recent Users" actionLabel="View Users" onAction={() => onNavigate("/admin/users")}>
                <table className="admin-dashboard-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(-5).reverse().map((user) => (
                      <tr key={user.id}>
                        <td>{user.username || "-"}</td>
                        <td>
                          <span className="admin-dashboard-pill">{roleLabel(user)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DashboardPanel>

              <DashboardPanel title="Latest Recipes" actionLabel="View Recipes" onAction={() => onNavigate("/admin/recipes")}>
                <table className="admin-dashboard-table">
                  <thead>
                    <tr>
                      <th>Recipe</th>
                      <th>Category</th>
                      <th>Nutritionist</th>
                      <th>Difficulty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipes.slice(-5).reverse().map((recipe) => (
                      <tr key={recipe.id}>
                        <td>{recipe.name || "-"}</td>
                        <td>{recipe.category || "-"}</td>
                        <td>{recipe.nutritionistName || "-"}</td>
                        <td>
                          <span className="admin-dashboard-pill">{recipe.difficulty || "-"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DashboardPanel>

              <DashboardPanel title="Latest Meal Plans" actionLabel="View Meal Plans" onAction={() => onNavigate("/admin/meal-plans")}>
                <table className="admin-dashboard-table">
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th>Category</th>
                      <th>Calories</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mealPlans.slice(-5).reverse().map((plan) => (
                      <tr key={plan.id}>
                        <td>{plan.name || "-"}</td>
                        <td>{plan.category || "-"}</td>
                        <td>{formatKcal(plan.calories)}</td>
                        <td>
                          <span className={plan.isCurrent ? "admin-dashboard-status-active" : "admin-dashboard-status-inactive"}>
                            {plan.isCurrent ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DashboardPanel>
            </section>
          </>
        )}
      </div>
    </SharedLayout>
  );
}

function DashboardMetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <article className="admin-dashboard-metric">
      <div className={`admin-dashboard-metric-icon admin-dashboard-metric-${tone}`}>{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value.toLocaleString("en-US")}</strong>
        <p>Current total</p>
      </div>
      <MiniSparkline tone={tone} />
    </article>
  );
}

function MiniSparkline({ tone }: { tone: string }) {
  return (
    <svg className={`admin-dashboard-sparkline admin-dashboard-sparkline-${tone}`} viewBox="0 0 92 34" aria-hidden>
      <path d="M2 29 C12 29 14 28 20 24 C29 17 34 31 42 23 C50 15 52 8 60 13 C69 20 70 32 78 20 C84 11 86 6 90 12" />
    </svg>
  );
}

function DashboardPanel({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  actionLabel: string;
  onAction: () => void;
  children: ReactNode;
}) {
  return (
    <article className="admin-dashboard-panel">
      <div className="admin-dashboard-panel-header">
        <h3>{title}</h3>
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      </div>
      <div className="admin-dashboard-table-wrap">{children}</div>
    </article>
  );
}

function UsersDashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M16 20v-1.5A3.5 3.5 0 0 0 12.5 15h-5A3.5 3.5 0 0 0 4 18.5V20" />
      <circle cx="10" cy="8" r="3.5" />
      <path d="M19.5 20v-1.2a3 3 0 0 0-2.3-2.9" />
      <path d="M16.5 5.3a3.2 3.2 0 0 1 0 5.4" />
    </svg>
  );
}

function PatientDashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="7.5" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
      <path d="M9 13.8 12 17l3-3.2" />
    </svg>
  );
}

function NutritionistDashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M12 21s7-4.6 7-11V5l-7-2-7 2v5c0 6.4 7 11 7 11Z" />
      <path d="M9 12h6" />
      <path d="M12 9v6" />
    </svg>
  );
}

function MealPlanDashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </svg>
  );
}

function RecipeDashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M6 3v8" />
      <path d="M9 3v8" />
      <path d="M6 7h3" />
      <path d="M7.5 11v10" />
      <path d="M17 3v18" />
      <path d="M14 3c0 4 1 6 3 7" />
    </svg>
  );
}

function CheckDashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="m8.5 12.3 2.4 2.4 4.8-5.2" />
    </svg>
  );
}

function MedicalDashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M8 21v-4a4 4 0 0 1 8 0v4" />
      <circle cx="12" cy="7" r="4" />
      <path d="M19 9h3" />
      <path d="M20.5 7.5v3" />
    </svg>
  );
}

function IngredientDashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M6 13c0 4 2.7 7 6 7s6-3 6-7c0-2.8-2.2-5-6-9-3.8 4-6 6.2-6 9Z" />
      <path d="M12 4c2.4-.7 4.3-.2 5.5 1.5" />
    </svg>
  );
}
