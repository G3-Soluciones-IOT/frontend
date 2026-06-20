import { navigationConfig } from "@/shared/constants/navigation.config";

type NavigationRole = keyof typeof navigationConfig;

function toNavigationRole(role: unknown): NavigationRole | null {
  if (role === "ROLE_NUTRITIONIST" || role === "nutritionist") {
    return "nutritionist";
  }

  if (role === "ROLE_PATIENT" || role === "patient") {
    return "patient";
  }

  if (role === "ROLE_ADMIN" || role === "admin") {
    return "admin";
  }

  return null;
}

export function useNavigation() {
  const session =
      typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("session") || "null")
          : null;

  const role = toNavigationRole(session?.user?.roles?.[0] ?? session?.user?.role);

  if (role) {
    return navigationConfig[role];
  }

  return navigationConfig.nutritionist;
}
