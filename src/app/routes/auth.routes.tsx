import { SignInPage, SignUpPage } from "@/modules/iam";
import type { AuthSession } from "@/modules/iam";
import {
  clearStoredNutritionistProfile,
  isStoredNutritionistProfileCompleted,
  storeNutritionistProfile,
} from "@/modules/nutritionist/infrastructure/storage/nutritionistProfileStorage";
import type { ProfessionalProfile } from "@/modules/nutritionist/domain/models/ProfessionalProfile";
import { apiUrl } from "@/app/config/env";

interface AuthRouteProps {
  onNavigate: (path: string) => void;
}

export function SignInRoute({ onNavigate }: AuthRouteProps) {
  const handleSignIn = async (session: AuthSession) => {
    const isNutritionist = session.user.roles.includes("ROLE_NUTRITIONIST");
    const isAdmin = session.user.roles.includes("ROLE_ADMIN");

    if (isNutritionist) {
      try {
        const response = await fetch(apiUrl(`/api/v1/nutritionists/by-user?userId=${encodeURIComponent(session.user.id)}`), {
          headers: {
            Authorization: `Bearer ${session.tokens.accessToken}`,
          },
        });

        if (response.ok) {
          const profile = (await response.json()) as ProfessionalProfile;
          storeNutritionistProfile(profile);
          onNavigate("/nutritionist");
          return;
        }
      } catch {
        // Fall back to local completion state if the profile endpoint is temporarily unavailable.
      }
    }

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
