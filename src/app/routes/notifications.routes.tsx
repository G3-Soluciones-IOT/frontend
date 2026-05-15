import { NotificationsPage } from "@/modules/notifications";

interface NotificationsRouteProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

export function NotificationsRoute({
  currentPath,
  onNavigate,
}: NotificationsRouteProps) {
  return (
    <NotificationsPage
      currentPath={currentPath}
      onNavigate={onNavigate}
    />
  );
}
