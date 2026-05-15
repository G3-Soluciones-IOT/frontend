import type { NotificationSection } from "../../domain/models/Notification";

export const nutritionistNotificationSections: NotificationSection[] = [
  {
    id: "health-alerts",
    title: "Health Alerts",
    icon: "alert",
    badge: "2",
    badgeTone: "red",
    notifications: [
      {
        id: "critical-vitals-john-doe",
        title: "Critical Vitals: John Doe",
        description: "Resting heart rate exceeded upper threshold (110 bpm) during sleep period.",
        timeLabel: "10 mins ago",
        tone: "critical",
        icon: "vitals",
        actions: [
          { label: "View Details", variant: "primary" },
          { label: "Dismiss", variant: "muted" },
        ],
      },
      {
        id: "missed-logging-sarah-smith",
        title: "Missed Logging: Sarah Smith",
        description: "Patient has missed logging meals for 48 consecutive hours.",
        timeLabel: "2 hrs ago",
        tone: "warning",
        icon: "log",
        actions: [
          { label: "Message Patient", variant: "secondary" },
        ],
      },
    ],
  },
  {
    id: "patient-progress",
    title: "Patient Progress",
    icon: "progress",
    badge: "3 New",
    badgeTone: "green",
    notifications: [
      {
        id: "goal-achieved-mike-johnson",
        title: "Goal Achieved: Mike Johnson",
        description: "Successfully completed the 4-week macro adherence challenge.",
        timeLabel: "Yesterday",
        tone: "success",
        icon: "goal",
        actions: [
          { label: "Nutrition Goal", variant: "secondary" },
        ],
      },
    ],
  },
  {
    id: "system",
    title: "System",
    icon: "system",
    notifications: [
      {
        id: "platform-update",
        title: "Platform Update",
        description: "New macro tracking features are now live. Review the updated documentation.",
        timeLabel: "Oct 12",
        tone: "info",
        icon: "system",
      },
    ],
  },
];
