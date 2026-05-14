import type { ReactNode } from "react";
import logo from "@/assets/LogoJameo.png";
import styles from "./SharedLayout.module.css";

export interface NavigationItem {
  label: string;
  href: string;
  icon: ReactNode;
  group?: "root" | string;
}

export interface SharedLayoutProps {
  children: ReactNode;
  title: string;
  currentPath: string;
  onNavigate: (href: string) => void;
  navigationItems: NavigationItem[];
  breadcrumbs?: string[];
  userInitials?: string;
  onSettingsClick?: () => void;
  onNotificationsClick?: () => void;
  onProfileClick?: () => void;
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

function isActive(currentPath: string, href: string) {
  if (currentPath === href) return true;
  // Si es un padre, marca como activo si el currentPath comienza con ese href
  if (href === "/nutritionist" || href === "/patients" || href === "/communication" || href === "/content") {
    return currentPath.startsWith(href);
  }
  return false;
}

export function SharedLayout({
  children,
  title,
  currentPath,
  onNavigate,
  navigationItems,
  breadcrumbs = [],
  userInitials = "RG",
  onSettingsClick,
  onNotificationsClick,
  onProfileClick,
}: SharedLayoutProps) {
  const breadcrumbText = breadcrumbs.length > 0 ? breadcrumbs.join(" > ") : title;
  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick();
      return;
    }

    onNavigate("/professional-profile");
  };

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.logoWrap}>
          <img src={logo} alt="JameoFit" className={styles.logo} />
        </div>

        <nav className={styles.nav} aria-label="Main navigation">
          {navigationItems.map((item) => {
            const active = isActive(currentPath, item.href);
            const nested = item.group && item.group !== "root";

            return (
              <button
                key={item.href}
                type="button"
                className={`${styles.navItem} ${active ? styles.navItemActive : ""} ${nested ? styles.navItemNested : ""}`}
                onClick={() => onNavigate(item.href)}
                title={item.label}
              >
                {nested ? <span className={styles.navSpacer} /> : item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumbs}>{breadcrumbText}</div>
          <div className={styles.topbarActions}>
            <button
              type="button"
              className={styles.iconButton}
              aria-label="Notifications"
              onClick={onNotificationsClick}
            >
              <BellIcon />
            </button>
            <button
              type="button"
              className={styles.iconButton}
              aria-label="Settings"
              onClick={onSettingsClick}
            >
              <SettingsIcon />
            </button>
            <button
              type="button"
              className={`${styles.avatar} ${styles.avatarButton}`}
              aria-label="Open profile"
              onClick={handleProfileClick}
            >
              {userInitials}
            </button>
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

