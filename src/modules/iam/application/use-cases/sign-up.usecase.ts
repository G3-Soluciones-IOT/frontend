import type { AuthRepository } from "../../domain/repositories/AuthRepository";
import type { AuthSession } from "../../domain/models/User";
import type { SignUpInput } from "../dto/SignUpInput.ts";

export class PasswordMismatchError extends Error {
  constructor() {
    super("Passwords do not match.");
    this.name = "PasswordMismatchError";
  }
}

export class WeakPasswordError extends Error {
  constructor() {
    super("Password must be at least 8 characters long.");
    this.name = "WeakPasswordError";
  }
}

export function signUpUseCase(repository: AuthRepository) {
  return async (input: SignUpInput): Promise<AuthSession> => {
    if (input.password !== input.confirmPassword) {
      throw new PasswordMismatchError();
    }

    if (input.password.length < 8) {
      throw new WeakPasswordError();
    }

    return repository.signUp({
      ...input,
      username: input.username.trim(),
    });
  };
}
