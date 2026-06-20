import { useEffect, useMemo, useState } from "react";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import { apiUrl } from "@/app/config/env";
import { UserDetailsModal } from "../components/UserDetailsModal";

interface User {
  id: number;
  email?: string;
  fullName?: string;
  username?: string;
  role?: string;
  roles?: string[];
  avatarUrl?: string;
  createdAt?: string;
  isActive?: boolean;
}

interface UsersPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

type RoleTab = "nutritionist" | "patient";
type StatusFilter = "all" | "active" | "inactive";

const roleTabs: Array<{ key: RoleTab; label: string }> = [
  { key: "nutritionist", label: "Nutritionists" },
  { key: "patient", label: "Patients" },
];

function getDisplayName(user: User) {
  return user.fullName || user.username || `User ${user.id}`;
}

function getDisplayEmail(user: User) {
  return user.email || "-";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";
}

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeRole(user: User) {
  const role = user.role ?? user.roles?.[0] ?? "";
  return role.replace(/^ROLE_/, "").trim().toLowerCase();
}

export function UsersPage({ currentPath, onNavigate }: UsersPageProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<RoleTab>("nutritionist");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const nav = useNavigation();
    const [selectedUser, setSelectedUser] =
        useState<User | null>(null);

  useEffect(() => {
    // Build API URL using centralized env helper (see src/app/config/env.ts).
    // Configure VITE_API_BASE_URL in the project root `.env` file (eg. VITE_API_BASE_URL=http://localhost:3000)
    const url = apiUrl("/users");
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setUsers(data || []))
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  const nutritionists = useMemo(
    () => users.filter((user) => normalizeRole(user) === "nutritionist"),
    [users],
  );

  const patients = useMemo(
    () => users.filter((user) => normalizeRole(user) === "patient"),
    [users],
  );

  const visibleUsers = activeTab === "nutritionist" ? nutritionists : patients;
  const filteredUsers = visibleUsers.filter((user) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "active") return Boolean(user.isActive);
    return !user.isActive;
  });

  const visibleCount = filteredUsers.length;

  return (
    <SharedLayout
      title="User Management"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={nav}
      breadcrumbs={["Admin", "Users"]}
    >
      <div style={{ padding: 24, background: "#f8fafc", minHeight: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 32, lineHeight: 1.1, color: "#111827" }}>User Management</h2>
            <p style={{ margin: "10px 0 0", color: "#4b5563", fontSize: 18 }}>
              Manage nutritionist credentials and patient access levels.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              type="button"
              style={{
                height: 40,
                padding: "0 16px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                background: "#ffffff",
                color: "#111827",
                cursor: "pointer",
              }}
              onClick={() => {
                const csvRows = [
                  ["fullName", "email", "role", "isActive", "createdAt"],
                  ...visibleUsers.map((u) => [getDisplayName(u), getDisplayEmail(u), normalizeRole(u), String(Boolean(u.isActive)), u.createdAt ?? ""]),
                ];
                const csv = csvRows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `${activeTab}-users.csv`;
                link.click();
                URL.revokeObjectURL(link.href);
              }}
            >
              Export CSV
            </button>
            <button
              type="button"
              style={{
                height: 40,
                padding: "0 18px",
                borderRadius: 6,
                border: "none",
                background: "#0f2b66",
                color: "#ffffff",
                cursor: "pointer",
              }}
              onClick={() => onNavigate("/admin/users/new")}
            >
              + Add New User
            </button>
          </div>
        </div>

        <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)" }}>
          <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
            {roleTabs.map((tab) => {
              const count = tab.key === "nutritionist" ? nutritionists.length : patients.length;
              const active = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    flex: 1,
                    minWidth: 180,
                    padding: "18px 24px",
                    background: active ? "#f8fbff" : "#ffffff",
                    border: "none",
                    borderBottom: active ? "2px solid #0f2b66" : "2px solid transparent",
                    color: active ? "#0f2b66" : "#4b5563",
                    fontSize: 16,
                    fontWeight: 500,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                    {tab.label}
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 28,
                        height: 20,
                        padding: "0 8px",
                        borderRadius: 999,
                        background: active ? "#0f2b66" : "#f3f4f6",
                        color: active ? "#ffffff" : "#6b7280",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "center",
              flexWrap: "wrap",
              padding: "14px 20px",
              borderBottom: "1px solid #e5e7eb",
              background: "#fbfbfc",
              color: "#6b7280",
            }}
          >
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <label
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  background: "#ffffff",
                  color: "#374151",
                }}
              >
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#111827",
                    font: "inherit",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  background: "#ffffff",
                  color: "#374151",
                }}
              >
                Role: {activeTab === "nutritionist" ? "Nutritionist" : "Patient"}
              </span>
              <span>
                Showing {Math.min(10, visibleCount)} of {visibleCount} results
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>Sort by:</span>
              <strong style={{ color: "#111827", fontWeight: 500 }}>Join Date (Newest)</strong>
            </div>
          </div>

          {loading && <div style={{ padding: 24 }}>Loading users…</div>}
          {error && <div style={{ padding: 24, color: "#b91c1c" }}>{error}</div>}

          {!loading && !error && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", background: "#f3f4f6", color: "#4b5563", borderBottom: "1px solid #e5e7eb" }}>
                    <th style={{ padding: "16px 24px", fontSize: 14, letterSpacing: 0.4 }}>USER NAME</th>
                    <th style={{ padding: "16px 24px", fontSize: 14, letterSpacing: 0.4 }}>
                      ROLE &amp; SPECIALTY
                    </th>
                    <th style={{ padding: "16px 24px", fontSize: 14, letterSpacing: 0.4 }}>STATUS</th>
                    <th style={{ padding: "16px 24px", fontSize: 14, letterSpacing: 0.4 }}>JOIN DATE</th>
                    <th style={{ padding: "16px 24px", fontSize: 14, letterSpacing: 0.4 }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "18px 24px" }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 16,
                              background: "#dbeafe",
                              color: "#334155",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 12,
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {u.avatarUrl ? null : getInitials(getDisplayName(u))}
                          </div>
                          <div>
                            <div style={{ fontSize: 15, color: "#111827", fontWeight: 500 }}>{getDisplayName(u)}</div>
                            <div style={{ fontSize: 14, color: "#6b7280" }}>{getDisplayEmail(u)}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "18px 24px" }}>
                        <div style={{ fontSize: 15, color: "#111827" }}>
                          {normalizeRole(u) === "nutritionist" ? "Nutritionist" : "Patient"}
                        </div>
                        <div style={{ fontSize: 14, color: "#6b7280" }}>General Access</div>
                      </td>
                      <td style={{ padding: "18px 24px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 10px",
                            borderRadius: 999,
                            background: u.isActive ? "#ecfdf5" : "#fef2f2",
                            color: u.isActive ? "#047857" : "#b91c1c",
                            fontSize: 12,
                            fontWeight: 700,
                            textTransform: "uppercase",
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 999,
                              background: u.isActive ? "#047857" : "#b91c1c",
                            }}
                          />
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ padding: "18px 24px", color: "#374151" }}>{formatDate(u.createdAt)}</td>
                      <td style={{ padding: "18px 24px" }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <button
                                type="button"
                                onClick={() => setSelectedUser(u)}
                                style={actionButtonStyle}
                            >
                                View
                            </button>
                          <button type="button" onClick={() => onNavigate(`/admin/users/${u.id}/edit`)} style={actionButtonStyle}>
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && filteredUsers.length === 0 && (
            <div style={{ padding: 24, color: "#6b7280" }}>
              No {activeTab === "nutritionist" ? "nutritionists" : "patients"} found for the selected status.
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "16px 20px", background: "#f9fafb", color: "#4b5563", flexWrap: "wrap" }}>
            <span>Page 1 of 1</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button type="button" style={pagerButtonStyle} disabled>
                ‹
              </button>
              <button type="button" style={{ ...pagerButtonStyle, background: "#0f2b66", color: "#ffffff", borderColor: "#0f2b66" }}>
                1
              </button>
              <button type="button" style={pagerButtonStyle} disabled>
                ›
              </button>
            </div>
          </div>
        </div>
      </div>

        <UserDetailsModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
        />
    </SharedLayout>
  );
}

const actionButtonStyle: React.CSSProperties = {
  height: 32,
  padding: "0 12px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#111827",
  cursor: "pointer",
};

const pagerButtonStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 4,
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#374151",
  cursor: "pointer",
};


