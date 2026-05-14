import { useCallback, useEffect, useState } from "react";
import { SignInRoute, SignUpRoute } from "./routes/auth.routes";
import { CommunicationRoute } from "./routes/communication.routes";
import { isNutritionistShellPath, NutritionistProfileRoute, NutritionistShellRoute } from "./routes/nutritionist.routes";
import { PatientsRoute } from "./routes/patients.routes";

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

  if (path.startsWith("/patients") || path.startsWith("/nutritionist/patients")) {
    return <PatientsRoute path={path} onNavigate={navigate} />;
  }

  if (path.startsWith("/communication")) {
    return <CommunicationRoute path={path} onNavigate={navigate} />;
  }

  if (isNutritionistShellPath(path)) {
    return <NutritionistShellRoute currentPath={path} onNavigate={navigate} />;
  }

  return (
    <SignInRoute onNavigate={navigate} />
  );
}
