import { cn } from "@/shared/utils/ui";
import styles from "./notification-ui.module.css";

interface ToastProps {
  message: string;
  tone?: "success" | "error" | "info";
  visible?: boolean;
}

export function Toast({ message, tone = "info", visible = true }: ToastProps) {
  if (!visible) return null;

  return (
    <div className={cn(styles.toast, styles[`toast${tone}`])} role="status">
      {message}
    </div>
  );
}
