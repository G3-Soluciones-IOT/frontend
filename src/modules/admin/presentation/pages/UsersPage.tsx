import { useEffect, useMemo, useState } from "react";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import { apiUrl } from "@/app/config/env";

interface User {
  id: number | string;
  username: string;
  fullName?: string;
  roles?: string[];
  role?: string;
}

interface UsersPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

type RoleFilter = "all" | "patients" | "nutritionists" | "admins";

const filters: Array<{ key: RoleFilter; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "patients", label: "Pacientes" },
  { key: "nutritionists", label: "Nutricionistas" },
  { key: "admins", label: "Admins" },
];

function getPrimaryRole(user: User) {
  return user.roles?.[0] ?? user.role ?? "";
}

function normalizeRole(user: User) {
  return getPrimaryRole(user).replace(/^ROLE_/, "").trim().toUpperCase();
}

function roleLabel(user: User) {
  const role = normalizeRole(user);
  if (role === "PATIENT") return "Patient";
  if (role === "NUTRITIONIST") return "Nutritionist";
  if (role === "ADMIN") return "Admin";
  return role || "-";
}

function matchesFilter(user: User, filter: RoleFilter) {
  const role = normalizeRole(user);

  if (filter === "all") return true;
  if (filter === "patients") return role === "PATIENT";
  if (filter === "nutritionists") return role === "NUTRITIONIST";
  return role === "ADMIN";
}

function getInitial(user: User) {
  const source = user.fullName || user.username || String(user.id);
  return source.trim().charAt(0).toUpperCase() || "U";
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("accessToken");

  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function UsersPage({ currentPath, onNavigate }: UsersPageProps) {
  const nav = useNavigation();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadUsers() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(apiUrl("/api/v1/users"), {
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = (await response.json()) as User[];
        if (!ignore) setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load users.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadUsers();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const username = user.username?.toLowerCase() ?? "";
      const id = String(user.id).toLowerCase();

      return matchesFilter(user, roleFilter) && (!query || username.includes(query) || id.includes(query));
    });
  }, [users, search, roleFilter]);

  const filterCards = useMemo(
    () => filters.map((filter) => ({
      ...filter,
      count: users.filter((user) => matchesFilter(user, filter.key)).length,
      detail:
        filter.key === "all"
          ? "Cuentas registradas"
          : filter.key === "patients"
            ? "Usuarios con seguimiento"
            : filter.key === "nutritionists"
              ? "Profesionales activos"
              : "Acceso administrativo",
    })),
    [users],
  );

  return (
    <SharedLayout
      title="Users"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={nav}
      breadcrumbs={["Admin", "Management", "Users"]}
    >
      <div className="admin-users-page">
        <header className="admin-users-header">
          <div>
            <span className="admin-users-eyebrow">Administracion de cuentas</span>
            <h2 className="admin-users-title">Users</h2>
            <p className="admin-users-description">
              Gestiona administradores, nutricionistas y pacientes desde una vista centralizada.
            </p>
          </div>
          <button type="button" className="admin-users-create" onClick={() => onNavigate("/admin/users/new")}>
            Nuevo usuario
          </button>
        </header>

        <section className="admin-users-stats" aria-label="User role filters">
          {filterCards.map((filter) => {
            const active = roleFilter === filter.key;

            return (
              <button
                key={filter.key}
                type="button"
                className={`admin-users-stat ${active ? "admin-users-stat-active" : ""}`}
                onClick={() => setRoleFilter(filter.key)}
                aria-pressed={active}
              >
                <span>{filter.label}</span>
                <strong>{filter.count}</strong>
                <small>{filter.detail}</small>
              </button>
            );
          })}
        </section>

        <section className="admin-users-panel">
          <div className="admin-users-panel-header">
            <div>
              <h3>Listado de usuarios</h3>
              <p>{filteredUsers.length} resultados</p>
            </div>

            <div className="admin-users-toolbar">
              <input
                type="search"
                placeholder="Buscar por usuario o ID..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="admin-users-search"
              />

              <div className="admin-users-filters" aria-label="User role filters">
                {filters.map((filter) => {
                  const active = roleFilter === filter.key;

                  return (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setRoleFilter(filter.key)}
                      className={`admin-users-filter ${active ? "admin-users-filter-active" : ""}`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {loading && <div className="admin-users-state">Loading users...</div>}
          {error && <div className="admin-users-state admin-users-state-error">{error}</div>}

          {!loading && !error && (
            <div className="admin-users-table-wrap">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>ID de cuenta</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="admin-users-person">
                          <span className="admin-users-avatar">{getInitial(user)}</span>
                          <div>
                            <strong>{user.fullName || user.username || "-"}</strong>
                            <span>Cuenta JameoFit</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-users-role admin-users-role-${normalizeRole(user).toLowerCase()}`}>
                          {roleLabel(user)}
                        </span>
                      </td>
                      <td>
                        <span className="admin-users-id">#{user.id}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-users-view"
                          onClick={() => onNavigate(`/admin/users/${user.id}`)}
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && filteredUsers.length === 0 && (
            <div className="admin-users-state">No users found.</div>
          )}
        </section>
      </div>
    </SharedLayout>
  );
}
