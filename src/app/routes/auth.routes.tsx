import { SignInPage, SignUpPage } from "@/modules/iam";

interface AuthRouteProps {
  onNavigate: (path: string) => void;
}

export function SignInRoute({ onNavigate }: AuthRouteProps) {
  return (
    <SignInPage
      onSignIn={() => onNavigate("/nutritionist")}
      onNavigateToSignUp={() => onNavigate("/sign-up")}
    />
  );
}

export function SignUpRoute({ onNavigate }: AuthRouteProps) {
  return (
    <SignUpPage
        onSignUp={() => onNavigate("/sign-in")}
      onNavigateToSignIn={() => onNavigate("/sign-in")}
    />
  );
}
