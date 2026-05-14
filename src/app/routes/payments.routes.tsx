import { PaymentsPage } from "@/modules/payments/presentation/pages/PaymentsPage";

interface PaymentsRouteProps {
  path: string;
  onNavigate: (href: string) => void;
}

export function PaymentsRoute({ path, onNavigate }: PaymentsRouteProps) {
  const normalizedPath = path.startsWith("/nutritionist") ? path.replace("/nutritionist", "") : path;

  if (normalizedPath === "/subscriptions") {
    return <PaymentsPage currentPath={path} onNavigate={onNavigate} />;
  }

  return <PaymentsPage currentPath={path} onNavigate={onNavigate} />;
}

