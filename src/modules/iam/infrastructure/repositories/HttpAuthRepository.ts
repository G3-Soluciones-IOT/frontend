import type { AuthRepository } from "../../domain/repositories/AuthRepository";
import type { AuthSession, User } from "../../domain/models/User";
import type { SignInInput } from "../../application/dto/SignInInput";
import type { SignUpInput } from "../../application/dto/SignUpInput";
import { authApi } from "../api/Auth.api";
import {
  InvalidCredentialsError,
  EmailAlreadyInUseError,
} from "../../domain/errors/AuthDomainError";
import axios from "axios";
import { apiUrl } from "@/app/config/env";

export class HttpAuthRepository implements AuthRepository {
  async signIn(input: SignInInput): Promise<AuthSession> {
    const response = await fetch(
        apiUrl(`/users?email=${encodeURIComponent(input.email)}`)
    );

    const users = await response.json();

    const user = users.find(
        (u: any) => u.password === input.password
    );

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const session: AuthSession = {
      user: {
        id: String(user.id),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      tokens: {
        accessToken: `token-${user.id}`,
        refreshToken: `refresh-${user.id}`,
        expiresIn: 3600,
      },
    };

    localStorage.setItem("session", JSON.stringify(session));

    this._persistTokens(session);

    return session;
  }

  async signUp(input: SignUpInput): Promise<AuthSession> {
    try {
      const { data } = await authApi.post<AuthSession>("/sign-up", input);
      this._persistTokens(data);
      return data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        throw new EmailAlreadyInUseError();
      }
      throw error;
    }
  }

  async signOut(): Promise<void> {
    const token = localStorage.getItem("refreshToken");

    if (token) {
      await authApi.post("/sign-out", { refreshToken: token }).catch(() => {});
    }

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }

  async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem("accessToken");

    if (!token) return null;

    try {
      const { data } = await authApi.get<User>("/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return data;
    } catch {
      return null;
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthSession> {
    const { data } = await authApi.post<AuthSession>("/refresh", {
      refreshToken,
    });

    this._persistTokens(data);

    return data;
  }

  private _persistTokens(session: AuthSession): void {
    localStorage.setItem("accessToken", session.tokens.accessToken);
    localStorage.setItem("refreshToken", session.tokens.refreshToken);
  }
}