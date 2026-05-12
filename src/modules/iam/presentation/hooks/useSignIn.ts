import { useState } from "react";
import type { SignInInput } from "../../application/dto/SignInInput";
import type { AuthSession } from "../../domain/models/User";

interface UseSignInState {
  isLoading: boolean;
  error: string | null;
  session: AuthSession | null;
}

export function useSignIn() {
  const [state, setState] = useState<UseSignInState>({
    isLoading: false,
    error: null,
    session: null,
  });

  const execute = async (input: SignInInput): Promise<AuthSession | null> => {
    setState({ isLoading: true, error: null, session: null });

    if (input.email !== "admin@gmail.com" || input.password !== "admin") {
      setState({
        isLoading: false,
        error: "Use admin@gmail.com as email and admin as password.",
        session: null,
      });
      return null;
    }

    const session: AuthSession = {
      user: {
        id: "admin-user",
        email: "admin@gmail.com",
        fullName: "Admin",
        role: "admin",
        createdAt: new Date().toISOString(),
      },
      tokens: {
        accessToken: "mock-admin-access-token",
        refreshToken: "mock-admin-refresh-token",
        expiresIn: 3600,
      },
    };

    localStorage.setItem("accessToken", session.tokens.accessToken);
    setState({ isLoading: false, error: null, session });
    return session;
  };

  return { ...state, execute };
}
