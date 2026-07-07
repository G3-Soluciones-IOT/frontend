import { NutritionistMealPlansPage, NutritionistProfilePage, NutritionistRecipesPage } from "@/modules/nutritionist";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";

interface NutritionistProfileRouteProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

// helper moved to shared utils

export function NutritionistProfileRoute({ currentPath, onNavigate }: NutritionistProfileRouteProps) {
  return (
    <NutritionistProfilePage
      currentPath={currentPath}
      onNavigate={(href) => onNavigate(href)}
      onSignOut={() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("session");
        onNavigate("/sign-in");
      }}
    />
  );
}

export function NutritionistRecipesRoute({ currentPath, onNavigate }: NutritionistProfileRouteProps) {
  return <NutritionistRecipesPage currentPath={currentPath} onNavigate={onNavigate} />;
}

export function NutritionistMealPlansRoute({ currentPath, onNavigate }: NutritionistProfileRouteProps) {
  return <NutritionistMealPlansPage currentPath={currentPath} onNavigate={onNavigate} />;
}

export function NutritionistShellRoute({ currentPath, onNavigate }: NutritionistProfileRouteProps) {
  return (
    <SharedLayout
      title=""
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={useNavigation()}
    >
      {/* Intentionally empty: this keeps shell navigation visible while section content is pending. */}
      <></>
    </SharedLayout>
  );
}

