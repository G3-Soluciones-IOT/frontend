import { NotificationBell } from "@/shared/components/ui";

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-.4-1.1 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.1-.4 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 .4 1.1 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.2.36.39.7.6 1a1.7 1.7 0 0 0 1.1.4H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.1.4c-.21.3-.4.64-.6 1z" />
    </svg>
  );
}

export interface TopbarProps {
  title: string;
  breadcrumbs?: string[];
  tabs?: {
    label: string;
    href: string;
    active?: boolean;
  }[];
  userInitials?: string;
  onSettingsClick?: () => void;
  onNotificationsClick?: () => void;
  onProfileClick?: () => void;
  onNavigate?: (href: string) => void;
  styles: Record<string, string>;
}

export function Topbar({
  title,
  breadcrumbs = [],
  tabs = [],
  userInitials = "SJ",
  onSettingsClick,
  onNotificationsClick,
  onProfileClick,
  onNavigate,
  styles,
}: TopbarProps) {
  const breadcrumbText = breadcrumbs.length > 0 ? breadcrumbs.join(" > ") : title;

  const handleNotificationsClick = () => {
    if (onNotificationsClick) {
      onNotificationsClick();
      return;
    }

    onNavigate?.("/notifications");
  };

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick();
      return;
    }

    onNavigate?.("/professional-profile");
  };

  return (
    <header className={styles.topbar}>
      <div className={styles.topbarStart}>
        <div className={styles.breadcrumbs}>{breadcrumbText}</div>
        {tabs.length > 0 && (
          <>
            <span className={styles.topbarDivider} aria-hidden="true" />
            <nav className={styles.topbarTabs} aria-label={`${title} views`}>
              {tabs.map((tab) => (
                <button
                  key={tab.href}
                  type="button"
                  className={`${styles.topbarTab} ${tab.active ? styles.topbarTabActive : ""}`}
                  onClick={() => onNavigate?.(tab.href)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </>
        )}
      </div>
      <div className={styles.topbarActions}>
        <NotificationBell
          className={styles.iconButton}
          onClick={handleNotificationsClick}
        />
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
          className={styles.avatar}
          aria-label="Open profile"
          onClick={handleProfileClick}
        >
          {userInitials}
        </button>
      </div>
    </header>
  );
}

