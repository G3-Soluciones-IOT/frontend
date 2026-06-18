import { navigationConfig } from "@/shared/constants/navigation.config";

export function useNavigation() {
  const saved = typeof window !== "undefined" ? localStorage.getItem("mockAuthRole") : null;

  if (typeof saved === "string") {
    if (saved === "nutritionist" || saved === "patient" || saved === "admin") {
      return navigationConfig[saved as "nutritionist" | "patient" | "admin"];
    }
  }

  return navigationConfig.nutritionist;
}



