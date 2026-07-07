import { useEffect, useMemo, useState } from "react";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import { apiUrl } from "@/app/config/env";

interface AdminMealPlansPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

interface MealPlanEntry {
  id: number | string;
  recipeId: number | string;
  day?: number;
  mealPlanType?: number | string;
  mealPlanId?: number | string;
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
  entries?: MealPlanEntry[];
  tags?: string[];
}

interface MealPlanRecipe {
  id: number | string;
  name?: string;
  description?: string;
  preparationTime?: number;
  difficulty?: string;
  categoryName?: string;
  recipeTypeName?: string;
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

async function deleteResource(path: string) {
  const response = await fetch(apiUrl(path), {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

function normalize(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function categoryClass(value?: string) {
  const normalized = normalize(value);
  if (normalized.includes("weight")) return "admin-mealplans-pill-purple";
  if (normalized.includes("muscle")) return "admin-mealplans-pill-green";
  if (normalized.includes("maintenance")) return "admin-mealplans-pill-amber";
  return "admin-mealplans-pill-blue";
}

function mealTypeLabel(value?: number | string) {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized === "0") return "Breakfast";
  if (normalized === "1") return "Lunch";
  if (normalized === "2") return "Dinner";
  if (normalized === "3") return "Snack";
  return value === undefined ? "Meal" : String(value);
}

function formatKcal(value?: number) {
  return value === undefined ? "-" : `${value.toLocaleString("en-US")} kcal`;
}

function formatGram(value?: number) {
  return value === undefined ? "-" : `${value} g`;
}

export function AdminMealPlansPage({ currentPath, onNavigate }: AdminMealPlansPageProps) {
  const nav = useNavigation();
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<MealPlanRecipe[]>([]);
  const [selectedMealPlanId, setSelectedMealPlanId] = useState<number | string | null>(null);
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadMealPlans() {
      try {
        setLoading(true);
        setError(null);

        const [nextMealPlans, nextRecipes] = await Promise.all([
          fetchJson<MealPlan[]>("/api/v1/meal-plan"),
          fetchJson<MealPlanRecipe[]>("/api/v1/meal-plan/recipes").catch(() => []),
        ]);

        if (ignore) return;
        setMealPlans(Array.isArray(nextMealPlans) ? nextMealPlans : []);
        setRecipes(Array.isArray(nextRecipes) ? nextRecipes : []);
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load meal plans.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadMealPlans();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedMealPlanId) return;
    let ignore = false;

    async function loadDetail() {
      try {
        setDetailLoading(true);
        setDetailError(null);

        const detail = await fetchJson<MealPlan>(`/api/v1/meal-plan/${selectedMealPlanId}`);
        if (ignore) return;
        setSelectedMealPlan(detail);
      } catch (err) {
        if (!ignore) {
          setDetailError(err instanceof Error ? err.message : "Failed to load meal plan details.");
        }
      } finally {
        if (!ignore) setDetailLoading(false);
      }
    }

    loadDetail();

    return () => {
      ignore = true;
    };
  }, [selectedMealPlanId]);

  const categories = useMemo(() => {
    return Array.from(new Set(mealPlans.map((plan) => plan.category).filter(Boolean) as string[]));
  }, [mealPlans]);

  const filteredMealPlans = useMemo(() => {
    const query = normalize(search);

    return mealPlans.filter((plan) => {
      const tags = plan.tags?.join(" ") ?? "";
      const matchesSearch =
        !query ||
        normalize(plan.name).includes(query) ||
        normalize(plan.category).includes(query) ||
        normalize(plan.description).includes(query) ||
        normalize(tags).includes(query);
      const matchesCategory = categoryFilter === "all" || normalize(plan.category) === normalize(categoryFilter);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && plan.isCurrent) ||
        (statusFilter === "inactive" && !plan.isCurrent);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [mealPlans, search, categoryFilter, statusFilter]);

  const activeCount = useMemo(() => mealPlans.filter((plan) => plan.isCurrent).length, [mealPlans]);
  const weightLossCount = useMemo(
    () => mealPlans.filter((plan) => normalize(plan.category).includes("weight loss")).length,
    [mealPlans],
  );
  const muscleGainCount = useMemo(
    () => mealPlans.filter((plan) => normalize(plan.category).includes("muscle gain")).length,
    [mealPlans],
  );

  const recipesById = useMemo(() => {
    return recipes.reduce<Record<string, MealPlanRecipe>>((nextMap, recipe) => {
      nextMap[String(recipe.id)] = recipe;
      return nextMap;
    }, {});
  }, [recipes]);

  async function handleDeleteMealPlan(mealPlanId: number | string) {
    const confirmed = window.confirm("Delete this meal plan?");
    if (!confirmed) return;

    try {
      await deleteResource(`/api/v1/meal-plan/${mealPlanId}`);
      setMealPlans((current) => current.filter((plan) => String(plan.id) !== String(mealPlanId)));
      if (String(selectedMealPlanId) === String(mealPlanId)) {
        setSelectedMealPlanId(null);
        setSelectedMealPlan(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete meal plan.");
    }
  }

  return (
    <SharedLayout
      title="Meal Plans"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={nav}
      breadcrumbs={["Admin", "Management", "Meal Plans"]}
    >
      <div className="admin-mealplans-page">
        <header className="admin-mealplans-header">
          <div>
            <h2>Meal Plans</h2>
            <p>View and manage all meal plans created by nutritionists.</p>
          </div>
        </header>

        <section className="admin-mealplans-stats">
          <MealPlanStat value={mealPlans.length} label="Total Meal Plans" detail="All meal plans" tone="purple" />
          <MealPlanStat value={activeCount} label="Active Plans" detail="Currently active" tone="green" />
          <MealPlanStat value={weightLossCount} label="Weight Loss Plans" detail="Category" tone="amber" />
          <MealPlanStat value={muscleGainCount} label="Muscle Gain Plans" detail="Category" tone="blue" />
        </section>

        {error && <div className="admin-mealplans-warning">{error}</div>}

        <div className={`admin-mealplans-workspace ${selectedMealPlanId ? "admin-mealplans-workspace-with-detail" : ""}`}>
          <section className="admin-mealplans-main-card">
            <div className="admin-mealplans-filters">
              <input
                type="search"
                placeholder="Search meal plans by name, category..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                type="button"
                className="admin-mealplans-clear"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("all");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </button>
            </div>

            {loading && <div className="admin-mealplans-state">Loading meal plans...</div>}

            {!loading && (
              <div className="admin-mealplans-table-wrap">
                <table className="admin-mealplans-table">
                  <thead>
                    <tr>
                      <th>Plan Name</th>
                      <th>Category</th>
                      <th>Calories</th>
                      <th>Protein</th>
                      <th>Carbs</th>
                      <th>Fats</th>
                      <th>Profile ID</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMealPlans.map((plan) => (
                      <tr key={plan.id}>
                        <td>
                          <div className="admin-mealplans-name-cell">
                            <div className="admin-mealplans-thumb">{plan.name?.charAt(0).toUpperCase() ?? "M"}</div>
                            <div>
                              <strong>{plan.name || "-"}</strong>
                              <span>{plan.description || "-"}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`admin-mealplans-pill ${categoryClass(plan.category)}`}>
                            {plan.category || "-"}
                          </span>
                        </td>
                        <td>{formatKcal(plan.calories)}</td>
                        <td>{formatGram(plan.proteins)}</td>
                        <td>{formatGram(plan.carbs)}</td>
                        <td>{formatGram(plan.fats)}</td>
                        <td>{plan.profileId ?? "-"}</td>
                        <td>
                          <span className={plan.isCurrent ? "admin-mealplans-status-active" : "admin-mealplans-status-inactive"}>
                            {plan.isCurrent ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div className="admin-mealplans-actions">
                            <button type="button" onClick={() => setSelectedMealPlanId(plan.id)}>
                              View
                            </button>
                            <button type="button" onClick={() => handleDeleteMealPlan(plan.id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredMealPlans.length === 0 && <div className="admin-mealplans-state">No meal plans found.</div>}
            {!loading && filteredMealPlans.length > 0 && (
              <div className="admin-mealplans-footnote">
                Showing 1 to {filteredMealPlans.length} of {mealPlans.length} meal plans
              </div>
            )}
          </section>

          {selectedMealPlanId && (
            <aside className="admin-mealplans-detail-card">
              <div className="admin-mealplans-detail-header">
                <h3>Meal Plan Details</h3>
                <button
                  type="button"
                  aria-label="Close meal plan details"
                  onClick={() => {
                    setSelectedMealPlanId(null);
                    setSelectedMealPlan(null);
                    setDetailError(null);
                  }}
                >
                  X
                </button>
              </div>

              {detailLoading && <div className="admin-mealplans-state">Loading details...</div>}
              {detailError && <div className="admin-mealplans-warning">{detailError}</div>}

              {!detailLoading && selectedMealPlan && (
                <>
                  <div className="admin-mealplans-detail-title">
                    <div className="admin-mealplans-detail-image">
                      {selectedMealPlan.name?.charAt(0).toUpperCase() ?? "M"}
                    </div>
                    <div>
                      <h4>{selectedMealPlan.name || "-"}</h4>
                      <span className={selectedMealPlan.isCurrent ? "admin-mealplans-status-active" : "admin-mealplans-status-inactive"}>
                        {selectedMealPlan.isCurrent ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <section className="admin-mealplans-detail-section">
                    <h4>Plan Information</h4>
                    <DetailRow label="Description" value={selectedMealPlan.description || "-"} />
                    <DetailRow label="Category" value={selectedMealPlan.category || "-"} pillClass={categoryClass(selectedMealPlan.category)} />
                    <DetailRow label="Profile ID" value={String(selectedMealPlan.profileId ?? "-")} />
                    <DetailRow label="Current Plan" value={selectedMealPlan.isCurrent ? "Yes" : "No"} />
                    <div className="admin-mealplans-tags-row">
                      <span>Tags</span>
                      <div>
                        {(selectedMealPlan.tags ?? []).map((tag) => (
                          <strong key={tag}>{tag}</strong>
                        ))}
                        {(selectedMealPlan.tags ?? []).length === 0 && <strong>-</strong>}
                      </div>
                    </div>
                  </section>

                  <section className="admin-mealplans-nutrition">
                    <h4>Nutrition per day</h4>
                    <div>
                      <NutritionBox label="Calories" value={selectedMealPlan.calories} suffix=" kcal" />
                      <NutritionBox label="Protein" value={selectedMealPlan.proteins} suffix="g" />
                      <NutritionBox label="Carbs" value={selectedMealPlan.carbs} suffix="g" />
                      <NutritionBox label="Fats" value={selectedMealPlan.fats} suffix="g" />
                    </div>
                  </section>

                  <section className="admin-mealplans-detail-section">
                    <h4>Meal Plan Entries</h4>
                    <ul className="admin-mealplans-entry-list">
                      {(selectedMealPlan.entries ?? []).map((entry) => {
                        const recipe = recipesById[String(entry.recipeId)];
                        return (
                          <li key={entry.id}>
                            <span>{mealTypeLabel(entry.mealPlanType)}</span>
                            <strong>{recipe?.name || `Recipe #${entry.recipeId}`}</strong>
                            <em>Day {entry.day ?? "-"}</em>
                          </li>
                        );
                      })}
                    </ul>
                    {(selectedMealPlan.entries ?? []).length === 0 && <p>No entries listed.</p>}
                  </section>

                  <div className="admin-mealplans-detail-actions">
                    <button type="button" onClick={() => handleDeleteMealPlan(selectedMealPlan.id)}>
                      Delete Meal Plan
                    </button>
                  </div>
                </>
              )}
            </aside>
          )}
        </div>
      </div>
    </SharedLayout>
  );
}

function MealPlanStat({ value, label, detail, tone }: { value: number; label: string; detail: string; tone: string }) {
  return (
    <article className="admin-mealplans-stat">
      <div className={`admin-mealplans-stat-icon admin-mealplans-stat-${tone}`}>{label.charAt(0)}</div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function DetailRow({ label, value, pillClass }: { label: string; value: string; pillClass?: string }) {
  return (
    <div className="admin-mealplans-detail-row">
      <span>{label}</span>
      {pillClass ? <strong className={`admin-mealplans-pill ${pillClass}`}>{value}</strong> : <strong>{value}</strong>}
    </div>
  );
}

function NutritionBox({ label, value, suffix }: { label: string; value?: number; suffix: string }) {
  return (
    <div className="admin-mealplans-nutrition-box">
      <strong>{value === undefined ? "-" : `${value.toLocaleString("en-US")}${suffix}`}</strong>
      <span>{label}</span>
    </div>
  );
}
