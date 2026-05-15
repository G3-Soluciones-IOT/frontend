import { cn } from "@/shared/utils/ui";
import styles from "./notification-ui.module.css";

interface BadgeProps {
  children: string | number;
  tone?: "red" | "green" | "blue" | "gray";
  className?: string;
}

export function Badge({ children, tone = "gray", className }: BadgeProps) {
  return (
    <span className={cn(styles.badge, styles[`badge${tone}`], className)}>
      {children}
    </span>
  );
}
