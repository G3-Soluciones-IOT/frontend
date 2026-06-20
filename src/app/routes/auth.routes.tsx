import { SignInPage, SignUpPage } from "@/modules/iam";
import type { AuthSession } from "@/modules/iam";
import {
  clearStoredNutritionistProfile,
  isStoredNutritionistProfileCompleted,
} from "@/modules/nutritionist/infrastructure/storage/nutritionistProfileStorage";

interface AuthRouteProps {
  onNavigate: (path: string) => void;
}

export function SignInRoute({ onNavigate }: AuthRouteProps) {
  const handleSignIn = (session: AuthSession) => {
    const isNutritionist = session.user.roles.includes("ROLE_NUTRITIONIST");
    const isAdmin = session.user.roles.includes("ROLE_ADMIN");
    const profileCompleted = isStoredNutritionistProfileCompleted(session.user.id);

    if (isNutritionist && !profileCompleted) {
      onNavigate("/professional-profile");
      return;
    }

    if (isAdmin) {
      onNavigate("/admin");
      return;
    }

    onNavigate(isNutritionist ? "/nutritionist" : "/");
  };

  return (
    <SignInPage
      onSignIn={handleSignIn}
      onNavigateToSignUp={() => onNavigate("/sign-up")}
    />
  );
}

export function SignUpRoute({ onNavigate }: AuthRouteProps) {
  const handleSignUp = (session: AuthSession) => {
    if (session.user.roles.includes("ROLE_NUTRITIONIST")) {
      clearStoredNutritionistProfile(session.user.id);
    }

    onNavigate("/sign-in");
  };

  return (
    <SignUpPage
      onSignUp={handleSignUp}
      onNavigateToSignIn={() => onNavigate("/sign-in")}
    />
  );
}
