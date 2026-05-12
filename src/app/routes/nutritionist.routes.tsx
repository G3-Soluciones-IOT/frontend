import { NutritionistProfilePage } from "@/modules/nutritionist";

interface NutritionistProfileRouteProps {
  onNavigate: (path: string) => void;
}

export function NutritionistProfileRoute({ onNavigate }: NutritionistProfileRouteProps) {
  return (
    <NutritionistProfilePage
      onNavigate={(href) => onNavigate(href)}
      onSignOut={() => {
        localStorage.removeItem("accessToken");
        onNavigate("/sign-in");
      }}
    />
  );
}
