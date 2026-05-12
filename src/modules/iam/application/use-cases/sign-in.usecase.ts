import type { AuthRepository } from "../../domain/repositories/AuthRepository";
import type { AuthSession } from "../../domain/models/User";
import type { SignInInput } from "../dto/SignInInput";

export function signInUseCase(repository: AuthRepository) {
  return async (input: SignInInput): Promise<AuthSession> => {
    const trimmedInput: SignInInput = {
      email: input.email.trim().toLowerCase(),
      password: input.password,
    };

    return repository.signIn(trimmedInput);
  };
}