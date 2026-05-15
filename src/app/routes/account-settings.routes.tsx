import { AccountSettingsPage } from "@/shared/pages";

interface AccountSettingsRouteProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

export function AccountSettingsRoute({
  currentPath,
  onNavigate,
}: AccountSettingsRouteProps) {
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    onNavigate("/sign-in");
  };

  return (
    <AccountSettingsPage
      currentPath={currentPath}
      onNavigate={onNavigate}
      onLogout={handleLogout}
    />
  );
}
