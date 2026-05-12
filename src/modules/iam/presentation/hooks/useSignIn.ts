import { useState } from "react";
import { signInUseCase } from "../../application/use-cases/sign-in.usecase";
import { HttpAuthRepository } from "../../infrastructure/repositories/HttpAuthRepository";
import type { SignInInput } from "../../application/dto/SignInInput";
import type { AuthSession } from "../../domain/models/User";
import { AuthDomainError } from "../../domain/errors/AuthDomainError";

const repository = new HttpAuthRepository();
const signIn = signInUseCase(repository);

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
    try {
      const session = await signIn(input);
      setState({ isLoading: false, error: null, session });
      return session;
    } catch (err) {
      const message =
        err instanceof AuthDomainError
          ? err.message
          : "An unexpected error occurred. Please try again.";
      setState({ isLoading: false, error: message, session: null });
      return null;
    }
  };

  return { ...state, execute };
}