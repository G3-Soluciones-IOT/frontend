import { UsersPage } from "@/modules/admin/presentation/pages/UsersPage";
import { EditUserPage } from "@/modules/admin/presentation/pages/EditUserPage";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import {CreateUserPage} from "@/modules/admin/presentation/pages/CreateUserPage.tsx";


interface AdminRouteProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function AdminRoute({ currentPath, onNavigate }: AdminRouteProps) {
  const nav = useNavigation();
  if (currentPath === "/admin" || currentPath === "/admin/dashboard") {
	return <UsersPage currentPath={currentPath} onNavigate={onNavigate} />; // temporary map dashboard -> users
  }

	// Edit User
	if (
		currentPath.match(/^\/admin\/users\/\d+\/edit$/)
	) {
		return (
			<EditUserPage
				currentPath={currentPath}
				onNavigate={onNavigate}
			/>
		);
	}
	if (currentPath === "/admin/users/new") {
		return <CreateUserPage currentPath={currentPath} onNavigate={onNavigate} />;
	}

  if (currentPath.startsWith("/admin/users")) {
	return <UsersPage currentPath={currentPath} onNavigate={onNavigate} />;
  }

  if (currentPath.startsWith("/admin/content")) {
	return (
	  <SharedLayout title="Content Library" currentPath={currentPath} onNavigate={onNavigate} navigationItems={nav}>
		<div style={{ padding: 20 }}>
		  <h2>Content Library (placeholder)</h2>
		</div>
	  </SharedLayout>
	);
  }

  if (currentPath.startsWith("/admin/settings")) {
	return (
	  <SharedLayout title="Settings" currentPath={currentPath} onNavigate={onNavigate} navigationItems={nav}>
		<div style={{ padding: 20 }}>
		  <h2>Admin Settings (placeholder)</h2>
		</div>
	  </SharedLayout>
	);
  }

  return <UsersPage currentPath={currentPath} onNavigate={onNavigate} />;
}



