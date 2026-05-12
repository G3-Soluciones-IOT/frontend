import { SignInPage, SignUpPage } from "@/modules/iam";
import { useNavigate } from "react-router-dom";

export function SignInRoute() {
  const navigate = useNavigate();
  return (
    <SignInPage
      onSignIn={() => navigate("/dashboard")}
      onNavigateToSignUp={() => navigate("/sign-up")}
    />
  );
}