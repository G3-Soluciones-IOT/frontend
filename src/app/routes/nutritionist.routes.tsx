import { NutritionistProfilePage } from "@/modules/nutritionist";
import { SharedLayout } from "@/shared/components/layout";
import { navigationConfig } from "@/shared/constants/navigation.config";

interface NutritionistProfileRouteProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const nutritionistShellPrefixes = [
  "/nutritionist",
  "/communication",
  "/content",
  "/analytics",
  "/subscriptions",
];

export function isNutritionistShellPath(path: string) {
  return nutritionistShellPrefixes.some((prefix) => path.startsWith(prefix));
}

export function NutritionistProfileRoute({ currentPath, onNavigate }: NutritionistProfileRouteProps) {
  return (
    <NutritionistProfilePage
      currentPath={currentPath}
      onNavigate={(href) => onNavigate(href)}
      onSignOut={() => {
        localStorage.removeItem("accessToken");
        onNavigate("/sign-in");
      }}
    />
  );
}

export function NutritionistShellRoute({ currentPath, onNavigate }: NutritionistProfileRouteProps) {
  return (
    <SharedLayout
      title=""
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={navigationConfig.nutritionist}
    >
      {/* Intentionally empty: this keeps shell navigation visible while section content is pending. */}
      <></>
    </SharedLayout>
  );
}

