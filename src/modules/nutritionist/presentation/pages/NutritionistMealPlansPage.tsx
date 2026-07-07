import { useEffect, useMemo, useState, type FormEvent } from "react";
import { apiUrl } from "@/app/config/env";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";

interface NutritionistMealPlansPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

interface SessionUser {
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
}

interface MealPlanForm {
  name: string;
  description: string;
  calories: string;
  carbs: string;
  proteins: string;
  fats: string;
  profileId: string;
  category: string;
  isCurrent: boolean;
  tags: string;
  entries: Array<{
    recipeId: string;
    type: string;
    day: string;
  }>;
}

const emptyForm: MealPlanForm = {
  name: "",
  description: "",
  calories: "",
  carbs: "",
  proteins: "",
  fats: "",
  profileId: "0",
  category: "",
  isCurrent: true,
  tags: "",
  entries: [{ recipeId: "", type: "BREAKFAST", day: "1" }],
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
    throw new Error(`HTTP ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
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

function mealTypeLabel(value?: number | string) {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized === "0" || normalized === "breakfast") return "Breakfast";
  if (normalized === "1" || normalized === "lunch") return "Lunch";
  if (normalized === "2" || normalized === "dinner") return "Dinner";
  if (normalized === "3" || normalized === "snack") return "Snack";
  return value === undefined ? "Meal" : String(value);
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function NutritionistMealPlansPage({ currentPath, onNavigate }: NutritionistMealPlansPageProps) {
  const navigationItems = useNavigation();
  const nutritionistUserId = getSessionUser()?.id;
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [recipes, setRecipes] = useState<MealPlanRecipe[]>([]);
  const [selectedMealPlanId, setSelectedMealPlanId] = useState<number | string | null>(null);
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null);
  const [form, setForm] = useState<MealPlanForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [recipesLoading, setRecipesLoading] = useState(false);
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
    if (!nutritionistUserId) {
      setMealPlans([]);
      setError("No active nutritionist session found.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const nextPlans = await fetchJson<MealPlan[]>(
        `/api/v1/meal-plan/nutritionists/${encodeURIComponent(String(nutritionistUserId))}`,
      );
      setMealPlans(Array.isArray(nextPlans) ? nextPlans : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load meal plans.");
    } finally {
      setLoading(false);
    }
  };

  const loadRecipes = async () => {
    try {
      setRecipesLoading(true);
      const nextRecipes = await fetchJson<MealPlanRecipe[]>("/api/v1/meal-plan/recipes");
      setRecipes(Array.isArray(nextRecipes) ? nextRecipes : []);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Failed to load recipes.");
    } finally {
      setRecipesLoading(false);
    }
  };

  useEffect(() => {
    void loadMealPlans();
  }, [nutritionistUserId]);

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
    await loadRecipes();
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
    const confirmed = window.confirm("Delete this meal plan?");
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

  function updateForm(field: keyof Omit<MealPlanForm, "entries">, value: string | boolean) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateEntry(index: number, field: "recipeId" | "type" | "day", value: string) {
    setForm((current) => ({
      ...current,
      entries: current.entries.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    }));
  }

  function addEntry() {
    setForm((current) => ({
      ...current,
      entries: [...current.entries, { recipeId: "", type: "BREAKFAST", day: "1" }],
    }));
  }

  function removeEntry(index: number) {
    setForm((current) => ({
      ...current,
      entries: current.entries.filter((_, entryIndex) => entryIndex !== index),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nutritionistUserId) {
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
      profileId: Number(form.profileId || 0),
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

      const created = await fetchJson<MealPlan>(
        `/api/v1/meal-plan/nutritionists/${encodeURIComponent(String(nutritionistUserId))}`,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );

      const entries = form.entries.filter((entry) => entry.recipeId && entry.day);
      await Promise.all(
        entries.map((entry) =>
          fetchJson<void>(`/api/v1/meal-plan/${created.id}/entries`, {
            method: "POST",
            body: JSON.stringify({
              recipeId: Number(entry.recipeId),
              type: entry.type,
              day: Number(entry.day),
              userId: Number(nutritionistUserId),
            }),
          }),
        ),
      );

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
      title="Meal Plans"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={navigationItems}
      breadcrumbs={["Nutritionist", "Meal Plans"]}
    >
      <div className="nutritionist-mealplans-page">
        <header className="nutritionist-mealplans-hero">
          <div>
            <span>Meal plan templates</span>
            <h2>Manage your nutrition plans</h2>
            <p>Create reusable plans, organize recipes by day and keep macros visible at a glance.</p>
          </div>
          <button type="button" onClick={openCreateModal}>Create Meal Plan</button>
        </header>

        <section className="nutritionist-mealplans-stats">
          <StatCard label="My Plans" value={mealPlans.length} detail="Templates" />
          <StatCard label="Active" value={activeCount} detail="Current plans" />
          <StatCard label="Entries" value={entryCount} detail="Recipes scheduled" />
          <StatCard label="Categories" value={categories.length} detail="Plan groups" />
        </section>

        {error && <div className="nutritionist-mealplans-warning">{error}</div>}

        <div className={`nutritionist-mealplans-workspace ${selectedMealPlanId ? "nutritionist-mealplans-workspace-detail" : ""}`}>
          <section className="nutritionist-mealplans-card">
            <div className="nutritionist-mealplans-toolbar">
              <input
                type="search"
                placeholder="Search by name, category, tags..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <button type="button" onClick={() => { setSearch(""); setCategoryFilter("all"); }}>
                Clear
              </button>
            </div>

            {loading && <div className="nutritionist-mealplans-state">Loading meal plans...</div>}

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
                        {plan.isCurrent ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="nutritionist-mealplans-macros">
                      <Macro label="Calories" value={formatKcal(plan.calories)} />
                      <Macro label="Carbs" value={formatGram(plan.carbs)} />
                      <Macro label="Protein" value={formatGram(plan.proteins)} />
                      <Macro label="Fats" value={formatGram(plan.fats)} />
                    </div>
                    <div className="nutritionist-mealplans-tags">
                      <strong>{plan.category || "Uncategorized"}</strong>
                      {(plan.tags ?? []).slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
                    </div>
                    <div className="nutritionist-mealplans-actions">
                      <button type="button" onClick={() => openDetail(plan.id)}>View</button>
                      <button type="button" onClick={() => handleDelete(plan.id)}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {!loading && filteredMealPlans.length === 0 && (
              <div className="nutritionist-mealplans-state">No meal plans found.</div>
            )}
          </section>

          {selectedMealPlanId && (
            <aside className="nutritionist-mealplans-detail">
              <div className="nutritionist-mealplans-detail-header">
                <h3>Meal Plan Details</h3>
                <button type="button" onClick={() => { setSelectedMealPlanId(null); setSelectedMealPlan(null); }}>
                  X
                </button>
              </div>

              {detailLoading && <div className="nutritionist-mealplans-state">Loading details...</div>}
              {detailError && <div className="nutritionist-mealplans-warning">{detailError}</div>}
              {!detailLoading && selectedMealPlan && (
                <MealPlanDetail plan={selectedMealPlan} recipesById={recipesById} onDelete={handleDelete} />
              )}
            </aside>
          )}
        </div>

        {modalOpen && (
          <div className="nutritionist-mealplans-modal" role="dialog" aria-modal="true">
            <div className="nutritionist-mealplans-modal-content">
              <div className="nutritionist-mealplans-modal-header">
                <div>
                  <h3>Create Meal Plan</h3>
                  <p>Set the base macros and add recipe entries to the template.</p>
                </div>
                <button type="button" onClick={() => setModalOpen(false)} aria-label="Close meal plan modal">X</button>
              </div>

              <div className="nutritionist-mealplans-modal-body">
                {modalError && <div className="nutritionist-mealplans-warning">{modalError}</div>}
                {recipesLoading ? (
                  <div className="nutritionist-mealplans-state">Loading recipes...</div>
                ) : (
                  <MealPlanForm
                    form={form}
                    recipes={recipes}
                    saving={saving}
                    onSubmit={handleSubmit}
                    onChange={updateForm}
                    onEntryChange={updateEntry}
                    onAddEntry={addEntry}
                    onRemoveEntry={removeEntry}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </SharedLayout>
  );
}

function StatCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <article className="nutritionist-mealplans-stat">
      <strong>{value}</strong>
      <span>{label}</span>
      <p>{detail}</p>
    </article>
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
  onDelete,
}: {
  plan: MealPlan;
  recipesById: Record<string, MealPlanRecipe>;
  onDelete: (id: number | string) => void;
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
        <h4>Nutrition</h4>
        <div className="nutritionist-mealplans-macros">
          <Macro label="Calories" value={formatKcal(plan.calories)} />
          <Macro label="Carbs" value={formatGram(plan.carbs)} />
          <Macro label="Protein" value={formatGram(plan.proteins)} />
          <Macro label="Fats" value={formatGram(plan.fats)} />
        </div>
      </section>

      <section className="nutritionist-mealplans-detail-section">
        <h4>Information</h4>
        <DetailRow label="Category" value={plan.category || "-"} />
        <DetailRow label="Profile ID" value={String(plan.profileId ?? "-")} />
        <DetailRow label="Status" value={plan.isCurrent ? "Active" : "Inactive"} />
        <div className="nutritionist-mealplans-tags">
          {(plan.tags ?? []).map((tag) => <span key={tag}>{tag}</span>)}
          {(plan.tags ?? []).length === 0 && <span>No tags</span>}
        </div>
      </section>

      <section className="nutritionist-mealplans-detail-section">
        <h4>Entries</h4>
        <ul className="nutritionist-mealplans-entry-list">
          {(plan.entries ?? []).map((entry) => {
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
        {(plan.entries ?? []).length === 0 && <p>No entries listed.</p>}
      </section>

      <div className="nutritionist-mealplans-detail-actions">
        <button type="button" onClick={() => onDelete(plan.id)}>Delete Meal Plan</button>
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
  recipes,
  saving,
  onSubmit,
  onChange,
  onEntryChange,
  onAddEntry,
  onRemoveEntry,
}: {
  form: MealPlanForm;
  recipes: MealPlanRecipe[];
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (field: keyof Omit<MealPlanForm, "entries">, value: string | boolean) => void;
  onEntryChange: (index: number, field: "recipeId" | "type" | "day", value: string) => void;
  onAddEntry: () => void;
  onRemoveEntry: (index: number) => void;
}) {
  return (
    <form className="nutritionist-mealplans-form" onSubmit={onSubmit}>
      <label className="nutritionist-mealplans-field nutritionist-mealplans-field-full">
        <span>Name</span>
        <input value={form.name} onChange={(event) => onChange("name", event.target.value)} required />
      </label>

      <label className="nutritionist-mealplans-field nutritionist-mealplans-field-full">
        <span>Description</span>
        <textarea value={form.description} onChange={(event) => onChange("description", event.target.value)} required />
      </label>

      <label className="nutritionist-mealplans-field">
        <span>Category</span>
        <input value={form.category} onChange={(event) => onChange("category", event.target.value)} required />
      </label>

      <label className="nutritionist-mealplans-field">
        <span>Profile ID</span>
        <input type="number" min="0" value={form.profileId} onChange={(event) => onChange("profileId", event.target.value)} />
      </label>

      <label className="nutritionist-mealplans-field">
        <span>Calories</span>
        <input type="number" min="0" step="0.1" value={form.calories} onChange={(event) => onChange("calories", event.target.value)} />
      </label>

      <label className="nutritionist-mealplans-field">
        <span>Carbs</span>
        <input type="number" min="0" step="0.1" value={form.carbs} onChange={(event) => onChange("carbs", event.target.value)} />
      </label>

      <label className="nutritionist-mealplans-field">
        <span>Proteins</span>
        <input type="number" min="0" step="0.1" value={form.proteins} onChange={(event) => onChange("proteins", event.target.value)} />
      </label>

      <label className="nutritionist-mealplans-field">
        <span>Fats</span>
        <input type="number" min="0" step="0.1" value={form.fats} onChange={(event) => onChange("fats", event.target.value)} />
      </label>

      <label className="nutritionist-mealplans-field nutritionist-mealplans-field-full">
        <span>Tags</span>
        <input placeholder="weight loss, balanced, weekly" value={form.tags} onChange={(event) => onChange("tags", event.target.value)} />
      </label>

      <label className="nutritionist-mealplans-toggle">
        <input type="checkbox" checked={form.isCurrent} onChange={(event) => onChange("isCurrent", event.target.checked)} />
        <span>Current active template</span>
      </label>

      <section className="nutritionist-mealplans-entry-editor">
        <div className="nutritionist-mealplans-entry-header">
          <h4>Recipe entries</h4>
          <button type="button" onClick={onAddEntry}>Add Entry</button>
        </div>

        {form.entries.map((entry, index) => (
          <div className="nutritionist-mealplans-entry-row" key={index}>
            <label className="nutritionist-mealplans-field">
              <span>Recipe</span>
              <select value={entry.recipeId} onChange={(event) => onEntryChange(index, "recipeId", event.target.value)}>
                <option value="">Select recipe</option>
                {recipes.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>{recipe.name}</option>
                ))}
              </select>
            </label>
            <label className="nutritionist-mealplans-field">
              <span>Type</span>
              <select value={entry.type} onChange={(event) => onEntryChange(index, "type", event.target.value)}>
                <option value="BREAKFAST">Breakfast</option>
                <option value="LUNCH">Lunch</option>
                <option value="DINNER">Dinner</option>
                <option value="SNACK">Snack</option>
              </select>
            </label>
            <label className="nutritionist-mealplans-field">
              <span>Day</span>
              <input type="number" min="1" value={entry.day} onChange={(event) => onEntryChange(index, "day", event.target.value)} />
            </label>
            <button type="button" onClick={() => onRemoveEntry(index)} disabled={form.entries.length === 1}>Remove</button>
          </div>
        ))}
      </section>

      <button type="submit" className="nutritionist-mealplans-submit" disabled={saving}>
        {saving ? "Saving..." : "Save Meal Plan"}
      </button>
    </form>
  );
}
