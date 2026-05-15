import { DashboardPage } from "@/modules/dashboard";

interface DashboardRouteProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

export function DashboardRoute({ currentPath, onNavigate }: DashboardRouteProps) {
  return <DashboardPage currentPath={currentPath} onNavigate={onNavigate} />;
}
