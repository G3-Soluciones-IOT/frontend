import type { ReactNode } from "react";
import logo from "@/assets/LogoJameo.png";
import styles from "./SharedLayout.module.css";
import { Topbar } from "./Topbar";

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
  topbarTabs?: {
    label: string;
    href: string;
    active?: boolean;
  }[];
  showPageTitle?: boolean;
  userInitials?: string;
  onSettingsClick?: () => void;
  onNotificationsClick?: () => void;
  onProfileClick?: () => void;
  onLogout?: () => void;
}


function isActive(currentPath: string, href: string) {
  if (currentPath === href) return true;
  if (href === "/nutritionist") {
    return currentPath.startsWith("/nutritionist/recent-logs");
  }
  // Si es un padre, marca como activo si el currentPath comienza con ese href
  if (href === "/patients" || href === "/communication" || href === "/content") {
    return currentPath.startsWith(href);
  }
  if (href === "/nutritionist/patients/overview") {
    return currentPath.startsWith("/nutritionist/patients");
  }
  if (href === "/nutritionist/subscriptions") {
    return currentPath.startsWith(href);
  }
  return false;
}

function LogOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function SharedLayout({
  children,
  title,
  currentPath,
  onNavigate,
  navigationItems,
  breadcrumbs = [],
  topbarTabs = [],
  showPageTitle = true,
  userInitials = "SJ",
  onSettingsClick,
  onNotificationsClick,
  onProfileClick,
  onLogout,
}: SharedLayoutProps) {
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      return;
    }

    localStorage.removeItem("accessToken");
    onNavigate("/sign-in");
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

        <div className={styles.sidebarFooter}>
          <button type="button" className={styles.logoutButton} onClick={handleLogout} aria-label="Cerrar sesión">
            <LogOutIcon />
            <span>Salir</span>
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <Topbar
          title={title}
          breadcrumbs={breadcrumbs}
          tabs={topbarTabs}
          userInitials={userInitials}
          onSettingsClick={onSettingsClick ?? (() => onNavigate("/account-settings"))}
          onNotificationsClick={onNotificationsClick ?? (() => onNavigate("/notifications"))}
          onProfileClick={onProfileClick}
          onNavigate={onNavigate}
          styles={styles}
        />

        <section className={styles.content}>
          {showPageTitle && <h1 className={styles.pageTitle}>{title}</h1>}
          {children}
        </section>
      </main>
    </div>
  );
}
