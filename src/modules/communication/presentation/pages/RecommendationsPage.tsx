import type { FC } from "react";
import { SharedLayout } from "@/shared/components/layout";
import { navigationConfig } from "@/shared/constants/navigation.config";

interface RecommendationsPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

export const RecommendationsPage: FC<RecommendationsPageProps> = ({ currentPath, onNavigate }) => {
  return (
    <SharedLayout
      title="Communication"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={navigationConfig.nutritionist}
      breadcrumbs={["Communication", "Recommendations"]}
    >
      <div className="communication-recommendations-page">
        <p>HOLA 3</p>
      </div>
    </SharedLayout>
  );
};


