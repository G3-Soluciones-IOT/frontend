import { useState } from "react";
import type { SignInInput } from "../../application/dto/SignInInput";
import type { AuthSession } from "../../domain/models/User";
import { HttpAuthRepository } from "../../infrastructure/repositories/HttpAuthRepository";
import { signInUseCase } from "../../application/use-cases/sign-in.usecase.ts";

interface UseSignInState {
  isLoading: boolean;
  error: string | null;
  session: AuthSession | null;
}

const repository = new HttpAuthRepository();
const signIn = signInUseCase(repository);

export function useSignIn() {
  const [state, setState] = useState<UseSignInState>({
    isLoading: false,
    error: null,
    session: null,
  });

  const execute = async (
      input: SignInInput
  ): Promise<AuthSession | null> => {
    try {
      setState({
        isLoading: true,
        error: null,
        session: null,
      });

      const session = await signIn(input);

      setState({
        isLoading: false,
        error: null,
        session,
      });

      return session;
    } catch (error) {
      setState({
        isLoading: false,
        error:
            error instanceof Error
                ? error.message
                : "Failed to sign in",
        session: null,
      });

      return null;
    }
  };

  return {
    ...state,
    execute,
  };
}