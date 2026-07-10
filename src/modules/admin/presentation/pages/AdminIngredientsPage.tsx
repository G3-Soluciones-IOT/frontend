import { useEffect, useMemo, useState, type FormEvent } from "react";
import { apiUrl } from "@/app/config/env";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";

interface AdminIngredientsPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

interface Ingredient {
  id: number | string;
  name?: string;
  calories?: number;
  proteins?: number;
  fats?: number;
  carbohydrates?: number;
  macronutrientValuesId?: number | string;
}

interface IngredientForm {
  name: string;
  calories: string;
  proteins: string;
  fats: string;
  carbohydrates: string;
  macronutrientValuesId: string;
}

const emptyForm: IngredientForm = {
  name: "",
  calories: "",
  proteins: "",
  fats: "",
  carbohydrates: "",
  macronutrientValuesId: "",
};

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: getAuthHeaders(),
    ...(init?.body
      ? {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
            ...init.headers,
          },
        }
      : {}),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

function formatMacro(value?: number, suffix = "g") {
  return value === undefined ? "-" : `${value.toLocaleString("en-US")}${suffix}`;
}

function getInitial(value?: string) {
  return value?.trim().charAt(0).toUpperCase() || "I";
}

function dominantMacro(ingredient: Ingredient) {
  const proteins = Number(ingredient.proteins || 0);
  const carbs = Number(ingredient.carbohydrates || 0);
  const fats = Number(ingredient.fats || 0);

  if (proteins >= carbs && proteins >= fats) return "Protein";
  if (carbs >= proteins && carbs >= fats) return "Carbs";
  return "Fat";
}

export function AdminIngredientsPage({ currentPath, onNavigate }: AdminIngredientsPageProps) {
  const nav = useNavigation();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [search, setSearch] = useState("");
  const [macroFilter, setMacroFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<IngredientForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadIngredients() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchJson<Ingredient[]>("/api/v1/ingredients");
        if (!ignore) setIngredients(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : "Failed to load ingredients.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadIngredients();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredIngredients = useMemo(() => {
    const query = search.trim().toLowerCase();

    return ingredients.filter((ingredient) => {
      const fields = [
        ingredient.name,
        ingredient.id,
        ingredient.macronutrientValuesId,
      ].map((value) => String(value ?? "").toLowerCase());

      const matchesSearch = !query || fields.some((field) => field.includes(query));
      const matchesMacro = macroFilter === "all" || dominantMacro(ingredient).toLowerCase() === macroFilter;
      return matchesSearch && matchesMacro;
    });
  }, [ingredients, search, macroFilter]);

  const stats = useMemo(() => {
    const averageCalories = ingredients.length
      ? Math.round(ingredients.reduce((total, item) => total + Number(item.calories || 0), 0) / ingredients.length)
      : 0;
    const proteinLed = ingredients.filter((item) => dominantMacro(item) === "Protein").length;
    const carbLed = ingredients.filter((item) => dominantMacro(item) === "Carbs").length;

    return [
      { label: "Ingredientes", value: ingredients.length.toString(), detail: "Registrados", tone: "purple" },
      { label: "Calorias Prom.", value: averageCalories.toLocaleString("en-US"), detail: "Por 100 g", tone: "green" },
      { label: "Protein-led", value: proteinLed.toString(), detail: "Mayor proteina", tone: "amber" },
      { label: "Carb-led", value: carbLed.toString(), detail: "Mayor carbohidrato", tone: "blue" },
    ];
  }, [ingredients]);

  async function handleCreateIngredient(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const created = await fetchJson<Ingredient>("/api/v1/ingredients", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          calories: Number(form.calories || 0),
          proteins: Number(form.proteins || 0),
          fats: Number(form.fats || 0),
          carbohydrates: Number(form.carbohydrates || 0),
          macronutrientValuesId: Number(form.macronutrientValuesId || 0),
        }),
      });
      setIngredients((current) => [created, ...current]);
      setForm(emptyForm);
      setShowCreate(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ingredient.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteIngredient(ingredientId: number | string) {
    const confirmed = window.confirm("Delete this ingredient?");
    if (!confirmed) return;

    try {
      await fetchJson<void>(`/api/v1/ingredients/${ingredientId}`, { method: "DELETE" });
      setIngredients((current) => current.filter((ingredient) => String(ingredient.id) !== String(ingredientId)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete ingredient.");
    }
  }

  return (
    <SharedLayout
      title="Ingredients"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={nav}
      breadcrumbs={["Admin", "Management", "Ingredients"]}
      showPageTitle={false}
    >
      <div className="admin-ingredients-page">
        <header className="admin-ingredients-header">
          <div>
            <span className="admin-ingredients-eyebrow">Nutrition catalog</span>
            <h2>Ingredientes</h2>
            <p>Consulta los ingredientes registrados y sus macros base por cada 100 g.</p>
          </div>
          <button type="button" className="admin-ingredients-create" onClick={() => setShowCreate((current) => !current)}>
            Nuevo ingrediente
          </button>
        </header>

        <section className="admin-ingredients-stats">
          {stats.map((stat) => (
            <article className="admin-ingredients-stat" key={stat.label}>
              <div className={`admin-ingredients-stat-icon admin-ingredients-stat-${stat.tone}`}>
                <IngredientStatIcon tone={stat.tone} />
              </div>
              <div>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
                <p>{stat.detail}</p>
              </div>
            </article>
          ))}
        </section>

        {error && <div className="admin-ingredients-warning">{error}</div>}

        {showCreate && (
          <form className="admin-ingredients-form" onSubmit={handleCreateIngredient}>
            <input required placeholder="Nombre" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            <input placeholder="Calorias" type="number" step="0.1" value={form.calories} onChange={(event) => setForm((current) => ({ ...current, calories: event.target.value }))} />
            <input placeholder="Proteina" type="number" step="0.1" value={form.proteins} onChange={(event) => setForm((current) => ({ ...current, proteins: event.target.value }))} />
            <input placeholder="Carbs" type="number" step="0.1" value={form.carbohydrates} onChange={(event) => setForm((current) => ({ ...current, carbohydrates: event.target.value }))} />
            <input placeholder="Grasas" type="number" step="0.1" value={form.fats} onChange={(event) => setForm((current) => ({ ...current, fats: event.target.value }))} />
            <input placeholder="Macro ID" type="number" value={form.macronutrientValuesId} onChange={(event) => setForm((current) => ({ ...current, macronutrientValuesId: event.target.value }))} />
            <button type="submit" disabled={saving}>{saving ? "Guardando..." : "Crear"}</button>
          </form>
        )}

        <section className="admin-ingredients-card">
          <div className="admin-ingredients-toolbar">
            <div>
              <h3>Biblioteca de ingredientes</h3>
              <p>{filteredIngredients.length} resultados</p>
            </div>
            <div className="admin-ingredients-controls">
              <input
                type="search"
                placeholder="Buscar ingrediente..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <select value={macroFilter} onChange={(event) => setMacroFilter(event.target.value)}>
                <option value="all">Todos los macros</option>
                <option value="protein">Protein</option>
                <option value="carbs">Carbs</option>
                <option value="fat">Fat</option>
              </select>
            </div>
          </div>

          {loading && <div className="admin-ingredients-state">Loading ingredients...</div>}

          {!loading && (
            <div className="admin-ingredients-library">
              {filteredIngredients.map((ingredient) => (
                <article className="admin-ingredients-item" key={ingredient.id}>
                  <div className="admin-ingredients-item-header">
                    <div className="admin-ingredients-thumb">{getInitial(ingredient.name)}</div>
                    <div>
                      <strong>{ingredient.name || "-"}</strong>
                      <span>#{ingredient.id} · {dominantMacro(ingredient)}</span>
                    </div>
                  </div>
                  <div className="admin-ingredients-calories">
                    {formatMacro(ingredient.calories, " kcal")} / 100 g
                  </div>
                  <div className="admin-ingredients-macros">
                    <div><span>Protein</span><strong>{formatMacro(ingredient.proteins)}</strong></div>
                    <div><span>Carbs</span><strong>{formatMacro(ingredient.carbohydrates)}</strong></div>
                    <div><span>Fat</span><strong>{formatMacro(ingredient.fats)}</strong></div>
                  </div>
                  <button type="button" onClick={() => handleDeleteIngredient(ingredient.id)}>Eliminar</button>
                </article>
              ))}
            </div>
          )}

          {!loading && filteredIngredients.length === 0 && <div className="admin-ingredients-state">No ingredients found.</div>}
        </section>
      </div>
    </SharedLayout>
  );
}

function IngredientStatIcon({ tone }: { tone: string }) {
  if (tone === "green") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3v18" />
        <path d="M7 7c0 3 2 5 5 5" />
        <path d="M17 7c0 3-2 5-5 5" />
      </svg>
    );
  }

  if (tone === "amber") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 19h14" />
        <path d="M8 19V9" />
        <path d="M12 19V5" />
        <path d="M16 19v-7" />
      </svg>
    );
  }

  if (tone === "blue") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 8h12" />
        <path d="M6 12h12" />
        <path d="M6 16h12" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 13c0 4 2.7 7 6 7s6-3 6-7c0-2.8-2.2-5-6-9-3.8 4-6 6.2-6 9Z" />
      <path d="M12 4c2.4-.7 4.3-.2 5.5 1.5" />
    </svg>
  );
}
