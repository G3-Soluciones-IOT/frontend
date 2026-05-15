import { ChatPage, ConsultationsPage, RecommendationsPage } from "@/modules/communication";

interface CommunicationRouteProps {
  path: string;
  onNavigate: (href: string) => void;
}

export function CommunicationRoute({ path, onNavigate }: CommunicationRouteProps) {
  if (path === "/communication" || path === "/communication/chat") {
    return <ChatPage currentPath="/communication/chat" onNavigate={onNavigate} />;
  }

  if (path === "/communication/consultations") {
    return <ConsultationsPage currentPath={path} onNavigate={onNavigate} />;
  }

  if (path === "/communication/recommendations") {
    return <RecommendationsPage currentPath={path} onNavigate={onNavigate} />;
  }

  return null;
}


