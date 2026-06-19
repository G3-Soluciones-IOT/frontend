import { useEffect, useState } from "react";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import { apiUrl } from "@/app/config/env";

interface EditUserPageProps {
    currentPath: string;
    onNavigate: (href: string) => void;
}

export function EditUserPage({
                                 currentPath,
                                 onNavigate,
                             }: EditUserPageProps) {
    const nav = useNavigation();

    // 🔥 ID desde URL: /admin/users/5/edit
    const userId = currentPath.split("/")[3];

    // ===== STATES =====
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // ===== LOAD USER =====
    useEffect(() => {
        async function loadUser() {
            try {
                const res = await fetch(apiUrl(`/users/${userId}`));
                const data = await res.json();

                setFullName(data.fullName || "");
                setEmail(data.email || "");
                setRole(data.role || "");
            } catch (error) {
                console.error("Error loading user:", error);
            } finally {
                setLoading(false);
            }
        }

        loadUser();
    }, [userId]);

    // ===== SAVE USER =====
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            await fetch(apiUrl(`/users/${userId}`), {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fullName,
                    email,
                    role,
                }),
            });

            onNavigate("/admin/users");
        } catch (error) {
            console.error("Error updating user:", error);
            alert("Error al actualizar el usuario");
        } finally {
            setSaving(false);
        }
    };

    // ===== LOADING STATE =====
    if (loading) {
        return (
            <SharedLayout
                title="Edit User"
                currentPath={currentPath}
                onNavigate={onNavigate}
                navigationItems={nav}
            >
                <div style={{ padding: 32 }}>Loading user...</div>
            </SharedLayout>
        );
    }

    // ===== UI =====
    return (
        <SharedLayout
            title="Edit User"
            currentPath={currentPath}
            onNavigate={onNavigate}
            navigationItems={nav}
            breadcrumbs={["Admin", "Users", "Edit"]}
        >
            <div
                style={{
                    padding: "32px",
                    background: "#f8fafc",
                    minHeight: "100%",
                }}
            >
                <div
                    style={{
                        maxWidth: "700px",
                        margin: "0 auto",
                        background: "#ffffff",
                        borderRadius: "16px",
                        padding: "32px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                        border: "1px solid #e5e7eb",
                    }}
                >
                    {/* HEADER */}
                    <div style={{ marginBottom: "32px" }}>
                        <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 700 }}>
                            Edit User
                        </h2>

                        <p style={{ marginTop: "8px", color: "#6b7280", fontSize: "14px" }}>
                            Update user information and permissions.
                        </p>
                    </div>

                    {/* FORM */}
                    <form onSubmit={handleSubmit}>
                        {/* FULL NAME */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={labelStyle}>Full Name</label>

                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                style={inputStyle}
                            />
                        </div>

                        {/* EMAIL */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={labelStyle}>Email</label>

                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={inputStyle}
                            />
                        </div>

                        {/* ROLE */}
                        <div style={{ marginBottom: "28px" }}>
                            <label style={labelStyle}>Role</label>

                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                style={inputStyle}
                            >
                                <option value="nutritionist">Nutritionist</option>
                                <option value="patient">Patient</option>
                            </select>
                        </div>

                        {/* ACTIONS */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "12px",
                            }}
                        >
                            <button
                                type="button"
                                onClick={() => onNavigate("/admin/users")}
                                style={cancelButton}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    ...saveButton,
                                    opacity: saving ? 0.6 : 1,
                                    cursor: saving ? "not-allowed" : "pointer",
                                }}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </SharedLayout>
    );
}

/* ===== STYLES ===== */
const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#374151",
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
};

const cancelButton: React.CSSProperties = {
    padding: "12px 18px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 600,
};

const saveButton: React.CSSProperties = {
    padding: "12px 20px",
    borderRadius: "10px",
    border: "none",
    background: "#111827",
    color: "#fff",
    fontWeight: 600,
};