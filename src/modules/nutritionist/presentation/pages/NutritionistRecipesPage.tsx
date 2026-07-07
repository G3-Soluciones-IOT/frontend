import { useEffect, useMemo, useState, type FormEvent } from "react";
import { apiUrl } from "@/app/config/env";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";

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
  return response.json() as Promise<T>;
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
  if (normalized.includes("dinner")) return "admin-recipes-pill-blue";
  if (normalized.includes("lunch")) return "admin-recipes-pill-amber";
  return "admin-recipes-pill-gray";
}

function ingredientSummary(recipe: Recipe) {
  const count = recipe.ingredients?.length ?? 0;
  if (count === 0) return "-";
  return `${count} ingredient${count === 1 ? "" : "s"}`;
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
      const [nextCategories, nextTypes, nextIngredients] = await Promise.all([
        fetchJson<CatalogItem[]>("/api/v1/categories"),
        fetchJson<CatalogItem[]>("/api/v1/recipetypes"),
        fetchJson<Ingredient[]>("/api/v1/ingredients"),
      ]);

      const loadedCategories = Array.isArray(nextCategories) ? nextCategories : [];
      const loadedTypes = Array.isArray(nextTypes) ? nextTypes : [];
      const loadedIngredients = Array.isArray(nextIngredients) ? nextIngredients : [];

      setCategories(loadedCategories);
      setRecipeTypes(loadedTypes);
      setIngredients(loadedIngredients);

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

  const categoryCounts = useMemo(() => {
    return recipes.reduce<Record<string, number>>((counts, recipe) => {
      const category = normalize(recipe.categoryName);
      counts[category] = (counts[category] ?? 0) + 1;
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
    const confirmed = window.confirm("Delete this recipe?");
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
      title="Recipes"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={nav}
      breadcrumbs={["Nutritionist", "Recipes"]}
    >
      <div className="admin-recipes-page">
        <header className="admin-recipes-header">
          <div>
            <h2>Recipes</h2>
            <p>Manage your own recipe templates.</p>
          </div>
          <button type="button" className="admin-recipes-create-button" onClick={openCreatePanel}>
            Create Recipe
          </button>
        </header>

        <section className="admin-recipes-stats">
          <RecipeStat value={recipes.length} label="My Recipes" tone="purple" />
          <RecipeStat value={categoryCounts.breakfast ?? 0} label="Breakfast" tone="green" />
          <RecipeStat value={categoryCounts.lunch ?? 0} label="Lunch" tone="amber" />
          <RecipeStat value={categoryCounts.dinner ?? 0} label="Dinner" tone="blue" />
        </section>

        {error && <div className="admin-recipes-warning">{error}</div>}

        <div className={`admin-recipes-workspace ${showViewPanel ? "admin-recipes-workspace-with-detail" : ""}`}>
          <section className="admin-recipes-main-card">
            <div className="admin-recipes-filters">
              <input
                type="search"
                placeholder="Search recipes by name, category, type..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button type="button" className="admin-recipes-clear" onClick={() => setSearch("")}>
                Clear Search
              </button>
            </div>

            {loading && <div className="admin-recipes-state">Loading recipes...</div>}

            {!loading && (
              <div className="admin-recipes-table-wrap">
                <table className="admin-recipes-table">
                  <thead>
                    <tr>
                      <th>Recipe</th>
                      <th>Category</th>
                      <th>Type</th>
                      <th>Preparation Time</th>
                      <th>Difficulty</th>
                      <th>Ingredients</th>
                      <th>Actions</th>
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
                        <td>{ingredientSummary(recipe)}</td>
                        <td>
                          <div className="admin-recipes-actions">
                            <button type="button" onClick={() => openViewPanel(recipe.id)}>
                              View
                            </button>
                            <button type="button" onClick={() => openEditPanel(recipe.id)}>
                              Edit
                            </button>
                            <button type="button" onClick={() => handleDeleteRecipe(recipe.id)}>
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

            {!loading && filteredRecipes.length === 0 && <div className="admin-recipes-state">No recipes found.</div>}
            {!loading && filteredRecipes.length > 0 && (
              <div className="admin-recipes-footnote">
                Showing 1 to {filteredRecipes.length} of {recipes.length} recipes
              </div>
            )}
          </section>

          {showViewPanel && (
            <aside className="admin-recipes-detail-card nutritionist-recipes-panel">
              <div className="admin-recipes-detail-header">
                <h3>Recipe Details</h3>
                <button type="button" aria-label="Close recipe panel" onClick={closePanel}>
                  X
                </button>
              </div>

              {detailLoading && <div className="admin-recipes-state">Loading...</div>}
              {panelError && <div className="admin-recipes-warning">{panelError}</div>}

              {!detailLoading && selectedRecipe && <RecipeDetailPanel recipe={selectedRecipe} nutrition={selectedNutrition} />}
            </aside>
          )}
        </div>

        {showFormModal && (
          <div className="nutritionist-recipes-modal" role="dialog" aria-modal="true">
            <div className="nutritionist-recipes-modal-content">
              <div className="nutritionist-recipes-modal-header">
                <div>
                  <h3>{panelMode === "create" ? "Create Recipe" : "Edit Recipe"}</h3>
                  <p>{panelMode === "create" ? "Register a new recipe template." : "Update the recipe base information."}</p>
                </div>
                <button type="button" aria-label="Close recipe modal" onClick={closePanel}>
                  X
                </button>
              </div>

              <div className="nutritionist-recipes-modal-body">
                {(detailLoading || catalogLoading) && <div className="admin-recipes-state">Loading...</div>}
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

function RecipeDetailPanel({ recipe, nutrition }: { recipe: Recipe; nutrition: RecipeNutrition | null }) {
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
        <DetailRow label="Category" value={recipe.categoryName || "-"} pillClass={categoryClass(recipe.categoryName)} />
        <DetailRow label="Recipe Type" value={recipe.recipeTypeName || "-"} />
        <DetailRow label="Preparation Time" value={formatMinutes(recipe.preparationTime)} />
        <DetailRow label="Difficulty" value={recipe.difficulty || "-"} pillClass={difficultyClass(recipe.difficulty)} />
      </div>

      <section className="admin-recipes-detail-section">
        <h4>Description</h4>
        <p>{recipe.description || "-"}</p>
      </section>

      <section className="admin-recipes-detail-section">
        <h4>Ingredients</h4>
        <ul>
          {(recipe.ingredients ?? []).map((item, index) => (
            <li key={`${item.ingredient?.id ?? index}-${item.amountGrams ?? 0}`}>
              <span>{item.ingredient?.name || "-"}</span>
              <strong>{item.amountGrams === undefined ? "-" : `${item.amountGrams} g`}</strong>
            </li>
          ))}
        </ul>
        {(recipe.ingredients ?? []).length === 0 && <p>No ingredients listed.</p>}
      </section>

      <section className="admin-recipes-nutrition">
        <h4>Total Nutrition</h4>
        <div>
          <NutritionBox label="Calories" value={nutrition?.calories} />
          <NutritionBox label="Carbs" value={nutrition?.carbs} suffix="g" />
          <NutritionBox label="Proteins" value={nutrition?.proteins} suffix="g" />
          <NutritionBox label="Fats" value={nutrition?.fats} suffix="g" />
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
}) {
  return (
    <form className="nutritionist-recipes-form" onSubmit={onSubmit}>
      <label className="nutritionist-recipes-field nutritionist-recipes-field-full">
        <span>Recipe name</span>
        <input value={form.name} onChange={(event) => onChange("name", event.target.value)} required />
      </label>

      <label className="nutritionist-recipes-field nutritionist-recipes-field-full">
        <span>Description</span>
        <textarea value={form.description} onChange={(event) => onChange("description", event.target.value)} required />
      </label>

      <div className="nutritionist-recipes-form-grid">
        <label className="nutritionist-recipes-field">
          <span>Preparation time</span>
          <input
            type="number"
            min="1"
            value={form.preparationTime}
            onChange={(event) => onChange("preparationTime", event.target.value)}
            required
          />
        </label>

        <label className="nutritionist-recipes-field">
          <span>Difficulty</span>
          <select value={form.difficulty} onChange={(event) => onChange("difficulty", event.target.value)}>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </label>
      </div>

      <div className="nutritionist-recipes-form-grid">
      <label className="nutritionist-recipes-field">
        <span>Category</span>
        <select value={form.categoryId} onChange={(event) => onChange("categoryId", event.target.value)} required>
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="nutritionist-recipes-field">
        <span>Recipe type</span>
        <select value={form.recipeTypeId} onChange={(event) => onChange("recipeTypeId", event.target.value)} required>
          <option value="">Select recipe type</option>
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
            <h4>Ingredients</h4>
            <button type="button" onClick={onAddIngredient}>
              Add
            </button>
          </div>

          {form.ingredients.map((item, index) => (
            <div className="nutritionist-recipes-ingredient-row" key={index}>
              <label className="nutritionist-recipes-field">
                <span>Ingredient</span>
                <select
                  value={item.ingredientId}
                  onChange={(event) => onIngredientChange(index, "ingredientId", event.target.value)}
                >
                  <option value="">Select ingredient</option>
                  {ingredients.map((ingredient) => (
                    <option key={ingredient.id} value={ingredient.id}>
                      {ingredient.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="nutritionist-recipes-field">
                <span>Amount in grams</span>
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
                Remove
              </button>
            </div>
          ))}
        </section>
      ) : (
        <section className="admin-recipes-detail-section">
          <h4>Ingredients</h4>
          <p>Ingredient replacement is not available because the API only exposes add-ingredient for recipes.</p>
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
        {saving ? "Saving..." : mode === "create" ? "Save Recipe" : "Save Changes"}
      </button>
    </form>
  );
}

function RecipeStat({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <article className="admin-recipes-stat">
      <div className={`admin-recipes-stat-icon admin-recipes-stat-${tone}`}>{label.charAt(0)}</div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
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
