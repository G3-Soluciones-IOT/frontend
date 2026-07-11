import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/shared/i18n/useI18n";
import { API_BASE_URL, apiUrl } from "@/app/config/env";
import styles from "../../pages/PatientsPages.module.css";

interface PatientPlansRecipesTabProps {
  patientUserId: string;
  profileId?: number | string;
  accountProfileId?: number | string;
}

interface SessionUser {
  id: number | string;
}

interface NutritionistProfile {
  id: number | string;
}

interface PatientAccountProfile {
  id?: number | string;
  userProfileId?: number | string;
}

interface PatientUserProfile {
  id?: number | string;
}

interface ResolvedPatientProfileIds {
  accountProfileId: number | string | null;
  userProfileId: number | string | null;
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
  templateId?: number | string;
  sourceTemplateId?: number | string;
  originalMealPlanId?: number | string;
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
  templateId?: number | string;
  sourceTemplateId?: number | string;
  originalRecipeId?: number | string;
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
    Accept: "application/json",
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
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText ? `HTTP ${response.status}: ${errorText}` : `HTTP ${response.status}`);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  if (!text) return undefined as T;

  return JSON.parse(text) as T;
}

function firstItem<T>(data: T | T[] | null | undefined) {
  return Array.isArray(data) ? data[0] ?? null : data ?? null;
}

function normalizeText(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function mealPlanAssignmentKeys(plan: MealPlan) {
  return [
    plan.id,
    plan.templateId,
    plan.sourceTemplateId,
    plan.originalMealPlanId,
    (plan as MealPlan & { sourceMealPlanId?: number | string }).sourceMealPlanId,
    (plan as MealPlan & { templateMealPlanId?: number | string }).templateMealPlanId,
  ]
    .filter((value) => value !== undefined && value !== null)
    .map(String);
}

function recipeAssignmentKeys(recipe: Recipe) {
  return [
    recipe.id,
    recipe.templateId,
    recipe.sourceTemplateId,
    recipe.originalRecipeId,
    (recipe as Recipe & { sourceRecipeId?: number | string }).sourceRecipeId,
    (recipe as Recipe & { templateRecipeId?: number | string }).templateRecipeId,
  ]
    .filter((value) => value !== undefined && value !== null)
    .map(String);
}

function mealPlanSignature(plan: MealPlan) {
  return [
    normalizeText(plan.name),
    normalizeText(plan.category),
    plan.calories ?? "",
    plan.carbs ?? "",
    plan.proteins ?? "",
    plan.fats ?? "",
  ].join("|");
}

function recipeSignature(recipe: Recipe) {
  return [
    normalizeText(recipe.name),
    normalizeText(recipe.categoryName),
    normalizeText(recipe.recipeTypeName),
    recipe.preparationTime ?? "",
  ].join("|");
}

function mergeById<T extends { id: number | string }>(items: T[]) {
  return Array.from(
    items.reduce<Map<string, T>>((map, item) => map.set(String(item.id), item), new Map()).values(),
  );
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

  return fetchJson<MealPlan[]>(`/api/v1/meal-plan/nutritionists/${encodeURIComponent(String(nutritionistUserId))}`)
    .catch(() => fetchJson<MealPlan[]>("/api/v1/meal-plan"))
    .catch(() => []);
}

async function getNutritionistIdByUserId(userId: number | string) {
  const profile = await fetchJson<NutritionistProfile>(
    `/api/v1/nutritionists/by-user?userId=${encodeURIComponent(String(userId))}`,
  );
  return profile.id;
}

async function getPatientProfileIdsByUserId(userId: number | string): Promise<ResolvedPatientProfileIds> {
  const accountProfile = firstItem(await fetchJson<PatientAccountProfile | PatientAccountProfile[]>(
    `/api/v1/profiles/by-user/${encodeURIComponent(String(userId))}`,
  ).catch(() => null));

  const userProfile = firstItem(await fetchJson<PatientUserProfile | PatientUserProfile[]>(
    `/api/v1/user-profiles/by-user/${encodeURIComponent(String(userId))}`,
  ).catch(() => null));

  return {
    accountProfileId: accountProfile?.id ?? null,
    userProfileId: accountProfile?.userProfileId ?? userProfile?.id ?? null,
  };
}

async function getLibraryRecipes(nutritionistUserId?: number | string) {
  if (!nutritionistUserId) return [] as Recipe[];

  if (isLocalMockApi()) {
    return fetchJson<Recipe[]>(`/recipes?createdByNutritionistId=${encodeURIComponent(String(nutritionistUserId))}`).catch(() => []);
  }

  return fetchJson<Recipe[]>(`/api/v1/recipes/nutritionists/${encodeURIComponent(String(nutritionistUserId))}/templates/detailed`)
    .catch(() => fetchJson<Recipe[]>(`/api/v1/recipes/nutritionists/${encodeURIComponent(String(nutritionistUserId))}/templates`))
    .catch(() => fetchJson<Recipe[]>("/api/v1/recipes/templates/detailed"))
    .then((recipes) =>
      recipes.filter((recipe) =>
        recipe.assignedToProfileId === undefined ||
        recipe.assignedToProfileId === null,
      ).filter((recipe) =>
        !("createdByNutritionistId" in recipe) ||
        String((recipe as Recipe & { createdByNutritionistId?: number | string }).createdByNutritionistId) ===
          String(nutritionistUserId),
      ),
    )
    .catch(() => []);
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

export function PatientPlansRecipesTab({ patientUserId, profileId, accountProfileId }: PatientPlansRecipesTabProps) {
  const { t } = useI18n();
  const nutritionistUserId = getSessionUser()?.id;
  const [nutritionistId, setNutritionistId] = useState<number | string | null>(null);
  const [resolvedUserProfileId, setResolvedUserProfileId] = useState<number | string | null>(profileId ?? null);
  const [resolvedAccountProfileId, setResolvedAccountProfileId] = useState<number | string | null>(accountProfileId ?? null);
  const [assignedMealPlans, setAssignedMealPlans] = useState<MealPlan[]>([]);
  const [assignedRecipes, setAssignedRecipes] = useState<Recipe[]>([]);
  const [libraryMealPlans, setLibraryMealPlans] = useState<MealPlan[]>([]);
  const [libraryRecipes, setLibraryRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningKey, setAssigningKey] = useState<string | null>(null);
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const assignedMealPlanKeys = useMemo(
    () => new Set(assignedMealPlans.flatMap(mealPlanAssignmentKeys)),
    [assignedMealPlans],
  );

  const assignedMealPlanSignatures = useMemo(
    () => new Set(assignedMealPlans.map(mealPlanSignature).filter(Boolean)),
    [assignedMealPlans],
  );

  const assignedRecipeKeys = useMemo(
    () => new Set(assignedRecipes.flatMap(recipeAssignmentKeys)),
    [assignedRecipes],
  );

  const assignedRecipeSignatures = useMemo(
    () => new Set(assignedRecipes.map(recipeSignature).filter(Boolean)),
    [assignedRecipes],
  );

  const availableMealPlans = useMemo(
    () =>
      libraryMealPlans.filter((plan) => {
        const hasAssignedKey = mealPlanAssignmentKeys(plan).some((key) => assignedMealPlanKeys.has(key));
        return !hasAssignedKey && !assignedMealPlanSignatures.has(mealPlanSignature(plan));
      }),
    [assignedMealPlanKeys, assignedMealPlanSignatures, libraryMealPlans],
  );

  const availableRecipes = useMemo(
    () =>
      libraryRecipes.filter((recipe) => {
        const hasAssignedKey = recipeAssignmentKeys(recipe).some((key) => assignedRecipeKeys.has(key));
        return !hasAssignedKey && !assignedRecipeSignatures.has(recipeSignature(recipe));
      }),
    [assignedRecipeKeys, assignedRecipeSignatures, libraryRecipes],
  );

  const recipesById = useMemo(() => {
    return [...assignedRecipes, ...libraryRecipes].reduce<Record<string, Recipe>>((nextMap, recipe) => {
      nextMap[String(recipe.id)] = recipe;
      return nextMap;
    }, {});
  }, [assignedRecipes, libraryRecipes]);

  const mealPlanProfileId = profileId ?? resolvedUserProfileId;
  const recipeProfileId = accountProfileId ?? resolvedAccountProfileId ?? mealPlanProfileId;
  const assignmentProfileId = mealPlanProfileId ?? recipeProfileId;
  const recipeFallbackProfileId =
    mealPlanProfileId && recipeProfileId && String(mealPlanProfileId) !== String(recipeProfileId)
      ? mealPlanProfileId
      : null;

  useEffect(() => {
    let ignore = false;

    async function resolveNutritionistId() {
      if (!nutritionistUserId) {
        setNutritionistId(null);
        return;
      }

      const resolvedId = await getNutritionistIdByUserId(nutritionistUserId).catch(() => null);
      if (!ignore) setNutritionistId(resolvedId);
    }

    void resolveNutritionistId();

    return () => {
      ignore = true;
    };
  }, [nutritionistUserId]);

  useEffect(() => {
    let ignore = false;

    async function resolvePatientProfileId() {
      if (profileId) {
        setResolvedUserProfileId(profileId);
      }

      if (accountProfileId) {
        setResolvedAccountProfileId(accountProfileId);
      }

      const nextProfileIds = await getPatientProfileIdsByUserId(patientUserId).catch(() => null);
      if (!ignore && nextProfileIds) {
        setResolvedUserProfileId(profileId ?? nextProfileIds.userProfileId);
        setResolvedAccountProfileId(accountProfileId ?? nextProfileIds.accountProfileId);
      }
    }

    void resolvePatientProfileId();

    return () => {
      ignore = true;
    };
  }, [accountProfileId, patientUserId, profileId]);

  const loadPlansAndRecipes = async () => {
    try {
      setLoading(true);
      setError(null);

      const [nextAssignedPlans, nextAssignedRecipes, nextLibraryPlans, nextLibraryRecipes] = await Promise.all([
        mealPlanProfileId ? getAssignedMealPlans(mealPlanProfileId).catch(() => []) : Promise.resolve([]),
        recipeProfileId
          ? Promise.all([
              getAssignedRecipes(recipeProfileId).catch(() => []),
              recipeFallbackProfileId ? getAssignedRecipes(recipeFallbackProfileId).catch(() => []) : Promise.resolve([]),
            ]).then(([primaryRecipes, fallbackRecipes]) => mergeById([...primaryRecipes, ...fallbackRecipes]))
          : Promise.resolve([]),
        getLibraryMealPlans(nutritionistId ?? undefined).catch(() => []),
        getLibraryRecipes(nutritionistUserId).catch(() => []),
      ]);

      setAssignedMealPlans(Array.isArray(nextAssignedPlans) ? nextAssignedPlans : []);
      setAssignedRecipes(Array.isArray(nextAssignedRecipes) ? nextAssignedRecipes : []);
      setLibraryMealPlans(Array.isArray(nextLibraryPlans) ? nextLibraryPlans : []);
      setLibraryRecipes(Array.isArray(nextLibraryRecipes) ? nextLibraryRecipes : []);

      if (!assignmentProfileId) {
        setError("No se encontro el perfil del paciente. Revisa que tenga onboarding creado.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plans and recipes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPlansAndRecipes();
  }, [assignmentProfileId, mealPlanProfileId, nutritionistId, nutritionistUserId, patientUserId, recipeFallbackProfileId, recipeProfileId]);

  async function assignItem(target: AssignTarget, itemId: number | string) {
    const key = `${target}-${itemId}`;
    setAssigningKey(key);
    setError(null);
    setSuccess(null);

    try {
      if (assignmentProfileId && isLocalMockApi()) {
        if (target === "mealPlan") {
          await updateLocalResource<MealPlan>("mealPlans", itemId, { profileId: Number(mealPlanProfileId ?? assignmentProfileId) });
        } else {
          await updateLocalResource<Recipe>("recipes", itemId, { assignedToProfileId: Number(recipeProfileId ?? assignmentProfileId) } as Partial<Recipe>);
        }
      } else if (assignmentProfileId) {
        const targetProfileId = target === "mealPlan" ? mealPlanProfileId ?? assignmentProfileId : recipeProfileId ?? assignmentProfileId;
        const path = target === "mealPlan"
          ? `/api/v1/meal-plan/${encodeURIComponent(String(itemId))}/assign-to-profile/${encodeURIComponent(String(targetProfileId))}`
          : `/api/v1/recipes/${encodeURIComponent(String(itemId))}/assign-to-profile/${encodeURIComponent(String(targetProfileId))}`;

        try {
          await fetchJson<void>(path, { method: "POST" });
        } catch (err) {
          if (target !== "recipe" || !recipeFallbackProfileId) throw err;

          await fetchJson<void>(
            `/api/v1/recipes/${encodeURIComponent(String(itemId))}/assign-to-profile/${encodeURIComponent(String(recipeFallbackProfileId))}`,
            { method: "POST" },
          );
        }
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
        <h2>{t("patients.detail.tab.plans")}</h2>
        <span>{loading ? t("patients.common.loading") : t("patients.plans.assignmentCenter")}</span>
      </div>

      {error && <p className={styles.errorText}>{error}</p>}
      {success && <p className={styles.successText}>{success}</p>}

      <div className={styles.patientPlansStats}>
        <PlanStat label={t("patients.plans.assignedMealPlans")} value={assignedMealPlans.length} />
        <PlanStat label={t("patients.plans.extraRecipes")} value={assignedRecipes.length} />
        <PlanStat label={t("patients.plans.mealPlanLibrary")} value={availableMealPlans.length} />
        <PlanStat label={t("patients.plans.extraRecipeLibrary")} value={availableRecipes.length} />
      </div>

      {loading ? (
        <p className={styles.directoryMessage}>{t("patients.plans.loading")}</p>
      ) : (
        <>
          <div className={styles.patientPlansGrid}>
            <section className={styles.patientPlansBlock}>
              <div className={styles.patientPlansBlockHeader}>
                <h3>{t("patients.plans.assignedMealPlans")}</h3>
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
                {assignedMealPlans.length === 0 && <p className={styles.emptyState}>{t("patients.plans.noAssignedMealPlans")}</p>}
              </div>
            </section>

            <section className={styles.patientPlansBlock}>
              <div className={styles.patientPlansBlockHeader}>
                <h3>{t("patients.plans.assignedExtraRecipes")}</h3>
                <span>{assignedRecipes.length}</span>
              </div>
              <div className={styles.patientPlansList}>
                {assignedRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} assigned />
                ))}
                {assignedRecipes.length === 0 && <p className={styles.emptyState}>{t("patients.plans.noAssignedRecipes")}</p>}
              </div>
            </section>
          </div>

          <div className={styles.patientPlansGrid}>
            <section className={styles.patientPlansBlock}>
              <div className={styles.patientPlansBlockHeader}>
                <h3>{t("patients.plans.availableMealPlans")}</h3>
                <span>{availableMealPlans.length}</span>
              </div>
              <div className={styles.patientPlansList}>
                {availableMealPlans.map((plan) => {
                  const key = `mealPlan-${plan.id}`;
                  return (
                    <MealPlanCard
                      key={plan.id}
                      plan={plan}
                      actionLabel={t("patients.action.assign")}
                      actionDisabled={assigningKey === key || !assignmentProfileId}
                      onAction={() => assignItem("mealPlan", plan.id)}
                    />
                  );
                })}
                {availableMealPlans.length === 0 && <p className={styles.emptyState}>{t("patients.plans.noMealPlanTemplates")}</p>}
              </div>
            </section>

            <section className={styles.patientPlansBlock}>
              <div className={styles.patientPlansBlockHeader}>
                <h3>{t("patients.plans.availableExtraRecipes")}</h3>
                <span>{availableRecipes.length}</span>
              </div>
              <div className={styles.patientPlansList}>
                {availableRecipes.map((recipe) => {
                  const key = `recipe-${recipe.id}`;
                  return (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      actionLabel={t("patients.action.assign")}
                      actionDisabled={assigningKey === key || !assignmentProfileId}
                      onAction={() => assignItem("recipe", recipe.id)}
                    />
                  );
                })}
                {availableRecipes.length === 0 && <p className={styles.emptyState}>{t("patients.plans.noRecipeTemplates")}</p>}
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
