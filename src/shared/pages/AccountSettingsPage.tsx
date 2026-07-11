import { useState } from "react";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import { appLanguages, type AppLanguage } from "@/shared/i18n/language";
import { useI18n } from "@/shared/i18n/useI18n";
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

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function PreferencesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18" />
      <path d="M4 8h8" />
      <path d="M12 16h8" />
      <circle cx="17" cy="8" r="3" />
      <circle cx="7" cy="16" r="3" />
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
  const { language, setLanguage, t } = useI18n();
  const [statusMessage, setStatusMessage] = useState("");

  const updateEmail = () => {
    localStorage.setItem("mockAuthEmail", email);
    setStatusMessage(t("account.status.emailUpdated"));
  };

  const updatePassword = () => {
    const passwordToSave = newPassword.trim() || currentPassword;
    localStorage.setItem("mockAuthPassword", passwordToSave);
    setCurrentPassword(passwordToSave);
    setNewPassword("");
    setStatusMessage(t("account.status.passwordUpdated"));
  };

  const updateLanguage = (nextLanguage: AppLanguage) => {
    setLanguage(nextLanguage);
  };

  return (
    <SharedLayout
      title="Account Settings"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={useNavigation()}
      breadcrumbs={["Account Settings"]}
      onSettingsClick={() => onNavigate("/account-settings")}
      showPageTitle={false}
    >
      <div className={styles.pageShell}>
        <section className={styles.hero}>
          <div>
            <span>{t("account.center")}</span>
            <h1>{t("account.title")}</h1>
            <p>{t("account.hero.description")}</p>
          </div>
          <div className={styles.profileBadge}>
            <UserIcon />
            <strong>{email}</strong>
          </div>
        </section>

        {statusMessage && <p className={styles.statusMessage}>{statusMessage}</p>}

        <div className={styles.settingsGrid}>
          <section className={styles.card}>
            <div className={styles.cardHeaderStack}>
                <span className={styles.cardIcon}><LockIcon /></span>
                <div>
                  <h2>{t("account.security.title")}</h2>
                  <p>{t("account.security.description")}</p>
                </div>
              </div>

            <div className={styles.divider} />

            <label className={styles.field}>
              <span>{t("account.email.label")}</span>
              <div className={styles.inlineAction}>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <button type="button" className={styles.secondaryButton} onClick={updateEmail}>
                  {t("account.email.update")}
                </button>
              </div>
            </label>

            <div className={styles.divider} />

            <div className={styles.passwordFields}>
              <label className={styles.field}>
                <span>{t("account.password.current")}</span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span>{t("account.password.new")}</span>
                <input
                  type="password"
                  placeholder={t("account.password.placeholder")}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </label>

              <button type="button" className={styles.primaryButton} onClick={updatePassword}>
                {t("account.password.change")}
              </button>
            </div>
          </section>

          <aside className={styles.sideStack}>
            <section className={`${styles.card} ${styles.preferencesCard}`}>
              <div className={styles.cardHeaderStack}>
                <span className={styles.cardIcon}><PreferencesIcon /></span>
                <div>
                  <h2>{t("account.preferences.title")}</h2>
                </div>
              </div>

              <label className={styles.field}>
                <span>{t("account.language.label")}</span>
                <select value={language} onChange={(event) => updateLanguage(event.target.value as AppLanguage)}>
                  {appLanguages.map((appLanguage) => (
                    <option key={appLanguage}>{appLanguage}</option>
                  ))}
                </select>
              </label>
            </section>

            <section className={`${styles.card} ${styles.dangerCard}`}>
              <div className={styles.dangerHeader}>
                <WarningIcon />
                <h2>{t("account.danger.title")}</h2>
              </div>
              <p>{t("account.danger.description")}</p>

              <div className={styles.logoutBox}>
                <div>
                  <strong>{t("account.logout.title")}</strong>
                  <span>{t("account.logout.description")}</span>
                </div>
                <button type="button" className={styles.dangerButton} onClick={onLogout}>
                  {t("account.logout.button")}
                </button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </SharedLayout>
  );
}
