import type { ReactNode } from "react";
import styles from "./NutritionistLayout.module.css";
import logo from "@/assets/LogoJameo.png";

interface NavigationItem {
  label: string;
  href?: string;
  active?: boolean;
  icon: ReactNode;
  nested?: boolean;
  onClick?: () => void;
}

interface NutritionistLayoutProps {
  children: ReactNode;
  title?: string;
  avatarUrl?: string;
  userInitials?: string;
  onNavigate?: (href: string) => void;
  onSignOut?: () => void;
}

function DashboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function DirectoryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16v16H4z" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19V9" />
      <path d="M10 19V5" />
      <path d="M16 19v-7" />
      <path d="M22 19H2" />
    </svg>
  );
}

function ScreenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 14h6" />
      <path d="M9 18h6" />
      <path d="M9 10h1" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-.4-1.1 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.1-.4 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 .4 1.1 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.36.39.7.6 1a1.7 1.7 0 0 0 1.1.4H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.1.4c-.21.3-.4.64-.6 1z" />
    </svg>
  );
}

function BrandLogo() {
  return <img src={logo} alt="JameoFit" width={104} height={32} />;
}

export function NutritionistLayout({
  children,
  title = "Profile Information",
  avatarUrl,
  userInitials = "NF",
  onNavigate,
}: NutritionistLayoutProps) {
  const navigation: NavigationItem[] = [
    { label: "Dashboard", href: "/nutritionist", icon: <DashboardIcon /> },
    { label: "Patients", href: "/nutritionist/patients", icon: <UserIcon /> },
    { label: "Directory", href: "/nutritionist/patients/directory", icon: <DirectoryIcon />, nested: true },
    { label: "Tracking", href: "/nutritionist/patients/tracking", icon: <CalendarIcon />, nested: true },
    { label: "Communication", href: "/nutritionist/messages", icon: <MessageIcon /> },
    { label: "Chat", href: "/nutritionist/messages/chat", icon: <MessageIcon />, nested: true },
    { label: "Consultations", href: "/nutritionist/consultations", icon: <CalendarIcon />, nested: true },
    { label: "Recommendations", href: "/nutritionist/recommendations", icon: <ClipboardIcon />, nested: true },
    { label: "Content", href: "/nutritionist/content", icon: <ClipboardIcon /> },
    { label: "Tips", href: "/nutritionist/content/tips", icon: <ClipboardIcon />, nested: true },
    { label: "Resource Library", href: "/nutritionist/content/resources", icon: <DirectoryIcon />, nested: true },
    { label: "Analytics", href: "/nutritionist/analytics", icon: <AnalyticsIcon /> },
    { label: "Subscriptions", href: "/nutritionist/subscriptions", icon: <ScreenIcon /> },
  ];

  const handleNavigate = (item: NavigationItem) => {
    if (item.onClick) {
      item.onClick();
      return;
    }

    if (item.href) onNavigate?.(item.href);
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <BrandLogo />
        </div>

        <nav className={styles.sidebarNav} aria-label="Nutritionist navigation">
          <div className={styles.navSection}>
            {navigation.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`${styles.navItem} ${item.active ? styles.active : ""} ${item.nested ? styles.navSub : ""}`}
                onClick={() => handleNavigate(item)}
              >
                {item.nested ? <span className={styles.navSubSpacer} /> : item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <span className={styles.topbarTitle}>{title}</span>
          <div className={styles.topbarActions}>
            <button type="button" className={styles.iconBtn} aria-label="Notifications">
              <BellIcon />
            </button>
            <button type="button" className={styles.iconBtn} aria-label="Settings" onClick={() => onNavigate?.("/nutritionist/settings")}>
              <SettingsIcon />
            </button>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className={styles.avatar} />
            ) : (
              <span className={styles.avatarPlaceholder}>{userInitials}</span>
            )}
          </div>
        </header>

        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
