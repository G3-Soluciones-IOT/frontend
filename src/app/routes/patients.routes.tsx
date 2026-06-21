import {
  PatientDetailPage,
  PatientTrackingPage,
  NutritionistPatientsPage,
  PatientsDirectoryPage,
  PatientsOverviewPage,
} from "@/modules/patients";

interface PatientsRouteProps {
  path: string;
  onNavigate: (href: string) => void;
}

export function PatientsRoute({ path, onNavigate }: PatientsRouteProps) {
  const normalizedPath = path.startsWith("/nutritionist")
    ? path.replace("/nutritionist", "")
    : path;

  if (normalizedPath === "/patients" || normalizedPath === "/patients/request") {
    return <NutritionistPatientsPage currentPath={path} onNavigate={onNavigate} />;
  }

  if (normalizedPath === "/patients/directory") {
    return <PatientsDirectoryPage currentPath={path} onNavigate={onNavigate} />;
  }

  if (/^\/patients\/[^/]+\/tracking$/.test(normalizedPath) || normalizedPath === "/patients/tracking") {
    return <PatientTrackingPage currentPath={path} onNavigate={onNavigate} />;
  }

  if (/^\/patients\/[^/]+$/.test(normalizedPath)) {
    return <PatientDetailPage currentPath={path} onNavigate={onNavigate} />;
  }

  return <PatientsOverviewPage currentPath={path} onNavigate={onNavigate} />;
}
