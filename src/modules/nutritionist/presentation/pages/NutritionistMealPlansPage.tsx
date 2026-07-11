import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { apiUrl } from "@/app/config/env";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import { useI18n } from "@/shared/i18n/useI18n";
import type { TranslationKey } from "@/shared/i18n/translations";

interface NutritionistMealPlansPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

interface SessionUser {
  id: string | number;
}

interface NutritionistProfile {
  id: string | number;
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
  createdByNutritionistId?: number | string;
  source?: "meal-plan" | "recipe-template";
}

interface MealPlanForm {
  name: string;
  description: string;
  calories: string;
  carbs: string;
  proteins: string;
  fats: string;
  category: string;
  isCurrent: boolean;
  tags: string;
}

const emptyForm: MealPlanForm = {
  name: "",
  description: "",
  calories: "",
  carbs: "",
  proteins: "",
  fats: "",
  category: "",
  isCurrent: true,
  tags: "",
};

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
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText ? `HTTP ${response.status}: ${errorText}` : `HTTP ${response.status}`);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  if (!text) return undefined as T;

  return JSON.parse(text) as T;
}

async function getNutritionistIdByUserId(userId: string | number) {
  const profile = await fetchJson<NutritionistProfile>(
    `/api/v1/nutritionists/by-user?userId=${encodeURIComponent(String(userId))}`,
  );
  return profile.id;
}

function normalize(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function formatKcal(value?: number) {
  return value === undefined ? "-" : `${value.toLocaleString("en-US")} kcal`;
}

function formatGram(value?: number) {
  return value === undefined ? "-" : `${value} g`;
}

function mealTypeLabel(value: number | string | undefined, t: (key: TranslationKey) => string) {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized === "0" || normalized === "breakfast") return t("recipes.category.breakfast");
  if (normalized === "1" || normalized === "lunch") return t("recipes.category.lunch");
  if (normalized === "2" || normalized === "dinner") return t("recipes.category.dinner");
  if (normalized === "3" || normalized === "snack") return t("mealPlans.meal.snack");
  return value === undefined ? t("mealPlans.meal.default") : String(value);
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function NutritionistMealPlansPage({ currentPath, onNavigate }: NutritionistMealPlansPageProps) {
  const { t } = useI18n();
  const navigationItems = useNavigation();
  const nutritionistUserId = getSessionUser()?.id;
  const [nutritionistId, setNutritionistId] = useState<string | number | null>(null);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<MealPlanRecipe[]>([]);
  const [selectedMealPlanId, setSelectedMealPlanId] = useState<number | string | null>(null);
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null);
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [entryForm, setEntryForm] = useState({ recipeId: "", type: "Breakfast", day: "1" });
  const [form, setForm] = useState<MealPlanForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const recipesById = useMemo(() => {
    return recipes.reduce<Record<string, MealPlanRecipe>>((map, recipe) => {
      map[String(recipe.id)] = recipe;
      return map;
    }, {});
  }, [recipes]);

  const loadMealPlans = async () => {
    if (!nutritionistId) {
      setMealPlans([]);
      setError("No active nutritionist session found.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const nextPlans = await fetchJson<MealPlan[]>(
        `/api/v1/meal-plan/nutritionists/${encodeURIComponent(String(nutritionistId))}`,
      ).catch(() => fetchJson<MealPlan[]>("/api/v1/meal-plan"));
      setMealPlans(Array.isArray(nextPlans) ? nextPlans : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load meal plans.");
    } finally {
      setLoading(false);
    }
  };

  const loadRecipes = async () => {
    if (!nutritionistUserId) return [] as MealPlanRecipe[];

    const nextRecipes = await fetchJson<MealPlanRecipe[]>("/api/v1/recipes").catch(() => []);
    const loadedRecipes = Array.isArray(nextRecipes)
      ? nextRecipes
          .filter((recipe) => String(recipe.createdByNutritionistId) === String(nutritionistUserId))
          .map((recipe) => ({ ...recipe, source: "recipe-template" as const }))
      : [];

    setRecipes(loadedRecipes);

    if (loadedRecipes.length === 0) {
      setModalError("No recipes were found for this nutritionist in /api/v1/recipes.");
    }

    return loadedRecipes;
  };

  useEffect(() => {
    let ignore = false;

    async function resolveNutritionistId() {
      if (!nutritionistUserId) {
        setNutritionistId(null);
        setMealPlans([]);
        setError("No active nutritionist session found.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const resolvedId = await getNutritionistIdByUserId(nutritionistUserId);
        if (!ignore) setNutritionistId(resolvedId);
      } catch (err) {
        if (!ignore) {
          setNutritionistId(null);
          setMealPlans([]);
          setError(err instanceof Error ? err.message : "Failed to resolve nutritionist profile.");
          setLoading(false);
        }
      }
    }

    void resolveNutritionistId();

    return () => {
      ignore = true;
    };
  }, [nutritionistUserId]);

  useEffect(() => {
    if (nutritionistId) void loadMealPlans();
  }, [nutritionistId]);

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
        normalize(plan.description).includes(query) ||
        normalize(plan.category).includes(query) ||
        normalize(tags).includes(query);
      const matchesCategory = categoryFilter === "all" || normalize(plan.category) === normalize(categoryFilter);
      return matchesSearch && matchesCategory;
    });
  }, [mealPlans, search, categoryFilter]);

  const activeCount = useMemo(() => mealPlans.filter((plan) => plan.isCurrent).length, [mealPlans]);
  const entryCount = useMemo(
    () => mealPlans.reduce((total, plan) => total + (plan.entries?.length ?? 0), 0),
    [mealPlans],
  );

  async function openCreateModal() {
    setForm(emptyForm);
    setModalError(null);
    setModalOpen(true);
  }

  async function openDetail(planId: number | string) {
    setSelectedMealPlanId(planId);
    setSelectedMealPlan(null);
    setDetailError(null);

    try {
      setDetailLoading(true);
      const [detail] = await Promise.all([
        fetchJson<MealPlan>(`/api/v1/meal-plan/${planId}`),
        recipes.length ? Promise.resolve(recipes) : loadRecipes(),
      ]);
      setSelectedMealPlan(detail);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Failed to load meal plan details.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleDelete(planId: number | string) {
    const confirmed = window.confirm(t("mealPlans.confirm.delete"));
    if (!confirmed) return;

    try {
      setError(null);
      await fetchJson<void>(`/api/v1/meal-plan/${planId}`, { method: "DELETE" });
      setMealPlans((current) => current.filter((plan) => String(plan.id) !== String(planId)));
      if (String(selectedMealPlanId) === String(planId)) {
        setSelectedMealPlanId(null);
        setSelectedMealPlan(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete meal plan.");
    }
  }

  function updateForm(field: keyof MealPlanForm, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openEntryModal() {
    setEntryForm({ recipeId: recipes[0] ? String(recipes[0].id) : "", type: "Breakfast", day: "1" });
    setModalError(null);
    setEntryModalOpen(true);
    if (recipes.length === 0) void loadRecipes();
  }

  async function handleAddEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMealPlanId || !nutritionistUserId) return;

    if (!entryForm.recipeId || !entryForm.day) {
      setModalError("Select a recipe and day.");
      return;
    }

    try {
      setSaving(true);
      setModalError(null);
      await fetchJson<void>(`/api/v1/meal-plan/${selectedMealPlanId}/entries`, {
        method: "POST",
        body: JSON.stringify({
          recipeId: Number(entryForm.recipeId),
          type: entryForm.type,
          day: Number(entryForm.day),
          userId: Number(nutritionistUserId),
        }),
      });

      const detail = await fetchJson<MealPlan>(`/api/v1/meal-plan/${selectedMealPlanId}`);
      setSelectedMealPlan(detail);
      await loadMealPlans();
      setEntryModalOpen(false);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Failed to add recipe entry.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nutritionistUserId || !nutritionistId) {
      setModalError("No active nutritionist session found.");
      return;
    }

    const body = {
      name: form.name.trim(),
      description: form.description.trim(),
      calories: Number(form.calories),
      carbs: Number(form.carbs),
      proteins: Number(form.proteins),
      fats: Number(form.fats),
      category: form.category.trim(),
      isCurrent: form.isCurrent,
      tags: parseTags(form.tags),
    };

    if (!body.name || !body.description || !body.category) {
      setModalError("Complete name, description and category.");
      return;
    }

    try {
      setSaving(true);
      setModalError(null);

      await fetchJson<MealPlan>(`/api/v1/meal-plan/nutritionists/${encodeURIComponent(String(nutritionistId))}`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      await loadMealPlans();
      setModalOpen(false);
      setForm(emptyForm);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Failed to create meal plan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SharedLayout
      title={t("mealPlans.title")}
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={navigationItems}
      breadcrumbs={[t("recipes.breadcrumb.nutritionist"), t("mealPlans.title")]}
      showPageTitle={false}
    >
      <div className="nutritionist-mealplans-page">
        <header className="nutritionist-mealplans-hero">
          <div>
            <span>{t("mealPlans.eyebrow")}</span>
            <h2>{t("mealPlans.heading")}</h2>
            <p>{t("mealPlans.description")}</p>
          </div>
          <button type="button" onClick={openCreateModal}>{t("mealPlans.create")}</button>
        </header>

        <section className="nutritionist-mealplans-stats">
          <StatCard label={t("mealPlans.stats.mine")} value={mealPlans.length} detail={t("mealPlans.stats.templates")} tone="green" icon={<ClipboardListIcon />} />
          <StatCard label={t("mealPlans.stats.active")} value={activeCount} detail={t("mealPlans.stats.current")} tone="blue" icon={<CheckCircleIcon />} />
          <StatCard label={t("mealPlans.stats.entries")} value={entryCount} detail={t("mealPlans.stats.scheduled")} tone="amber" icon={<CalendarIcon />} />
          <StatCard label={t("mealPlans.stats.categories")} value={categories.length} detail={t("mealPlans.stats.groups")} tone="purple" icon={<TagsIcon />} />
        </section>

        {error && <div className="nutritionist-mealplans-warning">{error}</div>}

        <div className={`nutritionist-mealplans-workspace ${selectedMealPlanId ? "nutritionist-mealplans-workspace-detail" : ""}`}>
          <section className="nutritionist-mealplans-card">
            <div className="nutritionist-mealplans-toolbar">
              <input
                type="search"
                placeholder={t("mealPlans.search.placeholder")}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="all">{t("recipes.form.selectCategory")}</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <button type="button" onClick={() => { setSearch(""); setCategoryFilter("all"); }}>
                {t("recipes.search.clear")}
              </button>
            </div>

            {loading && <div className="nutritionist-mealplans-state">{t("mealPlans.loading")}</div>}

            {!loading && (
              <div className="nutritionist-mealplans-grid">
                {filteredMealPlans.map((plan) => (
                  <article className="nutritionist-mealplans-plan" key={plan.id}>
                    <div className="nutritionist-mealplans-plan-head">
                      <div>
                        <h3>{plan.name || "-"}</h3>
                        <p>{plan.description || "-"}</p>
                      </div>
                      <span className={plan.isCurrent ? "nutritionist-mealplans-badge-active" : "nutritionist-mealplans-badge-muted"}>
                        {plan.isCurrent ? t("patients.status.active") : t("mealPlans.status.inactive")}
                      </span>
                    </div>
                    <div className="nutritionist-mealplans-macros">
                      <Macro label={t("dashboard.metric.calories")} value={formatKcal(plan.calories)} />
                      <Macro label={t("dashboard.metric.carbs")} value={formatGram(plan.carbs)} />
                      <Macro label={t("dashboard.metric.protein")} value={formatGram(plan.proteins)} />
                      <Macro label={t("dashboard.metric.fats")} value={formatGram(plan.fats)} />
                    </div>
                    <div className="nutritionist-mealplans-tags">
                      <strong>{plan.category || t("mealPlans.uncategorized")}</strong>
                      {(plan.tags ?? []).slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
                    </div>
                    <div className="nutritionist-mealplans-actions">
                      <button type="button" onClick={() => openDetail(plan.id)}>{t("recipes.action.view")}</button>
                      <button type="button" onClick={() => handleDelete(plan.id)}>{t("recipes.action.delete")}</button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {!loading && filteredMealPlans.length === 0 && (
              <div className="nutritionist-mealplans-state">{t("mealPlans.empty")}</div>
            )}
          </section>

          {selectedMealPlanId && (
            <aside className="nutritionist-mealplans-detail">
              <div className="nutritionist-mealplans-detail-header">
                <h3>{t("mealPlans.details.title")}</h3>
                <button type="button" onClick={() => { setSelectedMealPlanId(null); setSelectedMealPlan(null); }}>
                  X
                </button>
              </div>

              {detailLoading && <div className="nutritionist-mealplans-state">{t("mealPlans.details.loading")}</div>}
              {detailError && <div className="nutritionist-mealplans-warning">{detailError}</div>}
              {!detailLoading && selectedMealPlan && (
                <MealPlanDetail
                  plan={selectedMealPlan}
                  recipesById={recipesById}
                  onAddEntry={openEntryModal}
                  onDelete={handleDelete}
                  t={t}
                />
              )}
            </aside>
          )}
        </div>

        {modalOpen && (
          <div className="nutritionist-mealplans-modal" role="dialog" aria-modal="true">
            <div className="nutritionist-mealplans-modal-content">
              <div className="nutritionist-mealplans-modal-header">
                <div>
                  <h3>{t("mealPlans.create")}</h3>
                  <p>{t("mealPlans.create.description")}</p>
                </div>
                <button type="button" onClick={() => setModalOpen(false)} aria-label={t("mealPlans.action.closeModal")}>X</button>
              </div>

              <div className="nutritionist-mealplans-modal-body">
                {modalError && <div className="nutritionist-mealplans-warning">{modalError}</div>}
                <MealPlanForm
                  form={form}
                  saving={saving}
                  onSubmit={handleSubmit}
                  onChange={updateForm}
                  t={t}
                />
              </div>
            </div>
          </div>
        )}

        {entryModalOpen && selectedMealPlan && (
          <div className="nutritionist-mealplans-modal" role="dialog" aria-modal="true">
            <div className="nutritionist-mealplans-modal-content">
              <div className="nutritionist-mealplans-modal-header">
                <div>
                  <h3>{t("mealPlans.entry.add")}</h3>
                  <p>{t("mealPlans.entry.addDescription")} {selectedMealPlan.name || t("mealPlans.entry.thisPlan")}.</p>
                </div>
                <button type="button" onClick={() => setEntryModalOpen(false)} aria-label={t("mealPlans.entry.closeModal")}>X</button>
              </div>
              <div className="nutritionist-mealplans-modal-body">
                {modalError && <div className="nutritionist-mealplans-warning">{modalError}</div>}
                <form className="nutritionist-mealplans-form" onSubmit={handleAddEntry}>
                  <label className="nutritionist-mealplans-field nutritionist-mealplans-field-full">
                    <span>{t("recipes.table.recipe")}</span>
                    <select
                      value={entryForm.recipeId}
                      onChange={(event) => setEntryForm((current) => ({ ...current, recipeId: event.target.value }))}
                      required
                    >
                      <option value="">{t("mealPlans.entry.selectRecipe")}</option>
                      {recipes.map((recipe) => (
                        <option key={recipe.id} value={recipe.id}>{recipe.name || `Recipe #${recipe.id}`}</option>
                      ))}
                    </select>
                  </label>
                  <label className="nutritionist-mealplans-field">
                    <span>{t("recipes.table.type")}</span>
                    <select
                      value={entryForm.type}
                      onChange={(event) => setEntryForm((current) => ({ ...current, type: event.target.value }))}
                    >
                      <option value="Breakfast">{t("recipes.category.breakfast")}</option>
                      <option value="Lunch">{t("recipes.category.lunch")}</option>
                      <option value="Dinner">{t("recipes.category.dinner")}</option>
                      <option value="Snack">{t("mealPlans.meal.snack")}</option>
                    </select>
                  </label>
                  <label className="nutritionist-mealplans-field">
                    <span>{t("patients.tracking.day")}</span>
                    <input
                      type="number"
                      min="1"
                      value={entryForm.day}
                      onChange={(event) => setEntryForm((current) => ({ ...current, day: event.target.value }))}
                      required
                    />
                  </label>
                  <button type="submit" className="nutritionist-mealplans-submit" disabled={saving || recipes.length === 0}>
                    {saving ? t("mealPlans.entry.adding") : t("mealPlans.entry.addRecipe")}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </SharedLayout>
  );
}

function StatCard({ label, value, detail, tone, icon }: { label: string; value: number; detail: string; tone: string; icon: ReactNode }) {
  return (
    <article className={`nutritionist-mealplans-stat nutritionist-mealplans-stat-${tone}`}>
      <div className="nutritionist-mealplans-stat-icon">{icon}</div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
        <p>{detail}</p>
      </div>
    </article>
  );
}

function ClipboardListIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 5h6" />
      <path d="M9 3h6v4H9z" />
      <path d="M7 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
      <path d="M4 10h16" />
      <path d="M8 14h3" />
      <path d="M13 14h3" />
    </svg>
  );
}

function TagsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 10 14 4H6v8l6 6Z" />
      <path d="M14 4v6h6" />
      <circle cx="9" cy="9" r="1" />
      <path d="m16 14 3 3" />
    </svg>
  );
}

function Macro({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function MealPlanDetail({
  plan,
  recipesById,
  onAddEntry,
  onDelete,
  t,
}: {
  plan: MealPlan;
  recipesById: Record<string, MealPlanRecipe>;
  onAddEntry: () => void;
  onDelete: (id: number | string) => void;
  t: (key: TranslationKey) => string;
}) {
  return (
    <>
      <section className="nutritionist-mealplans-detail-title">
        <span>{plan.name?.charAt(0).toUpperCase() ?? "M"}</span>
        <div>
          <h4>{plan.name || "-"}</h4>
          <p>{plan.description || "-"}</p>
        </div>
      </section>

      <section className="nutritionist-mealplans-detail-section">
        <h4>{t("recipes.nutrition.total")}</h4>
        <div className="nutritionist-mealplans-macros">
          <Macro label={t("dashboard.metric.calories")} value={formatKcal(plan.calories)} />
          <Macro label={t("dashboard.metric.carbs")} value={formatGram(plan.carbs)} />
          <Macro label={t("dashboard.metric.protein")} value={formatGram(plan.proteins)} />
          <Macro label={t("dashboard.metric.fats")} value={formatGram(plan.fats)} />
        </div>
      </section>

      <section className="nutritionist-mealplans-detail-section">
        <h4>{t("mealPlans.details.information")}</h4>
        <DetailRow label={t("recipes.table.category")} value={plan.category || "-"} />
        <DetailRow label="Profile ID" value={String(plan.profileId ?? "-")} />
        <DetailRow label={t("patients.table.status")} value={plan.isCurrent ? t("patients.status.active") : t("mealPlans.status.inactive")} />
        <div className="nutritionist-mealplans-tags">
          {(plan.tags ?? []).map((tag) => <span key={tag}>{tag}</span>)}
          {(plan.tags ?? []).length === 0 && <span>{t("mealPlans.noTags")}</span>}
        </div>
      </section>

      <section className="nutritionist-mealplans-detail-section">
        <div className="nutritionist-mealplans-entry-header">
          <h4>{t("mealPlans.stats.entries")}</h4>
          <button type="button" onClick={onAddEntry}>{t("mealPlans.entry.addRecipe")}</button>
        </div>
        <ul className="nutritionist-mealplans-entry-list">
          {(plan.entries ?? []).map((entry) => {
            const recipe = recipesById[String(entry.recipeId)];
            return (
              <li key={entry.id}>
                <span>{mealTypeLabel(entry.mealPlanType, t)}</span>
                <strong>{recipe?.name || `${t("recipes.table.recipe")} #${entry.recipeId}`}</strong>
                <em>{t("patients.tracking.day")} {entry.day ?? "-"}</em>
              </li>
            );
          })}
        </ul>
        {(plan.entries ?? []).length === 0 && <p>{t("mealPlans.entries.empty")}</p>}
      </section>

      <div className="nutritionist-mealplans-detail-actions">
        <button type="button" onClick={() => onDelete(plan.id)}>{t("mealPlans.delete")}</button>
      </div>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="nutritionist-mealplans-detail-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MealPlanForm({
  form,
  saving,
  onSubmit,
  onChange,
  t,
}: {
  form: MealPlanForm;
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (field: keyof MealPlanForm, value: string | boolean) => void;
  t: (key: TranslationKey) => string;
}) {
  return (
    <form className="nutritionist-mealplans-form" onSubmit={onSubmit}>
      <label className="nutritionist-mealplans-field nutritionist-mealplans-field-full">
        <span>{t("patients.overview.name")}</span>
        <input value={form.name} onChange={(event) => onChange("name", event.target.value)} required />
      </label>

      <label className="nutritionist-mealplans-field nutritionist-mealplans-field-full">
        <span>{t("recipes.form.description")}</span>
        <textarea value={form.description} onChange={(event) => onChange("description", event.target.value)} required />
      </label>

      <label className="nutritionist-mealplans-field">
        <span>{t("recipes.table.category")}</span>
        <input value={form.category} onChange={(event) => onChange("category", event.target.value)} required />
      </label>

      <label className="nutritionist-mealplans-field">
        <span>{t("dashboard.metric.calories")}</span>
        <input type="number" min="0" step="0.1" value={form.calories} onChange={(event) => onChange("calories", event.target.value)} />
      </label>

      <label className="nutritionist-mealplans-field">
        <span>{t("dashboard.metric.carbs")}</span>
        <input type="number" min="0" step="0.1" value={form.carbs} onChange={(event) => onChange("carbs", event.target.value)} />
      </label>

      <label className="nutritionist-mealplans-field">
        <span>{t("patients.tracking.proteins")}</span>
        <input type="number" min="0" step="0.1" value={form.proteins} onChange={(event) => onChange("proteins", event.target.value)} />
      </label>

      <label className="nutritionist-mealplans-field">
        <span>{t("dashboard.metric.fats")}</span>
        <input type="number" min="0" step="0.1" value={form.fats} onChange={(event) => onChange("fats", event.target.value)} />
      </label>

      <label className="nutritionist-mealplans-field nutritionist-mealplans-field-full">
        <span>{t("mealPlans.tags")}</span>
        <input placeholder="weight loss, balanced, weekly" value={form.tags} onChange={(event) => onChange("tags", event.target.value)} />
      </label>

      <label className="nutritionist-mealplans-toggle">
        <input type="checkbox" checked={form.isCurrent} onChange={(event) => onChange("isCurrent", event.target.checked)} />
        <span>{t("mealPlans.currentTemplate")}</span>
      </label>

      <button type="submit" className="nutritionist-mealplans-submit" disabled={saving}>
        {saving ? t("recipes.action.saving") : t("mealPlans.save")}
      </button>
    </form>
  );
}
