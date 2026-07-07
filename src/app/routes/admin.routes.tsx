import { UsersPage } from "@/modules/admin/presentation/pages/UsersPage";
import { EditUserPage } from "@/modules/admin/presentation/pages/EditUserPage";
import { UserViewPage } from "@/modules/admin/presentation/pages/UserViewPage";
import { AdminRecipesPage } from "@/modules/admin/presentation/pages/AdminRecipesPage";
import { AdminMealPlansPage } from "@/modules/admin/presentation/pages/AdminMealPlansPage";
import { AdminDashboardPage } from "@/modules/admin/presentation/pages/AdminDashboardPage";
import { SharedLayout } from "@/shared/components/layout";
import { useNavigation } from "@/shared/hooks/useNavigation";
import {CreateUserPage} from "@/modules/admin/presentation/pages/CreateUserPage.tsx";


interface AdminRouteProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const adminPlaceholders: Record<string, string> = {
  "/admin/profiles": "Profiles",
  "/admin/ingredients": "Ingredients",
  "/admin/categories": "Categories",
  "/admin/recipe-types": "Recipe Types",
  "/admin/objectives": "Objectives",
  "/admin/activity-levels": "Activity Levels",
  "/admin/allergies": "Allergies",
};

export function AdminRoute({ currentPath, onNavigate }: AdminRouteProps) {
  const nav = useNavigation();
  if (currentPath === "/admin" || currentPath === "/admin/dashboard") {
	return <AdminDashboardPage currentPath={currentPath} onNavigate={onNavigate} />;
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
	if (currentPath.match(/^\/admin\/users\/[^/]+$/)) {
		return <UserViewPage currentPath={currentPath} onNavigate={onNavigate} />;
	}

  if (currentPath.startsWith("/admin/users")) {
	return <UsersPage currentPath={currentPath} onNavigate={onNavigate} />;
  }

  if (currentPath === "/admin/recipes") {
	return <AdminRecipesPage currentPath={currentPath} onNavigate={onNavigate} />;
  }

  if (currentPath === "/admin/meal-plans") {
	return <AdminMealPlansPage currentPath={currentPath} onNavigate={onNavigate} />;
  }

  const placeholderTitle = adminPlaceholders[currentPath];

  if (placeholderTitle) {
	return (
	  <SharedLayout title={placeholderTitle} currentPath={currentPath} onNavigate={onNavigate} navigationItems={nav}>
		<div style={{ padding: 20 }}>
		  <h2>{placeholderTitle} (placeholder)</h2>
		</div>
	  </SharedLayout>
	);
  }

  return <AdminDashboardPage currentPath={currentPath} onNavigate={onNavigate} />;
}



