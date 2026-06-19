import { useCallback, useEffect, useState } from "react";
import { AccountSettingsRoute } from "./routes/account-settings.routes";
import { SignInRoute, SignUpRoute } from "./routes/auth.routes";
import { CommunicationRoute } from "./routes/communication.routes";
import { DashboardRoute } from "./routes/dashboard.routes";
import { isNutritionistShellPath, NutritionistProfileRoute, NutritionistShellRoute } from "./routes/nutritionist.routes";
import { NotificationsRoute } from "./routes/notifications.routes";
import { PatientsRoute } from "./routes/patients.routes";
import { PaymentsRoute } from "@/app/routes/payments.routes.tsx";
import { TipsRoute } from "@/app/routes/tips.routes";
import { PatientIoTStatusPage } from "@/modules/iot-devices/presentation/pages/PatientIoTStatusPage";
import { BottleDetailPage } from "@/modules/iot-devices/presentation/pages/BottleDetailPage";
import { ScaleDetailPage } from "@/modules/iot-devices/presentation/pages/ScaleDetailPage";

export default function App() {
  const [path, setPath] = useState(() => window.location.pathname);

  const navigate = useCallback((nextPath: string) => {
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
  }, []);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  if (path === "/sign-up") {
    return <SignUpRoute onNavigate={navigate} />;
  }

  if (path === "/professional-profile") {
    return <NutritionistProfileRoute currentPath={path} onNavigate={navigate} />;
  }

  if (path === "/account-settings") {
    return <AccountSettingsRoute currentPath={path} onNavigate={navigate} />;
  }

  if (path === "/notifications") {
    return <NotificationsRoute currentPath={path} onNavigate={navigate} />;
  }

  if (path === "/nutritionist" || path === "/nutritionist/recent-logs") {
    return <DashboardRoute currentPath={path} onNavigate={navigate} />;
  }

  if (path.startsWith("/patients") || path.startsWith("/nutritionist/patients")) {
    return <PatientsRoute path={path} onNavigate={navigate} />;
  }

  if (path.startsWith("/communication")) {
    return <CommunicationRoute path={path} onNavigate={navigate} />;
  }

  if (path.startsWith("/content/tips")) {
    return <TipsRoute currentPath={path} onNavigate={navigate} />;
  }

  if (path.startsWith("/subscriptions") || path.startsWith("/nutritionist/subscriptions")) {
    return <PaymentsRoute path={path} onNavigate={navigate} />;
  }
  if (path === "/patient/iot-devices") {
    return <PatientIoTStatusPage currentPath={path} onNavigate={navigate} />;
  }
  if (path === "/patient/iot-devices/bottle") {
    return <BottleDetailPage currentPath={path} onNavigate={navigate} />;
  }
  if (path === "/patient/iot-devices/scale") {
    return <ScaleDetailPage currentPath={path} onNavigate={navigate} />;
  }
  if (isNutritionistShellPath(path)) {
    return <NutritionistShellRoute currentPath={path} onNavigate={navigate} />;
  }

  return (
    <SignInRoute onNavigate={navigate} />
  );
}
