import { TipsPage } from "@/modules/tips";

interface TipsRouteProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

export function TipsRoute({ currentPath, onNavigate }: TipsRouteProps) {
  return <TipsPage currentPath={currentPath} onNavigate={onNavigate} />;
}


