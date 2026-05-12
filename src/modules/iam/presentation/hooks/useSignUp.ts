import { useState } from "react";
import { signUpUseCase } from "../../application/use-cases/sign-up.usecase.ts";
import { HttpAuthRepository } from "../../infrastructure/repositories/HttpAuthRepository";
import type { SignUpInput } from "../../application/dto/SignUpInput.ts";
import type { AuthSession } from "../../domain/models/User.ts";
import { AuthDomainError } from "../../domain/errors/AuthDomainError.ts";

const repository = new HttpAuthRepository();
const signUp = signUpUseCase(repository);

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
    try {
      const session = await signUp(input);
      setState({ isLoading: false, error: null, session });
      return session;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again.";
      setState({ isLoading: false, error: message, session: null });
      return null;
    }
  };

  return { ...state, execute };
}