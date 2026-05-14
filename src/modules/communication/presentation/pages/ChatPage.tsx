import type { FC } from "react";
import { SharedLayout } from "@/shared/components/layout";
import { navigationConfig } from "@/shared/constants/navigation.config";

interface ChatPageProps {
  currentPath: string;
  onNavigate: (href: string) => void;
}

export const ChatPage: FC<ChatPageProps> = ({ currentPath, onNavigate }) => {
  return (
    <SharedLayout
      title="Communication"
      currentPath={currentPath}
      onNavigate={onNavigate}
      navigationItems={navigationConfig.nutritionist}
      breadcrumbs={["Communication", "Chat"]}
    >
      <div className="communication-chat-page">
        <p>Hola oño</p>
      </div>
    </SharedLayout>
  );
};




