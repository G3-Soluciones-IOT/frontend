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
import { API_BASE_URL, apiUrl } from "@/app/config/env.ts";

interface AuthApiUser {
  id: number | string;
  username: string;
  roles?: string[];
  token?: string;
}

function toSession(user: AuthApiUser): AuthSession {
  const accessToken = user.token ?? `token-${user.id}`;
  const roles = normalizeRoles(user.roles ?? rolesFromJwt(accessToken));

  return {
    user: {
      id: String(user.id),
      username: user.username,
      roles,
    },
    tokens: {
      accessToken,
      refreshToken: `refresh-${user.id}`,
      expiresIn: 3600,
    },
  };
}

function normalizeRoles(roles: string[] = []): string[] {
  return roles.map((role) => role.startsWith("ROLE_") ? role : `ROLE_${role}`);
}

function rolesFromJwt(token: string): string[] {
  const [, payload] = token.split(".");

  if (!payload) return [];

  try {
    const normalizedPayload = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const decodedPayload = JSON.parse(atob(normalizedPayload)) as {
      roles?: string[];
      authorities?: string[];
      scope?: string;
    };

    if (Array.isArray(decodedPayload.roles)) return decodedPayload.roles;
    if (Array.isArray(decodedPayload.authorities)) return decodedPayload.authorities;
    if (typeof decodedPayload.scope === "string") return decodedPayload.scope.split(" ");
  } catch {
    return [];
  }

  return [];
}

export class HttpAuthRepository implements AuthRepository {
  async signIn(input: SignInInput): Promise<AuthSession> {
    if (API_BASE_URL.includes("localhost:3001")) {
      return this._signInWithJsonServer(input);
    }

    try {
      const { data } = await authApi.post<AuthApiUser>("/sign-in", {
        username: input.username,
        password: input.password,
      });

      let session = toSession(data);

      this._persistTokens(session);

      if (session.user.roles.length === 0) {
        session = await this._hydrateSessionRoles(session);
        this._persistTokens(session);
      }

      return session;
    } catch (error) {
      if (API_BASE_URL.includes("localhost:3001")) {
        return this._signInWithJsonServer(input);
      }

      if (axios.isAxiosError(error) && [401, 403, 404].includes(error.response?.status ?? 0)) {
        throw new InvalidCredentialsError();
      }

      throw error;
    }
  }

  async signUp(input: SignUpInput): Promise<AuthSession> {
    try {
      if (await this._usernameExists(input.username)) {
        throw new EmailAlreadyInUseError();
      }

      const { data } = await authApi.post<AuthApiUser>("/sign-up", {
        username: input.username,
        password: input.password,
        roles: [input.role],
      });

      return toSession(data);
    } catch (error) {
      if (error instanceof EmailAlreadyInUseError) {
        throw error;
      }

      if (axios.isAxiosError(error) && error.response?.status === 409) {
        throw new EmailAlreadyInUseError();
      }

      if (axios.isAxiosError(error) && error.response?.status === 404 && API_BASE_URL.includes("localhost:3001")) {
        return this._signUpWithJsonServer(input);
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
    localStorage.removeItem("session");
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
    localStorage.setItem("session", JSON.stringify(session));
  }

  private async _hydrateSessionRoles(session: AuthSession): Promise<AuthSession> {
    try {
      const { data } = await axios.get<AuthApiUser>(apiUrl(`/api/v1/users/${session.user.id}`), {
        headers: {
          Authorization: `Bearer ${session.tokens.accessToken}`,
        },
      });

      return toSession({
        ...data,
        token: session.tokens.accessToken,
      });
    } catch {
      return session;
    }
  }

  private async _signInWithJsonServer(input: SignInInput): Promise<AuthSession> {
    if (!API_BASE_URL.includes("localhost:3001")) {
      throw new InvalidCredentialsError();
    }

    const params = new URLSearchParams({
      username: input.username,
      password: input.password,
    });

    const response = await fetch(apiUrl(`/users?${params.toString()}`));

    if (!response.ok) {
      throw new InvalidCredentialsError();
    }

    const users = (await response.json()) as AuthApiUser[];
    const user = users[0];

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const session = toSession(user);
    this._persistTokens(session);

    return session;
  }

  private async _usernameExists(username: string): Promise<boolean> {
    if (!API_BASE_URL.includes("localhost:3001")) {
      return false;
    }

    const params = new URLSearchParams({ username });
    const response = await fetch(apiUrl(`/users?${params.toString()}`));

    if (!response.ok) {
      return false;
    }

    const users = (await response.json()) as AuthApiUser[];

    return users.length > 0;
  }

  private async _signUpWithJsonServer(input: SignUpInput): Promise<AuthSession> {
    const response = await fetch(apiUrl("/users"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: input.username,
        password: input.password,
        roles: [input.role],
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create account.");
    }

    const user = (await response.json()) as AuthApiUser;

    return toSession(user);
  }
}
