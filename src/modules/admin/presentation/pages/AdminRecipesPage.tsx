import { useEffect, useMemo, useState } from "react";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import { apiUrl } from "@/app/config/env";

interface AdminRecipesPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

interface CatalogItem {
  id: number | string;
  name: string;
}

interface IngredientMacro {
  id?: number | string;
  name?: string;
  calories?: number;
  proteins?: number;
  fats?: number;
  carbohydrates?: number;
}

interface RecipeIngredient {
  ingredient?: IngredientMacro;
  amountGrams?: number;
}

interface RecipeTemplate {
  id: number | string;
  name?: string;
  description?: string;
  category?: string;
  categoryName?: string;
  recipeTypeName?: string;
  createdByNutritionistId?: number | string;
  nutritionistName?: string;
  preparationTime?: number;
  difficulty?: string;
  ingredients?: RecipeIngredient[];
}

interface RecipeDetail extends RecipeTemplate {
  assignedToProfileId?: number | string;
}

interface RecipeNutrition {
  calories?: number;
  carbs?: number;
  proteins?: number;
  fats?: number;
}

type NutritionMap = Record<string, RecipeNutrition>;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      ...getAuthHeaders(),
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

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

export function AdminRecipesPage({ currentPath, onNavigate }: AdminRecipesPageProps) {
  const nav = useNavigation();
  const [recipes, setRecipes] = useState<RecipeTemplate[]>([]);
  const [categories, setCategories] = useState<CatalogItem[]>([]);
  const [recipeTypes, setRecipeTypes] = useState<CatalogItem[]>([]);
  const [nutritionByRecipe, setNutritionByRecipe] = useState<NutritionMap>({});
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetail | null>(null);
  const [selectedNutrition, setSelectedNutrition] = useState<RecipeNutrition | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadRecipes() {
      try {
        setLoading(true);
        setError(null);

        const [nextRecipes, nextCategories, nextTypes] = await Promise.all([
          fetchJson<RecipeTemplate[]>("/api/v1/recipes/templates/detailed"),
          fetchJson<CatalogItem[]>("/api/v1/categories"),
          fetchJson<CatalogItem[]>("/api/v1/recipe-types"),
        ]);

        if (ignore) return;

        const recipeItems = Array.isArray(nextRecipes) ? nextRecipes : [];
        setCategories(Array.isArray(nextCategories) ? nextCategories : []);
        setRecipeTypes(Array.isArray(nextTypes) ? nextTypes : []);

        const [detailResults, nutritionResults] = await Promise.all([
          Promise.allSettled(
            recipeItems.map(async (recipe) => ({
              id: String(recipe.id),
              detail: await fetchJson<RecipeDetail>(`/api/v1/recipes/${recipe.id}`),
            })),
          ),
          Promise.allSettled(
            recipeItems.map(async (recipe) => ({
              id: String(recipe.id),
              nutrition: await fetchJson<RecipeNutrition>(`/api/v1/recipes/${recipe.id}/nutrition`),
            })),
          ),
        ]);

        if (ignore) return;

        const detailsByRecipe = detailResults.reduce<Record<string, RecipeDetail>>((nextMap, result) => {
          if (result.status === "fulfilled") {
            nextMap[result.value.id] = result.value.detail;
          }
          return nextMap;
        }, {});

        setRecipes(
          recipeItems.map((recipe) => ({
            ...recipe,
            ...detailsByRecipe[String(recipe.id)],
            category: recipe.category ?? detailsByRecipe[String(recipe.id)]?.categoryName,
          })),
        );

        setNutritionByRecipe(
          nutritionResults.reduce<NutritionMap>((nextMap, result) => {
            if (result.status === "fulfilled") {
              nextMap[result.value.id] = result.value.nutrition;
            }
            return nextMap;
          }, {}),
        );
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load recipes.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadRecipes();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedRecipeId) return;
    let ignore = false;

    async function loadRecipeDetail() {
      try {
        setDetailLoading(true);
        setDetailError(null);

        const [detail, nutrition] = await Promise.all([
          fetchJson<RecipeDetail>(`/api/v1/recipes/${selectedRecipeId}`),
          fetchJson<RecipeNutrition>(`/api/v1/recipes/${selectedRecipeId}/nutrition`),
        ]);

        if (ignore) return;
        setSelectedRecipe(detail);
        setSelectedNutrition(nutrition);
        setNutritionByRecipe((current) => ({ ...current, [String(selectedRecipeId)]: nutrition }));
      } catch (err) {
        if (!ignore) {
          setDetailError(err instanceof Error ? err.message : "Failed to load recipe details.");
        }
      } finally {
        if (!ignore) setDetailLoading(false);
      }
    }

    loadRecipeDetail();

    return () => {
      ignore = true;
    };
  }, [selectedRecipeId]);

  const filteredRecipes = useMemo(() => {
    const query = normalize(search);

    return recipes.filter((recipe) => {
      const category = recipe.category ?? recipe.categoryName ?? "";
      const type = recipe.recipeTypeName ?? "";
      const ingredients = recipe.ingredients?.map((item) => item.ingredient?.name ?? "").join(" ") ?? "";
      const matchesSearch =
        !query ||
        normalize(recipe.name).includes(query) ||
        normalize(recipe.nutritionistName).includes(query) ||
        normalize(ingredients).includes(query);
      const matchesCategory = categoryFilter === "all" || normalize(category) === normalize(categoryFilter);
      const matchesType = typeFilter === "all" || normalize(type) === normalize(typeFilter);

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [recipes, search, categoryFilter, typeFilter]);

  const categoryCounts = useMemo(() => {
    return recipes.reduce<Record<string, number>>((counts, recipe) => {
      const category = normalize(recipe.category ?? recipe.categoryName);
      counts[category] = (counts[category] ?? 0) + 1;
      return counts;
    }, {});
  }, [recipes]);

  async function handleDeleteRecipe(recipeId: number | string) {
    const confirmed = window.confirm("Delete this recipe?");
    if (!confirmed) return;

    try {
      await fetchJson(`/api/v1/recipes/${recipeId}`, { method: "DELETE" });
      setRecipes((current) => current.filter((recipe) => String(recipe.id) !== String(recipeId)));
      if (String(selectedRecipeId) === String(recipeId)) {
        setSelectedRecipeId(null);
        setSelectedRecipe(null);
        setSelectedNutrition(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete recipe.");
    }
  }

  const selectedCategory = selectedRecipe?.categoryName ?? selectedRecipe?.category ?? "-";
  const selectedType = selectedRecipe?.recipeTypeName ?? "-";

  return (
    <SharedLayout
      title="Recipes"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={nav}
      breadcrumbs={["Admin", "Management", "Recipes"]}
      showPageTitle={false}
    >
      <div className="admin-recipes-page">
        <header className="admin-recipes-header">
          <div>
            <span className="admin-recipes-eyebrow">Nutrition content</span>
            <h2>Recetas</h2>
            <p>Administra las recetas registradas, sus categorias, ingredientes y macros estimados.</p>
          </div>
        </header>

        <section className="admin-recipes-stats">
          <RecipeStat value={recipes.length} label="Total Recipes" tone="purple" />
          <RecipeStat value={categoryCounts.breakfast ?? 0} label="Breakfast" tone="green" />
          <RecipeStat value={categoryCounts.lunch ?? 0} label="Lunch" tone="amber" />
          <RecipeStat value={categoryCounts.dinner ?? 0} label="Dinner" tone="blue" />
        </section>

        {error && <div className="admin-recipes-warning">{error}</div>}

        <div className={`admin-recipes-workspace ${selectedRecipeId ? "admin-recipes-workspace-with-detail" : ""}`}>
          <section className="admin-recipes-main-card">
            <div className="admin-recipes-filters">
              <input
                type="search"
                placeholder="Buscar receta, nutricionista o ingrediente..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="all">Todas las categorias</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                <option value="all">Todos los tipos</option>
                {recipeTypes.map((type) => (
                  <option key={type.id} value={type.name}>
                    {type.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="admin-recipes-clear"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("all");
                  setTypeFilter("all");
                }}
              >
                Limpiar
              </button>
            </div>

            {loading && <div className="admin-recipes-state">Loading recipes...</div>}

            {!loading && (
              <div className="admin-recipes-table-wrap">
                <table className="admin-recipes-table">
                  <thead>
                    <tr>
                      <th>Receta</th>
                      <th>Categoria</th>
                      <th>Tipo</th>
                      <th>Nutricionista</th>
                      <th>Calorias</th>
                      <th>Dificultad</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecipes.map((recipe) => {
                      const category = recipe.category ?? recipe.categoryName ?? "-";
                      const nutrition = nutritionByRecipe[String(recipe.id)];

                      return (
                        <tr key={recipe.id}>
                          <td>
                            <div className="admin-recipes-name-cell">
                              <div className="admin-recipes-thumb">{recipe.name?.charAt(0).toUpperCase() ?? "R"}</div>
                              <div>
                                <strong>{recipe.name || "-"}</strong>
                                <span>{formatMinutes(recipe.preparationTime)}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`admin-recipes-pill ${categoryClass(category)}`}>{category}</span>
                          </td>
                          <td>{recipe.recipeTypeName || "-"}</td>
                          <td>{recipe.nutritionistName || `#${recipe.createdByNutritionistId ?? "-"}`}</td>
                          <td>{nutrition?.calories === undefined ? "-" : `${nutrition.calories} kcal`}</td>
                          <td>
                            <span className={`admin-recipes-pill ${difficultyClass(recipe.difficulty)}`}>
                              {recipe.difficulty || "-"}
                            </span>
                          </td>
                          <td>
                            <div className="admin-recipes-actions">
                              <button type="button" title="View recipe" onClick={() => setSelectedRecipeId(recipe.id)}>
                                Ver
                              </button>
                              <button type="button" title="Delete recipe" onClick={() => handleDeleteRecipe(recipe.id)}>
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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

          {selectedRecipeId && (
            <aside className="admin-recipes-detail-card">
              <div className="admin-recipes-detail-header">
                <h3>Recipe Details</h3>
                <button
                  type="button"
                  aria-label="Close recipe details"
                  onClick={() => {
                    setSelectedRecipeId(null);
                    setSelectedRecipe(null);
                    setSelectedNutrition(null);
                    setDetailError(null);
                  }}
                >
                  X
                </button>
              </div>

              {detailLoading && <div className="admin-recipes-state">Loading details...</div>}
              {detailError && <div className="admin-recipes-warning">{detailError}</div>}

              {!detailLoading && selectedRecipe && (
                <>
                  <div className="admin-recipes-detail-title">
                    <div className="admin-recipes-detail-image">
                      {selectedRecipe.name?.charAt(0).toUpperCase() ?? "R"}
                    </div>
                    <div>
                      <h4>{selectedRecipe.name || "-"}</h4>
                      <span className={`admin-recipes-pill ${difficultyClass(selectedRecipe.difficulty)}`}>
                        {selectedRecipe.difficulty || "-"}
                      </span>
                    </div>
                  </div>

                  <div className="admin-recipes-detail-grid">
                    <DetailRow label="Category" value={selectedCategory} pillClass={categoryClass(selectedCategory)} />
                    <DetailRow label="Type" value={selectedType} />
                    <DetailRow label="Preparation Time" value={formatMinutes(selectedRecipe.preparationTime)} />
                    <DetailRow label="Created By" value={`#${selectedRecipe.createdByNutritionistId ?? "-"}`} />
                  </div>

                  <section className="admin-recipes-nutrition">
                    <h4>Nutrition</h4>
                    <div>
                      <NutritionBox label="Calories" value={selectedNutrition?.calories} />
                      <NutritionBox label="Carbs" value={selectedNutrition?.carbs} suffix="g" />
                      <NutritionBox label="Protein" value={selectedNutrition?.proteins} suffix="g" />
                      <NutritionBox label="Fat" value={selectedNutrition?.fats} suffix="g" />
                    </div>
                  </section>

                  <section className="admin-recipes-detail-section">
                    <h4>Ingredients</h4>
                    <ul>
                      {(selectedRecipe.ingredients ?? []).map((item, index) => (
                        <li key={`${item.ingredient?.id ?? index}-${item.amountGrams ?? 0}`}>
                          <span>{item.ingredient?.name || "-"}</span>
                          <strong>{item.amountGrams === undefined ? "-" : `${item.amountGrams} g`}</strong>
                        </li>
                      ))}
                    </ul>
                    {(selectedRecipe.ingredients ?? []).length === 0 && <p>No ingredients listed.</p>}
                  </section>

                  <section className="admin-recipes-detail-section">
                    <h4>Description</h4>
                    <p>{selectedRecipe.description || "-"}</p>
                  </section>

                  <div className="admin-recipes-detail-actions">
                    <button type="button" onClick={() => handleDeleteRecipe(selectedRecipe.id)}>
                      Delete Recipe
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

function RecipeStat({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <article className="admin-recipes-stat">
      <div className={`admin-recipes-stat-icon admin-recipes-stat-${tone}`}>
        <RecipeStatIcon tone={tone} />
      </div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </article>
  );
}

function RecipeStatIcon({ tone }: { tone: string }) {
  if (tone === "green") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6.5h16" />
        <path d="M6 6.5v9a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-9" />
        <path d="M9 3.5h6" />
        <path d="M9 11h6" />
        <path d="M9 14.5h4" />
      </svg>
    );
  }

  if (tone === "amber") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 4h10" />
        <path d="M8 4v5a4 4 0 0 0 8 0V4" />
        <path d="M12 13v7" />
        <path d="M8.5 20h7" />
      </svg>
    );
  }

  if (tone === "blue") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 10h16" />
        <path d="M6 10v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8" />
        <path d="M8 7a4 4 0 0 1 8 0" />
        <path d="M9 14h6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 4h9l3 3v13H6z" />
      <path d="M15 4v4h4" />
      <path d="M9 12h6" />
      <path d="M9 15h6" />
      <path d="M9 18h3" />
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
