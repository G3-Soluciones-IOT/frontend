export type NotificationTone = "critical" | "warning" | "success" | "info";

export interface NotificationAction {
  label: string;
  variant?: "primary" | "secondary" | "muted";
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timeLabel: string;
  tone: NotificationTone;
  icon: "vitals" | "log" | "goal" | "system";
  actions?: NotificationAction[];
}

export interface NotificationSection {
  id: string;
  title: string;
  icon: "alert" | "progress" | "system";
  badge?: string;
  badgeTone?: "red" | "green" | "blue" | "gray";
  notifications: NotificationItem[];
}
