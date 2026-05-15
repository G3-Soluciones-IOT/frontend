import { useState } from "react";
import { SharedLayout } from "@/shared/components/layout";
import { navigationConfig } from "@/shared/constants/navigation.config";
import styles from "./AccountSettingsPage.module.css";

interface AccountSettingsPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
  onLogout: () => void;
}

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function AccountSettingsPage({
  currentPath,
  onNavigate,
  onLogout,
}: AccountSettingsPageProps) {
  const [email, setEmail] = useState(
    () => localStorage.getItem("mockAuthEmail") ?? "admin@gmail.com"
  );
  const [currentPassword, setCurrentPassword] = useState(
    () => localStorage.getItem("mockAuthPassword") ?? "admin"
  );
  const [newPassword, setNewPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const updateEmail = () => {
    localStorage.setItem("mockAuthEmail", email);
    setStatusMessage("Email updated locally.");
  };

  const updatePassword = () => {
    const passwordToSave = newPassword.trim() || currentPassword;
    localStorage.setItem("mockAuthPassword", passwordToSave);
    setCurrentPassword(passwordToSave);
    setNewPassword("");
    setStatusMessage("Password updated locally.");
  };

  return (
    <SharedLayout
      title="Account Settings"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={navigationConfig.nutritionist}
      breadcrumbs={["Account Settings"]}
      onSettingsClick={() => onNavigate("/account-settings")}
    >
      <div className={styles.header}>
        <p>Manage your professional profile and security preferences.</p>
      </div>

      {statusMessage && <p className={styles.statusMessage}>{statusMessage}</p>}

      <div className={styles.stack}>
        <section className={styles.card}>
          <div className={styles.cardHeaderStack}>
            <h2>Security Settings</h2>
            <p>Update your email and manage your password.</p>
          </div>

          <div className={styles.divider} />

          <label className={styles.field}>
            <span>Email Address</span>
            <div className={styles.inlineAction}>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <button type="button" className={styles.secondaryButton} onClick={updateEmail}>
                Update Email
              </button>
            </div>
          </label>

          <div className={styles.divider} />

          <div className={styles.passwordFields}>
            <label className={styles.field}>
              <span>Current Password</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </label>

            <label className={styles.field}>
              <span>New Password</span>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </label>

            <button type="button" className={styles.primaryButton} onClick={updatePassword}>
              Change Password
            </button>
          </div>
        </section>

        <section className={`${styles.card} ${styles.dangerCard}`}>
          <div className={styles.dangerHeader}>
            <WarningIcon />
            <h2>Danger Zone</h2>
          </div>
          <p>Actions in this section are sensitive and affect your active session.</p>

          <div className={styles.logoutBox}>
            <div>
              <strong>Log Out</strong>
              <span>End your current session across all devices.</span>
            </div>
            <button type="button" className={styles.dangerButton} onClick={onLogout}>
              Log Out Securely
            </button>
          </div>
        </section>
      </div>
    </SharedLayout>
  );
}
