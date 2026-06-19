import { IoTDevicesPage } from "@/modules/iot-devices";
import {
  PatientDetailPage,
  PatientTrackingPage,
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

  if (normalizedPath === "/patients/directory") {
    return <PatientsDirectoryPage currentPath={path} onNavigate={onNavigate} />;
  }
  if (
      normalizedPath === "/patients/michael-chen/iot-devices" ||
      normalizedPath === "/patients/iot-devices"
  ) {
    return <IoTDevicesPage currentPath={path} onNavigate={onNavigate} />;
  }
  if (normalizedPath === "/patients/michael-chen/tracking" || normalizedPath === "/patients/tracking") {
    return <PatientTrackingPage currentPath={path} onNavigate={onNavigate} />;

  }

  if (normalizedPath === "/patients/michael-chen") {
    return <PatientDetailPage currentPath={path} onNavigate={onNavigate} />;
  }

  return <PatientsOverviewPage currentPath={path} onNavigate={onNavigate} />;
}
