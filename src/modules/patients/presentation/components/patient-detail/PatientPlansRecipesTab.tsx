import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL, apiUrl } from "@/app/config/env";
import styles from "../../pages/PatientsPages.module.css";

interface PatientPlansRecipesTabProps {
  patientUserId: string;
  profileId?: number | string;
}

interface SessionUser {
  id: number | string;
}

interface MealPlanEntry {
  id?: number | string;
  recipeId?: number | string;
  day?: number;
  dayNumber?: number;
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

interface RecipeIngredient {
  ingredient?: {
    id?: number | string;
    name?: string;
  };
  amountGrams?: number;
}

interface Recipe {
  id: number | string;
  name?: string;
  description?: string;
  preparationTime?: number;
  difficulty?: string;
  categoryName?: string;
  recipeTypeName?: string;
  assignedToProfileId?: number | string | null;
  ingredients?: RecipeIngredient[];
}

type AssignTarget = "mealPlan" | "recipe";

function getSessionUser(): SessionUser | null {
  const session = JSON.parse(localStorage.getItem("session") || "null");
  return session?.user ?? null;
}

function getAuthHeaders(hasBody = false): HeadersInit {
  const token = localStorage.getItem("accessToken");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
  };
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      ...getAuthHeaders(Boolean(init?.body)),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function isLocalMockApi() {
  return API_BASE_URL.includes("localhost:3001");
}

async function updateLocalResource<T extends { id: number | string }>(collection: string, id: number | string, changes: Partial<T>) {
  const current = await fetchJson<T>(`/${collection}/${encodeURIComponent(String(id))}`);
  return fetchJson<T>(`/${collection}/${encodeURIComponent(String(id))}`, {
    method: "PUT",
    body: JSON.stringify({ ...current, ...changes }),
  });
}

async function getAssignedMealPlans(profileId: number | string) {
  if (isLocalMockApi()) {
    return fetchJson<MealPlan[]>(`/mealPlans?profileId=${encodeURIComponent(String(profileId))}`);
  }

  return fetchJson<MealPlan[]>(`/api/v1/meal-plan/profile/${encodeURIComponent(String(profileId))}`);
}

async function getAssignedRecipes(profileId: number | string) {
  if (isLocalMockApi()) {
    return fetchJson<Recipe[]>(`/recipes?assignedToProfileId=${encodeURIComponent(String(profileId))}`);
  }

  return fetchJson<Recipe[]>(`/api/v1/recipes/profile/${encodeURIComponent(String(profileId))}`);
}

async function getLibraryMealPlans(nutritionistUserId?: number | string) {
  if (!nutritionistUserId) return [] as MealPlan[];

  if (isLocalMockApi()) {
    return fetchJson<MealPlan[]>(`/mealPlans?nutritionistUserId=${encodeURIComponent(String(nutritionistUserId))}`).catch(() => []);
  }

  return fetchJson<MealPlan[]>(`/api/v1/meal-plan/nutritionists/${encodeURIComponent(String(nutritionistUserId))}`).catch(() => []);
}

async function getLibraryRecipes(nutritionistUserId?: number | string) {
  if (!nutritionistUserId) return [] as Recipe[];

  if (isLocalMockApi()) {
    return fetchJson<Recipe[]>(`/recipes?createdByNutritionistId=${encodeURIComponent(String(nutritionistUserId))}`).catch(() => []);
  }

  return fetchJson<Recipe[]>(`/api/v1/recipes/nutritionists/${encodeURIComponent(String(nutritionistUserId))}/templates`).catch(() => []);
}

function formatKcal(value?: number) {
  return value === undefined ? "-" : `${value.toLocaleString("en-US")} kcal`;
}

function formatTags(tags?: string[]) {
  if (!tags?.length) return "No tags";
  return tags.join(", ");
}

function ingredientCount(recipe: Recipe) {
  const count = recipe.ingredients?.length ?? 0;
  return `${count} ingredient${count === 1 ? "" : "s"}`;
}

function mealTypeLabel(value?: number | string) {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized === "0" || normalized === "breakfast") return "Breakfast";
  if (normalized === "1" || normalized === "lunch") return "Lunch";
  if (normalized === "2" || normalized === "dinner") return "Dinner";
  if (normalized === "3" || normalized === "snack") return "Snack";
  return value === undefined ? "Meal" : String(value);
}

export function PatientPlansRecipesTab({ patientUserId, profileId }: PatientPlansRecipesTabProps) {
  const nutritionistUserId = getSessionUser()?.id;
  const [assignedMealPlans, setAssignedMealPlans] = useState<MealPlan[]>([]);
  const [assignedRecipes, setAssignedRecipes] = useState<Recipe[]>([]);
  const [libraryMealPlans, setLibraryMealPlans] = useState<MealPlan[]>([]);
  const [libraryRecipes, setLibraryRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningKey, setAssigningKey] = useState<string | null>(null);
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const assignedMealPlanIds = useMemo(
    () => new Set(assignedMealPlans.map((plan) => String(plan.id))),
    [assignedMealPlans],
  );

  const assignedRecipeIds = useMemo(
    () => new Set(assignedRecipes.map((recipe) => String(recipe.id))),
    [assignedRecipes],
  );

  const recipesById = useMemo(() => {
    return [...assignedRecipes, ...libraryRecipes].reduce<Record<string, Recipe>>((nextMap, recipe) => {
      nextMap[String(recipe.id)] = recipe;
      return nextMap;
    }, {});
  }, [assignedRecipes, libraryRecipes]);

  const loadPlansAndRecipes = async () => {
    if (!profileId) {
      setAssignedMealPlans([]);
      setAssignedRecipes([]);
      setError("Patient profile id is required to load assigned plans and recipes.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [nextAssignedPlans, nextAssignedRecipes, nextLibraryPlans, nextLibraryRecipes] = await Promise.all([
        getAssignedMealPlans(profileId),
        getAssignedRecipes(profileId),
        getLibraryMealPlans(nutritionistUserId),
        getLibraryRecipes(nutritionistUserId),
      ]);

      setAssignedMealPlans(Array.isArray(nextAssignedPlans) ? nextAssignedPlans : []);
      setAssignedRecipes(Array.isArray(nextAssignedRecipes) ? nextAssignedRecipes : []);
      setLibraryMealPlans(Array.isArray(nextLibraryPlans) ? nextLibraryPlans : []);
      setLibraryRecipes(Array.isArray(nextLibraryRecipes) ? nextLibraryRecipes : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plans and recipes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPlansAndRecipes();
  }, [nutritionistUserId, patientUserId, profileId]);

  async function assignItem(target: AssignTarget, itemId: number | string) {
    const key = `${target}-${itemId}`;
    setAssigningKey(key);
    setError(null);
    setSuccess(null);

    try {
      if (profileId && isLocalMockApi()) {
        if (target === "mealPlan") {
          await updateLocalResource<MealPlan>("mealPlans", itemId, { profileId: Number(profileId) });
        } else {
          await updateLocalResource<Recipe>("recipes", itemId, { assignedToProfileId: Number(profileId) } as Partial<Recipe>);
        }
      } else if (profileId) {
        const path = target === "mealPlan"
          ? `/api/v1/meal-plan/${encodeURIComponent(String(itemId))}/assign-to-profile/${encodeURIComponent(String(profileId))}`
          : `/api/v1/recipes/${encodeURIComponent(String(itemId))}/assign-to-profile/${encodeURIComponent(String(profileId))}`;
        await fetchJson<void>(path, { method: "POST" });
      } else {
        const path = target === "mealPlan"
          ? `/api/v1/meal-plan/users/${encodeURIComponent(String(patientUserId))}`
          : `/api/v1/recipes/users/${encodeURIComponent(String(patientUserId))}`;
        const body = target === "mealPlan" ? { mealPlanId: itemId } : { recipeId: itemId };
        await fetchJson<void>(path, { method: "POST", body: JSON.stringify(body) });
      }

      setSuccess(target === "mealPlan" ? "Meal plan assigned." : "Recipe assigned.");
      await loadPlansAndRecipes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign item.");
    } finally {
      setAssigningKey(null);
    }
  }

  return (
    <section className={styles.patientPlansTab}>
      <div className={styles.patientOverviewTitle}>
        <h2>Plans & Recipes</h2>
        <span>{loading ? "Loading" : "Assignment center"}</span>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}
      {success && <p className={styles.successText}>{success}</p>}

      <div className={styles.patientPlansStats}>
        <PlanStat label="Assigned Meal Plans" value={assignedMealPlans.length} />
        <PlanStat label="Extra Recipes" value={assignedRecipes.length} />
        <PlanStat label="Meal Plan Library" value={libraryMealPlans.length} />
        <PlanStat label="Extra Recipe Library" value={libraryRecipes.length} />
      </div>

      {loading ? (
        <p className={styles.directoryMessage}>Loading plans and recipes...</p>
      ) : (
        <>
          <div className={styles.patientPlansGrid}>
            <section className={styles.patientPlansBlock}>
              <div className={styles.patientPlansBlockHeader}>
                <h3>Assigned Meal Plans</h3>
                <span>{assignedMealPlans.length}</span>
              </div>
              <div className={styles.patientPlansList}>
                {assignedMealPlans.map((plan) => (
                  <AssignedMealPlanRow
                    key={plan.id}
                    plan={plan}
                    onView={() => setSelectedMealPlan(plan)}
                  />
                ))}
                {assignedMealPlans.length === 0 && <p className={styles.emptyState}>No meal plans assigned.</p>}
              </div>
            </section>

            <section className={styles.patientPlansBlock}>
              <div className={styles.patientPlansBlockHeader}>
                <h3>Assigned Extra Recipes</h3>
                <span>{assignedRecipes.length}</span>
              </div>
              <div className={styles.patientPlansList}>
                {assignedRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} assigned />
                ))}
                {assignedRecipes.length === 0 && <p className={styles.emptyState}>No recipes assigned.</p>}
              </div>
            </section>
          </div>

          <div className={styles.patientPlansGrid}>
            <section className={styles.patientPlansBlock}>
              <div className={styles.patientPlansBlockHeader}>
                <h3>Available Meal Plans</h3>
                <span>{libraryMealPlans.length}</span>
              </div>
              <div className={styles.patientPlansList}>
                {libraryMealPlans.map((plan) => {
                  const assigned = assignedMealPlanIds.has(String(plan.id));
                  const key = `mealPlan-${plan.id}`;
                  return (
                    <MealPlanCard
                      key={plan.id}
                      plan={plan}
                      assigned={assigned}
                      actionLabel={assigned ? "Assigned" : "Assign"}
                      actionDisabled={assigned || assigningKey === key || !profileId}
                      onAction={() => assignItem("mealPlan", plan.id)}
                    />
                  );
                })}
                {libraryMealPlans.length === 0 && <p className={styles.emptyState}>No meal plan templates found.</p>}
              </div>
            </section>

            <section className={styles.patientPlansBlock}>
              <div className={styles.patientPlansBlockHeader}>
                <h3>Available Extra Recipes</h3>
                <span>{libraryRecipes.length}</span>
              </div>
              <div className={styles.patientPlansList}>
                {libraryRecipes.map((recipe) => {
                  const assigned = assignedRecipeIds.has(String(recipe.id));
                  const key = `recipe-${recipe.id}`;
                  return (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      assigned={assigned}
                      actionLabel={assigned ? "Assigned" : "Assign"}
                      actionDisabled={assigned || assigningKey === key || !profileId}
                      onAction={() => assignItem("recipe", recipe.id)}
                    />
                  );
                })}
                {libraryRecipes.length === 0 && <p className={styles.emptyState}>No extra recipe templates found.</p>}
              </div>
            </section>
          </div>

          {selectedMealPlan && (
            <MealPlanDetailModal
              plan={selectedMealPlan}
              recipesById={recipesById}
              onClose={() => setSelectedMealPlan(null)}
            />
          )}
        </>
      )}
    </section>
  );
}

function PlanStat({ label, value }: { label: string; value: number }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function AssignedMealPlanRow({
  plan,
  onView,
}: {
  plan: MealPlan;
  onView: () => void;
}) {
  return (
    <article className={styles.assignedPlanRow}>
      <div>
        <strong>{plan.name || "Untitled meal plan"}</strong>
        <span>{plan.category || "General"} - {plan.entries?.length ?? 0} entries</span>
      </div>
      <button type="button" className={styles.iconButton} onClick={onView} aria-label={`View ${plan.name || "meal plan"}`}>
        <EyeIcon />
      </button>
    </article>
  );
}

function MealPlanDetailModal({
  plan,
  recipesById,
  onClose,
}: {
  plan: MealPlan;
  recipesById: Record<string, Recipe>;
  onClose: () => void;
}) {
  return (
    <div className={styles.planModalBackdrop} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.planModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assigned-plan-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.planModalHeader}>
          <div>
            <span>{plan.category || "Meal Plan"}</span>
            <h3 id="assigned-plan-title">{plan.name || "Untitled meal plan"}</h3>
            <p>{plan.description || "-"}</p>
          </div>
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Close meal plan details">
            <CloseIcon />
          </button>
        </header>

        <div className={styles.planModalMacros}>
          <MacroBox label="Calories" value={formatKcal(plan.calories)} />
          <MacroBox label="Carbs" value={plan.carbs === undefined ? "-" : `${plan.carbs} g`} />
          <MacroBox label="Protein" value={plan.proteins === undefined ? "-" : `${plan.proteins} g`} />
          <MacroBox label="Fats" value={plan.fats === undefined ? "-" : `${plan.fats} g`} />
        </div>

        <section className={styles.planModalSection}>
          <h4>Assigned Recipes In This Plan</h4>
          <div className={styles.planEntryList}>
            {(plan.entries ?? []).map((entry) => {
              const recipe = entry.recipeId ? recipesById[String(entry.recipeId)] : undefined;
              return (
                <article key={`${entry.id ?? entry.recipeId}-${entry.day ?? entry.dayNumber ?? "day"}`} className={styles.planEntryItem}>
                  <span>{mealTypeLabel(entry.mealPlanType)}</span>
                  <div>
                    <strong>{recipe?.name || `Recipe #${entry.recipeId ?? "-"}`}</strong>
                    <small>Day {entry.day ?? entry.dayNumber ?? "-"}</small>
                  </div>
                  <em>{recipe?.preparationTime === undefined ? "-" : `${recipe.preparationTime} min`}</em>
                </article>
              );
            })}
            {(plan.entries ?? []).length === 0 && <p className={styles.emptyState}>No recipes listed in this plan.</p>}
          </div>
        </section>

        <section className={styles.planModalSection}>
          <h4>Tags</h4>
          <p>{formatTags(plan.tags)}</p>
        </section>
      </section>
    </div>
  );
}

function MacroBox({ label, value }: { label: string; value: string }) {
  return (
    <article>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function MealPlanCard({
  plan,
  assigned,
  actionLabel,
  actionDisabled,
  onAction,
}: {
  plan: MealPlan;
  assigned?: boolean;
  actionLabel?: string;
  actionDisabled?: boolean;
  onAction?: () => void;
}) {
  return (
    <article className={styles.patientPlanItem}>
      <div>
        <div className={styles.patientPlanItemTitle}>
          <strong>{plan.name || "Untitled meal plan"}</strong>
          {assigned && <span>Assigned</span>}
        </div>
        <p>{plan.description || "-"}</p>
        <div className={styles.patientPlanMeta}>
          <span>{plan.category || "General"}</span>
          <span>{formatKcal(plan.calories)}</span>
          <span>{plan.entries?.length ?? 0} entries</span>
        </div>
        <small>{formatTags(plan.tags)}</small>
      </div>
      {onAction && (
        <button type="button" disabled={actionDisabled} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </article>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

function RecipeCard({
  recipe,
  assigned,
  actionLabel,
  actionDisabled,
  onAction,
}: {
  recipe: Recipe;
  assigned?: boolean;
  actionLabel?: string;
  actionDisabled?: boolean;
  onAction?: () => void;
}) {
  return (
    <article className={styles.patientPlanItem}>
      <div>
        <div className={styles.patientPlanItemTitle}>
          <strong>{recipe.name || "Untitled recipe"}</strong>
          {assigned && <span>Assigned</span>}
        </div>
        <p>{recipe.description || "-"}</p>
        <div className={styles.patientPlanMeta}>
          <span>{recipe.categoryName || "General"}</span>
          <span>{recipe.recipeTypeName || "Recipe"}</span>
          <span>{recipe.preparationTime ?? "-"} min</span>
          <span>{ingredientCount(recipe)}</span>
        </div>
      </div>
      {onAction && (
        <button type="button" disabled={actionDisabled} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </article>
  );
}
