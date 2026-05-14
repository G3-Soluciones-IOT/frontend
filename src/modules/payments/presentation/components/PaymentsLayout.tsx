import type { ReactNode } from "react";
import logo from "@/assets/LogoJameo.png";
import styles from "./PaymentsLayout.module.css";

interface NavItem {
  label: string;
  href: string;
  group?: "root" | "patients" | "communication" | "content";
}

interface PaymentsLayoutProps {
  children: ReactNode;
  title: string;
  currentPath: string;
  onNavigate: (href: string) => void;
  breadcrumbs?: string[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/nutritionist", group: "root" },
  { label: "Patients", href: "/nutritionist/patients/overview", group: "root" },
  { label: "Directory", href: "/nutritionist/patients/directory", group: "patients" },
  { label: "Tracking", href: "/nutritionist/patients/tracking", group: "patients" },
  { label: "Communication", href: "/communication", group: "root" },
  { label: "Chat", href: "/communication/chat", group: "communication" },
  { label: "Consultations", href: "/communication/consultations", group: "communication" },
  { label: "Recommendations", href: "/communication/recommendations", group: "communication" },
  { label: "Content", href: "/content", group: "root" },
  { label: "Tips", href: "/content/tips", group: "content" },
  { label: "Analytics", href: "/analytics", group: "root" },
  { label: "Subscriptions", href: "/nutritionist/subscriptions", group: "root" },
];

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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

function FileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}

function ScreenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-.4-1.1 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.1-.4 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 .4 1.1 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.36.39.7.6 1a1.7 1.7 0 0 0 1.1.4H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.1.4c-.21.3-.4.64-.6 1z" />
    </svg>
  );
}

function getIcon(group?: NavItem["group"]) {
  switch (group) {
    case "patients":
      return null;
    case "communication":
      return null;
    case "content":
      return null;
    default:
      return {
        Dashboard: <GridIcon />,
        Patients: <UsersIcon />,
        Communication: <MessageIcon />,
        Content: <FileIcon />,
        Analytics: <ChartIcon />,
        Subscriptions: <ScreenIcon />,
      } as const;
  }
}

function isActive(currentPath: string, href: string) {
  if (currentPath === href) return true;
  if (href === "/nutritionist/subscriptions") {
    return (
      currentPath.startsWith("/nutritionist/subscriptions") ||
      currentPath === "/subscriptions"
    );
  }
  if (href === "/nutritionist/patients/overview") {
    return currentPath.startsWith("/patients") || currentPath.startsWith("/nutritionist/patients");
  }

  return false;
}

export function PaymentsLayout({
  children,
  title,
  currentPath,
  onNavigate,
  breadcrumbs = [],
}: PaymentsLayoutProps) {
  const breadcrumbText = breadcrumbs.join(" > ");

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logoWrap}>
          <img src={logo} alt="JameoFit" className={styles.logo} />
        </div>

        <nav className={styles.nav} aria-label="Payments navigation">
          {navItems.map((item) => {
            const iconMap = getIcon(item.group);
            const active = isActive(currentPath, item.href);
            const nested = item.group && item.group !== "root";

            return (
              <button
                key={item.href}
                type="button"
                className={`${styles.navItem} ${active ? styles.navItemActive : ""} ${nested ? styles.navItemNested : ""}`}
                onClick={() => onNavigate(item.href)}
              >
                {nested ? <span className={styles.navSpacer} /> : iconMap?.[item.label as keyof typeof iconMap]}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumbs}>{breadcrumbText || title}</div>
          <div className={styles.topbarActions}>
            <button type="button" className={styles.iconButton} aria-label="Notifications">
              <BellIcon />
            </button>
            <button type="button" className={styles.iconButton} aria-label="Settings">
              <SettingsIcon />
            </button>
            <span className={styles.avatar}>RG</span>
          </div>
        </header>

        <section className={styles.content}>
          <h1 className={styles.pageTitle}>{title}</h1>
          {children}
        </section>
      </main>
    </div>
  );
}
