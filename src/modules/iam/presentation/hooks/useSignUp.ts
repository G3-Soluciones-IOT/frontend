import { useState } from "react";
import { HttpAuthRepository } from "../../infrastructure/repositories/HttpAuthRepository";
import type { SignUpInput } from "../../application/dto/SignUpInput";
import type { AuthSession } from "../../domain/models/User";

const repository = new HttpAuthRepository();

export function useSignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] =
      useState<AuthSession | null>(null);

  const execute = async (
      input: SignUpInput
  ): Promise<AuthSession | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const result =
          await repository.signUp(input);

      setSession(result);

      return result;
    } catch (err) {
      setError(
          err instanceof Error
              ? err.message
              : "Unknown error"
      );

      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    execute,
    isLoading,
    error,
    session,
  };
}