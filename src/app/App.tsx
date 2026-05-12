import { useState } from "react";
import { SignInPage, SignUpPage } from "@/modules/iam";

type Screen = "signin" | "signup";

export default function App() {
  const [screen, setScreen] = useState<Screen>("signin");

  if (screen === "signup") {
    return (
      <SignUpPage
        onSignUp={(session) => {
          console.log("Registered:", session);
          setScreen("signin");
        }}
        onNavigateToSignIn={() => setScreen("signin")}
      />
    );
  }

  return (
    <SignInPage
      onSignIn={(session) => {
        console.log("Logged in:", session);
      }}
      onNavigateToSignUp={() => setScreen("signup")}
    />
  );
}