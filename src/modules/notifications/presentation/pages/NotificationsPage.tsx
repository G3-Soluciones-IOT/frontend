import { SharedLayout } from "@/shared/components/layout";
import { Badge, NotificationCard, Toast } from "@/shared/components/ui";
import { navigationConfig } from "@/shared/constants/navigation.config";
import { nutritionistNotificationSections } from "../../infrastructure/mock/nutritionistNotifications.mock";
import type { NotificationAction, NotificationItem, NotificationSection } from "../../domain/models/Notification";
import styles from "./NotificationsPage.module.css";

interface NotificationsPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

function AlertIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function ProgressIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20V10" />
      <path d="M18 20V4" />
      <path d="M6 20v-6" />
      <path d="M4 20h16" />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h4l2-5 4 10 2-5h6" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L11 4.93" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.81 13.12a5 5 0 0 0 7.07 7.07L13 19.07" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21a8 8 0 1 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function sectionIcon(section: NotificationSection) {
  if (section.icon === "alert") return <AlertIcon />;
  if (section.icon === "progress") return <ProgressIcon />;
  return <SystemIcon />;
}

function notificationIcon(notification: NotificationItem) {
  if (notification.icon === "vitals") return <PulseIcon />;
  if (notification.icon === "log") return <LinkIcon />;
  if (notification.icon === "goal") return <PersonIcon />;
  return <SystemIcon />;
}

function actionClass(action: NotificationAction) {
  if (action.variant === "primary") return styles.actionPrimary;
  if (action.variant === "secondary") return styles.actionSecondary;
  return styles.actionMuted;
}

export function NotificationsPage({ currentPath, onNavigate }: NotificationsPageProps) {
  return (
    <SharedLayout
      title="Notifications"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={navigationConfig.nutritionist}
      breadcrumbs={["Notifications"]}
    >
      <div className={styles.headerRow}>
        <p>Manage your clinical alerts and patient updates.</p>
        <button type="button" className={styles.markReadButton}>
          <CheckIcon />
          Mark all as read
        </button>
      </div>

      <div className={styles.sections}>
        {nutritionistNotificationSections.map((section) => (
          <section key={section.id} className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>
                {sectionIcon(section)}
                <h2>{section.title}</h2>
                {section.badge && (
                  <Badge tone={section.badgeTone}>{section.badge}</Badge>
                )}
              </div>
            </div>

            <div className={styles.notificationList}>
              {section.notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  icon={notificationIcon(notification)}
                  title={notification.title}
                  description={notification.description}
                  timeLabel={notification.timeLabel}
                  tone={notification.tone}
                  actions={notification.actions?.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      className={`${styles.actionButton} ${actionClass(action)}`}
                    >
                      {action.label}
                    </button>
                  ))}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <Toast message="Notifications synced" tone="info" visible={false} />
    </SharedLayout>
  );
}
