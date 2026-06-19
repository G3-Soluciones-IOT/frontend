// @ts-ignore
import type { User } from "@/iam/domain/models/User";

interface UserDetailsModalProps {
    user: User | null;
    onClose: () => void;
}

export function UserDetailsModal({
                                     user,
                                     onClose,
                                 }: UserDetailsModalProps) {
    if (!user) return null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
            }}
        >
            <div
                style={{
                    width: 500,
                    background: "#fff",
                    borderRadius: 12,
                    padding: 24,
                }}
            >
                <div style={{ textAlign: "center" }}>
                    <div
                        style={{
                            width: 80,
                            height: 80,
                            borderRadius: "50%",
                            background: "#dbeafe",
                            margin: "0 auto 16px",
                        }}
                    />

                    <h2>{user.fullName}</h2>

                    <p>{user.role}</p>
                </div>

                <hr />

                <p>
                    <strong>Email:</strong> {user.email}
                </p>

                <p>
                    <strong>Created:</strong> {user.createdAt}
                </p>

                <div
                    style={{
                        marginTop: 24,
                        display: "flex",
                        justifyContent: "flex-end",
                    }}
                >
                    <button onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}