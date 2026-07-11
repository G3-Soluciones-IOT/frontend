import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { apiUrl } from "@/app/config/env";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import { useI18n } from "@/shared/i18n/useI18n";
import type { TranslationKey } from "@/shared/i18n/translations";

interface NutritionistRecipesPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

interface SessionUser {
  id: string | number;
}

interface CatalogItem {
  id: number | string;
  name: string;
}

interface Ingredient extends CatalogItem {
  calories?: number;
  proteins?: number;
  fats?: number;
  carbohydrates?: number;
  macronutrientValuesId?: number | string;
}

interface RecipeIngredient {
  ingredient?: Ingredient;
  amountGrams?: number;
}

interface Recipe {
  id: number | string;
  createdByNutritionistId?: number | string;
  assignedToProfileId?: number | string;
  name?: string;
  description?: string;
  preparationTime?: number;
  difficulty?: string;
  categoryName?: string;
  recipeTypeName?: string;
  ingredients?: RecipeIngredient[];
}

interface RecipeNutrition {
  calories?: number;
  carbs?: number;
  proteins?: number;
  fats?: number;
}

interface RecipeForm {
  name: string;
  description: string;
  preparationTime: string;
  difficulty: string;
  categoryId: string;
  recipeTypeId: string;
  ingredients: Array<{
    ingredientId: string;
    amountGrams: string;
  }>;
}

type PanelMode = "none" | "view" | "create" | "edit";

const emptyForm: RecipeForm = {
  name: "",
  description: "",
  preparationTime: "",
  difficulty: "Easy",
  categoryId: "",
  recipeTypeId: "",
  ingredients: [{ ingredientId: "", amountGrams: "" }],
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

  const text = await response.text();
  if (!text) return undefined as T;

  return JSON.parse(text) as T;
}

function normalize(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function formatMinutes(value?: number) {
  return value === undefined ? "-" : `${value} min`;
}

function difficultyClass(value?: string) {
  const normalized = normalize(value);
  if (normalized.includes("easy")) return "admin-recipes-pill-green";
  if (normalized.includes("hard")) return "admin-recipes-pill-red";
  return "admin-recipes-pill-blue";
}

function categoryClass(value?: string) {
  const normalized = normalize(value);
  if (normalized.includes("breakfast")) return "admin-recipes-pill-green";
  if (normalized.includes("desayuno")) return "admin-recipes-pill-green";
  if (normalized.includes("dinner")) return "admin-recipes-pill-blue";
  if (normalized.includes("cena")) return "admin-recipes-pill-blue";
  if (normalized.includes("lunch")) return "admin-recipes-pill-amber";
  if (normalized.includes("almuerzo")) return "admin-recipes-pill-amber";
  return "admin-recipes-pill-gray";
}

function recipeTypeBucket(value?: string) {
  const normalized = normalize(value);
  if (normalized.includes("breakfast") || normalized.includes("desayuno") || normalized.includes("cafe da manha")) {
    return "breakfast";
  }
  if (normalized.includes("lunch") || normalized.includes("almuerzo") || normalized.includes("almoco")) {
    return "lunch";
  }
  if (normalized.includes("dinner") || normalized.includes("cena") || normalized.includes("jantar")) {
    return "dinner";
  }
  return normalized;
}

function ingredientSummary(recipe: Recipe, t: (key: TranslationKey) => string) {
  const count = recipe.ingredients?.length ?? 0;
  if (count === 0) return "-";
  return `${count} ${count === 1 ? t("recipes.ingredient.singular") : t("recipes.ingredient.plural")}`;
}

function toForm(recipe: Recipe, categories: CatalogItem[], recipeTypes: CatalogItem[]): RecipeForm {
  const category = categories.find((item) => normalize(item.name) === normalize(recipe.categoryName));
  const recipeType = recipeTypes.find((item) => normalize(item.name) === normalize(recipe.recipeTypeName));

  return {
    name: recipe.name ?? "",
    description: recipe.description ?? "",
    preparationTime: recipe.preparationTime === undefined ? "" : String(recipe.preparationTime),
    difficulty: recipe.difficulty ?? "Easy",
    categoryId: category ? String(category.id) : "",
    recipeTypeId: recipeType ? String(recipeType.id) : "",
    ingredients: [{ ingredientId: "", amountGrams: "" }],
  };
}

export function NutritionistRecipesPage({ currentPath, onNavigate }: NutritionistRecipesPageProps) {
  const { t } = useI18n();
  const nav = useNavigation();
  const nutritionistUserId = getSessionUser()?.id;
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<CatalogItem[]>([]);
  const [recipeTypes, setRecipeTypes] = useState<CatalogItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [panelMode, setPanelMode] = useState<PanelMode>("none");
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedNutrition, setSelectedNutrition] = useState<RecipeNutrition | null>(null);
  const [form, setForm] = useState<RecipeForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panelError, setPanelError] = useState<string | null>(null);

  const loadRecipes = async () => {
    if (!nutritionistUserId) {
      setRecipes([]);
      setError("No active nutritionist session found.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const nextRecipes = await fetchJson<Recipe[]>(
        `/api/v1/recipes/nutritionists/${encodeURIComponent(String(nutritionistUserId))}/templates`,
      );
      setRecipes(Array.isArray(nextRecipes) ? nextRecipes : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recipes.");
    } finally {
      setLoading(false);
    }
  };

  const loadCatalogs = async () => {
    try {
      setCatalogLoading(true);
      setPanelError(null);
      const [categoriesResult, typesResult, ingredientsResult] = await Promise.allSettled([
        fetchJson<CatalogItem[]>("/api/v1/categories"),
        fetchJson<CatalogItem[]>("/api/v1/recipe-types"),
        fetchJson<Ingredient[]>("/api/v1/ingredients"),
      ]);

      const loadedCategories =
        categoriesResult.status === "fulfilled" && Array.isArray(categoriesResult.value) ? categoriesResult.value : [];
      const loadedTypes = typesResult.status === "fulfilled" && Array.isArray(typesResult.value) ? typesResult.value : [];
      const loadedIngredients =
        ingredientsResult.status === "fulfilled" && Array.isArray(ingredientsResult.value)
          ? ingredientsResult.value
          : [];

      setCategories(loadedCategories);
      setRecipeTypes(loadedTypes);
      setIngredients(loadedIngredients);

      const failedCatalogs = [
        categoriesResult.status === "rejected" ? "categories" : null,
        typesResult.status === "rejected" ? "recipe types" : null,
        ingredientsResult.status === "rejected" ? "ingredients" : null,
      ].filter(Boolean);

      if (failedCatalogs.length > 0) {
        setPanelError(`Could not load ${failedCatalogs.join(", ")}.`);
      }

      return {
        categories: loadedCategories,
        recipeTypes: loadedTypes,
      };
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : "Failed to load form data.");
      return {
        categories: [] as CatalogItem[],
        recipeTypes: [] as CatalogItem[],
      };
    } finally {
      setCatalogLoading(false);
    }
  };

  useEffect(() => {
    void loadRecipes();
  }, [nutritionistUserId]);

  const filteredRecipes = useMemo(() => {
    const query = normalize(search);
    return recipes.filter((recipe) => {
      const ingredientText = recipe.ingredients?.map((item) => item.ingredient?.name ?? "").join(" ") ?? "";
      return (
        !query ||
        normalize(recipe.name).includes(query) ||
        normalize(recipe.categoryName).includes(query) ||
        normalize(recipe.recipeTypeName).includes(query) ||
        normalize(ingredientText).includes(query)
      );
    });
  }, [recipes, search]);

  const recipeTypeCounts = useMemo(() => {
    return recipes.reduce<Record<string, number>>((counts, recipe) => {
      const type = recipeTypeBucket(recipe.recipeTypeName);
      if (type) counts[type] = (counts[type] ?? 0) + 1;
      return counts;
    }, {});
  }, [recipes]);

  async function openCreatePanel() {
    setPanelMode("create");
    setSelectedRecipeId(null);
    setSelectedRecipe(null);
    setSelectedNutrition(null);
    setForm(emptyForm);
    await loadCatalogs();
  }

  async function openViewPanel(recipeId: number | string) {
    setPanelMode("view");
    setSelectedRecipeId(recipeId);
    setSelectedRecipe(null);
    setSelectedNutrition(null);
    setPanelError(null);

    try {
      setDetailLoading(true);
      const [detail, nutrition] = await Promise.all([
        fetchJson<Recipe>(`/api/v1/recipes/${recipeId}`),
        fetchJson<RecipeNutrition>(`/api/v1/recipes/${recipeId}/nutrition`),
      ]);
      setSelectedRecipe(detail);
      setSelectedNutrition(nutrition);
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : "Failed to load recipe details.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function openEditPanel(recipeId: number | string) {
    setPanelMode("edit");
    setSelectedRecipeId(recipeId);
    setSelectedRecipe(null);
    setSelectedNutrition(null);
    setPanelError(null);

    try {
      setDetailLoading(true);
      const [detail, catalogs] = await Promise.all([fetchJson<Recipe>(`/api/v1/recipes/${recipeId}`), loadCatalogs()]);
      setSelectedRecipe(detail);
      setForm(toForm(detail, catalogs.categories, catalogs.recipeTypes));
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : "Failed to load recipe for editing.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleDeleteRecipe(recipeId: number | string) {
    const confirmed = window.confirm(t("recipes.confirm.delete"));
    if (!confirmed) return;

    try {
      setError(null);
      await fetchJson<void>(`/api/v1/recipes/${recipeId}`, { method: "DELETE" });
      setRecipes((current) => current.filter((recipe) => String(recipe.id) !== String(recipeId)));
      if (String(selectedRecipeId) === String(recipeId)) closePanel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete recipe.");
    }
  }

  function closePanel() {
    setPanelMode("none");
    setSelectedRecipeId(null);
    setSelectedRecipe(null);
    setSelectedNutrition(null);
    setPanelError(null);
    setForm(emptyForm);
  }

  function updateForm(field: keyof Omit<RecipeForm, "ingredients">, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateIngredient(index: number, field: "ingredientId" | "amountGrams", value: string) {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function addIngredientRow() {
    setForm((current) => ({
      ...current,
      ingredients: [...current.ingredients, { ingredientId: "", amountGrams: "" }],
    }));
  }

  function removeIngredientRow(index: number) {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nutritionistUserId) {
      setPanelError("No active nutritionist session found.");
      return;
    }

    const body = {
      name: form.name.trim(),
      description: form.description.trim(),
      preparationTime: Number(form.preparationTime),
      difficulty: form.difficulty,
      categoryId: Number(form.categoryId),
      recipeTypeId: Number(form.recipeTypeId),
    };

    if (!body.name || !body.description || !body.preparationTime || !body.categoryId || !body.recipeTypeId) {
      setPanelError("Complete all required fields.");
      return;
    }

    try {
      setSaving(true);
      setPanelError(null);

      if (panelMode === "create") {
        const created = await fetchJson<Recipe>(
          `/api/v1/recipes/nutritionists/${encodeURIComponent(String(nutritionistUserId))}`,
          {
            method: "POST",
            body: JSON.stringify(body),
          },
        );

        const recipeId = created.id;
        const selectedIngredients = form.ingredients.filter((item) => item.ingredientId && item.amountGrams);

        await Promise.all(
          selectedIngredients.map((item) =>
            fetchJson<void>(`/api/v1/recipes/${recipeId}/add-ingredient`, {
              method: "PUT",
              body: JSON.stringify({
                ingredientId: Number(item.ingredientId),
                amountGrams: Number(item.amountGrams),
              }),
            }),
          ),
        );

        await fetchJson<RecipeNutrition>(`/api/v1/recipes/${recipeId}/nutrition`).catch(() => null);
      }

      if (panelMode === "edit" && selectedRecipeId) {
        await fetchJson<Recipe>(`/api/v1/recipes/${selectedRecipeId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      }

      await loadRecipes();
      closePanel();
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : "Failed to save recipe.");
    } finally {
      setSaving(false);
    }
  }

  const showViewPanel = panelMode === "view";
  const showFormModal = panelMode === "create" || panelMode === "edit";

  return (
    <SharedLayout
      title={t("recipes.title")}
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={nav}
      breadcrumbs={[t("recipes.breadcrumb.nutritionist"), t("recipes.title")]}
      showPageTitle={false}
    >
      <div className="admin-recipes-page">
        <header className="admin-recipes-header">
          <div>
            <h2>{t("recipes.title")}</h2>
            <p>{t("recipes.description")}</p>
          </div>
          <button type="button" className="admin-recipes-create-button" onClick={openCreatePanel}>
            {t("recipes.create")}
          </button>
        </header>

        <section className="admin-recipes-stats">
          <RecipeStat value={recipes.length} label={t("recipes.stats.mine")} tone="purple" icon={<BookOpenIcon />} />
          <RecipeStat value={recipeTypeCounts.breakfast ?? 0} label={t("recipes.category.breakfast")} tone="green" icon={<CoffeeIcon />} />
          <RecipeStat value={recipeTypeCounts.lunch ?? 0} label={t("recipes.category.lunch")} tone="amber" icon={<UtensilsIcon />} />
          <RecipeStat value={recipeTypeCounts.dinner ?? 0} label={t("recipes.category.dinner")} tone="blue" icon={<MoonIcon />} />
        </section>

        {error && <div className="admin-recipes-warning">{error}</div>}

        <div className={`admin-recipes-workspace ${showViewPanel ? "admin-recipes-workspace-with-detail" : ""}`}>
          <section className="admin-recipes-main-card">
            <div className="admin-recipes-filters">
              <input
                type="search"
                placeholder={t("recipes.search.placeholder")}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button type="button" className="admin-recipes-clear" onClick={() => setSearch("")}>
                {t("recipes.search.clear")}
              </button>
            </div>

            {loading && <div className="admin-recipes-state">{t("recipes.loading")}</div>}

            {!loading && (
              <div className="admin-recipes-table-wrap">
                <table className="admin-recipes-table">
                  <thead>
                    <tr>
                      <th>{t("recipes.table.recipe")}</th>
                      <th>{t("recipes.table.category")}</th>
                      <th>{t("recipes.table.type")}</th>
                      <th>{t("recipes.table.preparationTime")}</th>
                      <th>{t("recipes.table.difficulty")}</th>
                      <th>{t("recipes.table.ingredients")}</th>
                      <th>{t("recipes.table.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecipes.map((recipe) => (
                      <tr key={recipe.id}>
                        <td>
                          <div className="admin-recipes-name-cell">
                            <div className="admin-recipes-thumb">{recipe.name?.charAt(0).toUpperCase() ?? "R"}</div>
                            <div>
                              <strong>{recipe.name || "-"}</strong>
                              <span>{recipe.description || "-"}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`admin-recipes-pill ${categoryClass(recipe.categoryName)}`}>
                            {recipe.categoryName || "-"}
                          </span>
                        </td>
                        <td>{recipe.recipeTypeName || "-"}</td>
                        <td>{formatMinutes(recipe.preparationTime)}</td>
                        <td>
                          <span className={`admin-recipes-pill ${difficultyClass(recipe.difficulty)}`}>
                            {recipe.difficulty || "-"}
                          </span>
                        </td>
                        <td>{ingredientSummary(recipe, t)}</td>
                        <td>
                          <div className="admin-recipes-actions">
                            <button type="button" onClick={() => openViewPanel(recipe.id)}>
                              {t("recipes.action.view")}
                            </button>
                            <button type="button" onClick={() => openEditPanel(recipe.id)}>
                              {t("recipes.action.edit")}
                            </button>
                            <button type="button" onClick={() => handleDeleteRecipe(recipe.id)}>
                              {t("recipes.action.delete")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredRecipes.length === 0 && <div className="admin-recipes-state">{t("recipes.empty")}</div>}
            {!loading && filteredRecipes.length > 0 && (
              <div className="admin-recipes-footnote">
                {t("patients.directory.showing")} 1 {t("patients.directory.to")} {filteredRecipes.length} {t("patients.directory.of")} {recipes.length} {t("recipes.footer.recipes")}
              </div>
            )}
          </section>

          {showViewPanel && (
            <aside className="admin-recipes-detail-card nutritionist-recipes-panel">
              <div className="admin-recipes-detail-header">
                <h3>{t("recipes.details.title")}</h3>
                <button type="button" aria-label={t("recipes.action.closePanel")} onClick={closePanel}>
                  X
                </button>
              </div>

              {detailLoading && <div className="admin-recipes-state">{t("patients.common.loading")}...</div>}
              {panelError && <div className="admin-recipes-warning">{panelError}</div>}

              {!detailLoading && selectedRecipe && <RecipeDetailPanel recipe={selectedRecipe} nutrition={selectedNutrition} t={t} />}
            </aside>
          )}
        </div>

        {showFormModal && (
          <div className="nutritionist-recipes-modal" role="dialog" aria-modal="true">
            <div className="nutritionist-recipes-modal-content">
              <div className="nutritionist-recipes-modal-header">
                <div>
                  <h3>{panelMode === "create" ? t("recipes.create") : t("recipes.edit")}</h3>
                  <p>{panelMode === "create" ? t("recipes.create.description") : t("recipes.edit.description")}</p>
                </div>
                <button type="button" aria-label={t("recipes.action.closeModal")} onClick={closePanel}>
                  X
                </button>
              </div>

              <div className="nutritionist-recipes-modal-body">
                {(detailLoading || catalogLoading) && <div className="admin-recipes-state">{t("patients.common.loading")}...</div>}
                {panelError && <div className="admin-recipes-warning">{panelError}</div>}

                {!detailLoading && !catalogLoading && (
                  <RecipeFormPanel
                    mode={panelMode === "edit" ? "edit" : "create"}
                    form={form}
                    categories={categories}
                    recipeTypes={recipeTypes}
                    ingredients={ingredients}
                    saving={saving}
                    selectedRecipe={selectedRecipe}
                    onSubmit={handleSubmit}
                    onChange={updateForm}
                    onIngredientChange={updateIngredient}
                    onAddIngredient={addIngredientRow}
                    onRemoveIngredient={removeIngredientRow}
                    t={t}
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

function RecipeDetailPanel({ recipe, nutrition, t }: { recipe: Recipe; nutrition: RecipeNutrition | null; t: (key: TranslationKey) => string }) {
  return (
    <>
      <div className="admin-recipes-detail-title">
        <div className="admin-recipes-detail-image">{recipe.name?.charAt(0).toUpperCase() ?? "R"}</div>
        <div>
          <h4>{recipe.name || "-"}</h4>
          <span className={`admin-recipes-pill ${difficultyClass(recipe.difficulty)}`}>{recipe.difficulty || "-"}</span>
        </div>
      </div>

      <div className="admin-recipes-detail-grid">
        <DetailRow label={t("recipes.table.category")} value={recipe.categoryName || "-"} pillClass={categoryClass(recipe.categoryName)} />
        <DetailRow label={t("recipes.table.type")} value={recipe.recipeTypeName || "-"} />
        <DetailRow label={t("recipes.table.preparationTime")} value={formatMinutes(recipe.preparationTime)} />
        <DetailRow label={t("recipes.table.difficulty")} value={recipe.difficulty || "-"} pillClass={difficultyClass(recipe.difficulty)} />
      </div>

      <section className="admin-recipes-detail-section">
        <h4>{t("recipes.form.description")}</h4>
        <p>{recipe.description || "-"}</p>
      </section>

      <section className="admin-recipes-detail-section">
        <h4>{t("recipes.table.ingredients")}</h4>
        <ul>
          {(recipe.ingredients ?? []).map((item, index) => (
            <li key={`${item.ingredient?.id ?? index}-${item.amountGrams ?? 0}`}>
              <span>{item.ingredient?.name || "-"}</span>
              <strong>{item.amountGrams === undefined ? "-" : `${item.amountGrams} g`}</strong>
            </li>
          ))}
        </ul>
        {(recipe.ingredients ?? []).length === 0 && <p>{t("recipes.ingredients.empty")}</p>}
      </section>

      <section className="admin-recipes-nutrition">
        <h4>{t("recipes.nutrition.total")}</h4>
        <div>
          <NutritionBox label={t("dashboard.metric.calories")} value={nutrition?.calories} />
          <NutritionBox label={t("dashboard.metric.carbs")} value={nutrition?.carbs} suffix="g" />
          <NutritionBox label={t("patients.tracking.proteins")} value={nutrition?.proteins} suffix="g" />
          <NutritionBox label={t("dashboard.metric.fats")} value={nutrition?.fats} suffix="g" />
        </div>
      </section>
    </>
  );
}

function RecipeFormPanel({
  mode,
  form,
  categories,
  recipeTypes,
  ingredients,
  saving,
  selectedRecipe,
  onSubmit,
  onChange,
  onIngredientChange,
  onAddIngredient,
  onRemoveIngredient,
  t,
}: {
  mode: "create" | "edit";
  form: RecipeForm;
  categories: CatalogItem[];
  recipeTypes: CatalogItem[];
  ingredients: Ingredient[];
  saving: boolean;
  selectedRecipe: Recipe | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: (field: keyof Omit<RecipeForm, "ingredients">, value: string) => void;
  onIngredientChange: (index: number, field: "ingredientId" | "amountGrams", value: string) => void;
  onAddIngredient: () => void;
  onRemoveIngredient: (index: number) => void;
  t: (key: TranslationKey) => string;
}) {
  return (
    <form className="nutritionist-recipes-form" onSubmit={onSubmit}>
      <label className="nutritionist-recipes-field nutritionist-recipes-field-full">
        <span>{t("recipes.form.name")}</span>
        <input value={form.name} onChange={(event) => onChange("name", event.target.value)} required />
      </label>

      <label className="nutritionist-recipes-field nutritionist-recipes-field-full">
        <span>{t("recipes.form.description")}</span>
        <textarea value={form.description} onChange={(event) => onChange("description", event.target.value)} required />
      </label>

      <div className="nutritionist-recipes-form-grid">
        <label className="nutritionist-recipes-field">
          <span>{t("recipes.table.preparationTime")}</span>
          <input
            type="number"
            min="1"
            value={form.preparationTime}
            onChange={(event) => onChange("preparationTime", event.target.value)}
            required
          />
        </label>

        <label className="nutritionist-recipes-field">
          <span>{t("recipes.table.difficulty")}</span>
          <select value={form.difficulty} onChange={(event) => onChange("difficulty", event.target.value)}>
            <option value="Easy">{t("recipes.difficulty.easy")}</option>
            <option value="Medium">{t("recipes.difficulty.medium")}</option>
            <option value="Hard">{t("recipes.difficulty.hard")}</option>
          </select>
        </label>
      </div>

      <div className="nutritionist-recipes-form-grid">
      <label className="nutritionist-recipes-field">
        <span>{t("recipes.table.category")}</span>
        <select value={form.categoryId} onChange={(event) => onChange("categoryId", event.target.value)} required>
          <option value="">{t("recipes.form.selectCategory")}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="nutritionist-recipes-field">
        <span>{t("recipes.table.type")}</span>
        <select value={form.recipeTypeId} onChange={(event) => onChange("recipeTypeId", event.target.value)} required>
          <option value="">{t("recipes.form.selectType")}</option>
          {recipeTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </label>
      </div>

      {mode === "create" ? (
        <section className="nutritionist-recipes-ingredients">
          <div className="nutritionist-recipes-section-header">
            <h4>{t("recipes.table.ingredients")}</h4>
            <button type="button" onClick={onAddIngredient}>
              {t("recipes.action.add")}
            </button>
          </div>

          {form.ingredients.map((item, index) => (
            <div className="nutritionist-recipes-ingredient-row" key={index}>
              <label className="nutritionist-recipes-field">
                <span>{t("recipes.ingredient.singular")}</span>
                <select
                  value={item.ingredientId}
                  onChange={(event) => onIngredientChange(index, "ingredientId", event.target.value)}
                >
                  <option value="">{t("recipes.form.selectIngredient")}</option>
                  {ingredients.map((ingredient) => (
                    <option key={ingredient.id} value={ingredient.id}>
                      {ingredient.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="nutritionist-recipes-field">
                <span>{t("recipes.form.amountGrams")}</span>
                <input
                  type="number"
                  min="1"
                  placeholder="80"
                  value={item.amountGrams}
                  onChange={(event) => onIngredientChange(index, "amountGrams", event.target.value)}
                />
              </label>
              <button
                type="button"
                className="nutritionist-recipes-remove"
                onClick={() => onRemoveIngredient(index)}
                disabled={form.ingredients.length === 1}
              >
                {t("recipes.action.remove")}
              </button>
            </div>
          ))}
        </section>
      ) : (
        <section className="admin-recipes-detail-section">
          <h4>{t("recipes.table.ingredients")}</h4>
          <ul>
            {(selectedRecipe?.ingredients ?? []).map((item, index) => (
              <li key={`${item.ingredient?.id ?? index}-${item.amountGrams ?? 0}`}>
                <span>{item.ingredient?.name || "-"}</span>
                <strong>{item.amountGrams === undefined ? "-" : `${item.amountGrams} g`}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}

      <button type="submit" className="nutritionist-recipes-submit" disabled={saving}>
        {saving ? t("recipes.action.saving") : mode === "create" ? t("recipes.action.saveRecipe") : t("recipes.action.saveChanges")}
      </button>
    </form>
  );
}

function RecipeStat({ value, label, tone, icon }: { value: number; label: string; tone: string; icon: ReactNode }) {
  return (
    <article className="admin-recipes-stat">
      <div className={`admin-recipes-stat-icon admin-recipes-stat-${tone}`}>{icon}</div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}

function BookOpenIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 7v14" />
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v16H6.5A2.5 2.5 0 0 0 4 21.5Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v16h5.5a2.5 2.5 0 0 1 2.5 2.5Z" />
    </svg>
  );
}

function CoffeeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 8h10v6a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4Z" />
      <path d="M16 9h1.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M8 3v2" />
      <path d="M12 3v2" />
      <path d="M4 21h16" />
    </svg>
  );
}

function UtensilsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 3v8" />
      <path d="M8 3v8" />
      <path d="M4 7h4" />
      <path d="M6 11v10" />
      <path d="M18 3c-2 1.8-3 4.1-3 7v2h4v9" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 14.5A7.5 7.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" />
    </svg>
  );
}

function DetailRow({ label, value, pillClass }: { label: string; value: string; pillClass?: string }) {
  return (
    <div className="admin-recipes-detail-row">
      <span>{label}</span>
      {pillClass ? <strong className={`admin-recipes-pill ${pillClass}`}>{value}</strong> : <strong>{value}</strong>}
    </div>
  );
}

function NutritionBox({ label, value, suffix = "" }: { label: string; value?: number; suffix?: string }) {
  return (
    <div className="admin-recipes-nutrition-box">
      <strong>{value === undefined ? "-" : `${value}${suffix}`}</strong>
      <span>{label}</span>
    </div>
  );
}
