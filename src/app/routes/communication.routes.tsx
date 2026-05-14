import { SharedLayout } from "@/shared/components/layout";
import { navigationConfig } from "@/shared/constants/navigation.config";

interface CommunicationRouteProps {
  path: string;
  onNavigate: (href: string) => void;
}

export function CommunicationRoute({ path, onNavigate }: CommunicationRouteProps) {
  if (path === "/communication/chat") {
    return (
      <SharedLayout
        title="Communication"
        currentPath={path}
        onNavigate={onNavigate}
        navigationItems={navigationConfig.nutritionist}
        breadcrumbs={["Communication", "Chat"]}
      >
        <p>Hola</p>
      </SharedLayout>
    );
  }

  return null;
}



