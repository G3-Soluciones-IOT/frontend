import { useState } from "react";
import type { SignUpInput } from "../../application/dto/SignUpInput.ts";
import type { AuthSession } from "../../domain/models/User.ts";
import {apiUrl} from "@/app/config/env.ts";

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

  /*
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
    localStorage.setItem("mockAuthEmail", input.email);
    localStorage.setItem("mockAuthPassword", input.password);
    localStorage.setItem("mockAuthRole", session.user.role);
    setState({ isLoading: false, error: null, session });
    return session;
  };
*/

  const execute = async (input: SignUpInput): Promise<AuthSession | null> => {
    try {
      setState({
        isLoading: true,
        error: null,
        session: null,
      });

      // Verificar si ya existe el email
      const usersResponse = await fetch(
          apiUrl(`/users?email=${input.email}`)
      );

      const existingUsers = await usersResponse.json();

      if (existingUsers.length > 0) {
        throw new Error("Email already exists");
      }

      // Crear usuario
      const createResponse = await fetch(apiUrl("/users"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: input.email,
          fullName: input.fullName,
          password: input.password,
          role: input.role,
          avatarUrl: "",
          createdAt: new Date().toISOString(),
          isActive: true,
        }),
      });

      const createdUser = await createResponse.json();

      const session: AuthSession = {
        user: {
          id: String(createdUser.id),
          email: createdUser.email,
          fullName: createdUser.fullName,
          role: createdUser.role,
          avatarUrl: createdUser.avatarUrl,
          createdAt: createdUser.createdAt,
        },
        tokens: {
          accessToken: "fake-token",
          refreshToken: "fake-refresh-token",
          expiresIn: 3600,
        },
      };

      localStorage.setItem(
          "accessToken",
          session.tokens.accessToken
      );

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
                : "Unknown error",
        session: null,
      });

      return null;
    }
  };
  return { ...state, execute };
}
