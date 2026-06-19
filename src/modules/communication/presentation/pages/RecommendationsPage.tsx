import type { FC } from "react";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";

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
      navigationItems={useNavigation()}
      breadcrumbs={["Communication", "Recommendations"]}
    >
      <div className="communication-recommendations-page">
        <p>HOLA 3</p>
      </div>
    </SharedLayout>
  );
};


