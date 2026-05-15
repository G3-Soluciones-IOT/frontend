import type { ReactNode } from "react";
import { cn } from "@/shared/utils/ui";
import styles from "./notification-ui.module.css";

interface NotificationCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  timeLabel: string;
  tone?: "critical" | "warning" | "success" | "info";
  actions?: ReactNode;
  className?: string;
}

export function NotificationCard({
  icon,
  title,
  description,
  timeLabel,
  tone = "info",
  actions,
  className,
}: NotificationCardProps) {
  return (
    <article className={cn(styles.notificationCard, styles[`card${tone}`], className)}>
      <div className={styles.notificationIcon}>{icon}</div>
      <div className={styles.notificationBody}>
        <div className={styles.notificationHeader}>
          <h3>{title}</h3>
          <span>{timeLabel}</span>
        </div>
        <p>{description}</p>
        {actions && <div className={styles.notificationActions}>{actions}</div>}
      </div>
    </article>
  );
}
