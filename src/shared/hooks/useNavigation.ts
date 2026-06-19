import { navigationConfig } from "@/shared/constants/navigation.config";

export function useNavigation() {
  const session =
      typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("session") || "null")
          : null;

  const role = session?.user?.role;

  if (
      role === "nutritionist" ||
      role === "patient" ||
      role === "admin"
  ) {
    return navigationConfig[role];
  }

  return navigationConfig.nutritionist;
}