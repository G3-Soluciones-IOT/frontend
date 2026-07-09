import { AnalyticsPage, DashboardPage } from "@/modules/dashboard";

interface DashboardRouteProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

export function DashboardRoute({ currentPath, onNavigate }: DashboardRouteProps) {
  return <DashboardPage currentPath={currentPath} onNavigate={onNavigate} />;
}

export function AnalyticsRoute({ currentPath, onNavigate }: DashboardRouteProps) {
  return <AnalyticsPage currentPath={currentPath} onNavigate={onNavigate} />;
}
