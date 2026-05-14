import type { FC } from "react";
import { SharedLayout } from "@/shared/components/layout";
import { navigationConfig } from "@/shared/constants/navigation.config";

interface ConsultationsPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

export const ConsultationsPage: FC<ConsultationsPageProps> = ({ currentPath, onNavigate }) => {
  return (
    <SharedLayout
      title="Communication"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={navigationConfig.nutritionist}
      breadcrumbs={["Communication", "Consultations"]}
    >
      <div className="communication-consultations-page">
        <p>HOLA 2</p>
      </div>
    </SharedLayout>
  );
};

