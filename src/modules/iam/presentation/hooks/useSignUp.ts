import { useState } from "react";
import type { SignUpInput } from "../../application/dto/SignUpInput.ts";
import type { AuthSession } from "../../domain/models/User.ts";

interface UseSignUpState {
  isLoading: boolean;
  error: string | null;
  session: AuthSession | null;
}

export function useSignUp() {
  const [state, setState] = useState<UseSignUpState>({
    isLoading: false,
    error: null,
    session: null,
  });

  const execute = async (input: SignUpInput): Promise<AuthSession | null> => {
    setState({ isLoading: true, error: null, session: null });

    const session: AuthSession = {
      user: {
        id: "admin-user",
        email: input.email,
        fullName: input.fullName,
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
