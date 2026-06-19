import { useState } from "react";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import { apiUrl } from "@/app/config/env";

interface CreateUserPageProps {
    currentPath: string;
    onNavigate: (href: string) => void;
}

export function CreateUserPage({
                                   currentPath,
                                   onNavigate,
                               }: CreateUserPageProps) {
    const nav = useNavigation();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("patient");

    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            await fetch(apiUrl("/users"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fullName,
                    email,
                    role,
                    isActive: true,
                }),
            });

            onNavigate("/admin/users");
        } catch (error) {
            console.error("Error creating user:", error);
            alert("Error creando usuario");
        } finally {
            setSaving(false);
        }
    };

    return (<SharedLayout
            title="Create User"
            currentPath={currentPath}
            onNavigate={onNavigate}
            navigationItems={nav}
            breadcrumbs={["Admin", "Users", "New"]}
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
                            Create User
                        </h2>


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
                                {saving ? "Saving..." : "Create User"}
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