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
  id?: number | string;
  userId?: number | string;
  username?: string;
  email?: string;
  roles?: string[];
  role?: string;
  token?: string;
  accessToken?: string;
  jwt?: string;
  jwtToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: {
    id?: number | string;
    userId?: number | string;
    username?: string;
    email?: string;
    roles?: string[];
    role?: string;
  };
}

interface JwtPayload {
  sub?: unknown;
  id?: unknown;
  userId?: unknown;
  user_id?: unknown;
  nameid?: unknown;
  role?: string;
  roles?: string[];
  authorities?: Array<string | { authority?: string; name?: string }>;
  scope?: string;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const [, payload] = token.split(".");

  if (!payload) return null;

  try {
    const normalizedPayload = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payload.length / 4) * 4, "=");
    return JSON.parse(atob(normalizedPayload)) as JwtPayload;
  } catch {
    return null;
  }
}

function normalizeIdClaim(value: unknown) {
  if (typeof value === "number") return String(value);
  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  return /^\d+$/.test(trimmed) ? trimmed : "";
}

function idFromJwt(token: string) {
  const payload = decodeJwtPayload(token);
  if (!payload) return "";

  return (
    normalizeIdClaim(payload.id) ||
    normalizeIdClaim(payload.userId) ||
    normalizeIdClaim(payload.user_id) ||
    normalizeIdClaim(payload.nameid) ||
    normalizeIdClaim(payload.sub)
  );
}

function toSession(user: AuthApiUser): AuthSession {
  const resolvedUser = user.user ?? user;
  const username = resolvedUser.username ?? resolvedUser.email ?? user.username ?? user.email ?? "";
  const accessToken = user.token ?? user.accessToken ?? user.jwt ?? user.jwtToken ?? "";
  const id = resolvedUser.id ?? resolvedUser.userId ?? user.id ?? user.userId ?? idFromJwt(accessToken);
  const roles = normalizeRoles(resolveRoles(user, accessToken));

  return {
    user: {
      id: String(id),
      username,
      roles,
    },
    tokens: {
      accessToken,
      refreshToken: user.refreshToken ?? "",
      expiresIn: user.expiresIn ?? 3600,
    },
  };
}

function withHeaderToken(user: AuthApiUser, authorizationHeader?: string): AuthApiUser {
  if (user.token || user.accessToken || user.jwt || user.jwtToken || !authorizationHeader) {
    return user;
  }

  return {
    ...user,
    accessToken: authorizationHeader.replace(/^Bearer\s+/i, ""),
  };
}

function normalizeRoles(roles: string[] = []): string[] {
  return roles.map((role) => role.startsWith("ROLE_") ? role : `ROLE_${role}`);
}

function resolveRoles(user: AuthApiUser, token: string): string[] {
  if (Array.isArray(user.user?.roles) && user.user.roles.length > 0) return user.user.roles;
  if (user.user?.role) return [user.user.role];
  if (Array.isArray(user.roles) && user.roles.length > 0) return user.roles;
  if (user.role) return [user.role];

  const jwtRoles = rolesFromJwt(token);
  if (jwtRoles.length > 0) return jwtRoles;

  return ["ROLE_NUTRITIONIST"];
}

function rolesFromJwt(token: string): string[] {
  const decodedPayload = decodeJwtPayload(token);
  if (!decodedPayload) return [];

  if (typeof decodedPayload.role === "string") return [decodedPayload.role];
  if (Array.isArray(decodedPayload.roles)) return decodedPayload.roles;
  if (Array.isArray(decodedPayload.authorities)) {
    return decodedPayload.authorities
      .map((authority) => {
        if (typeof authority === "string") return authority;
        return authority.authority ?? authority.name ?? "";
      })
      .filter(Boolean);
  }
  if (typeof decodedPayload.scope === "string") return decodedPayload.scope.split(" ");

  return [];
}

function mergeSessionUser(session: AuthSession, user: User): AuthSession {
  return {
    ...session,
    user: {
      ...session.user,
      id: user.id ? String(user.id) : session.user.id,
      username: user.username || session.user.username,
      roles: user.roles?.length ? user.roles : session.user.roles,
    },
  };
}

export class HttpAuthRepository implements AuthRepository {
  async signIn(input: SignInInput): Promise<AuthSession> {
    if (API_BASE_URL.includes("localhost:3001")) {
      return this._signInWithJsonServer(input);
    }

    try {
      const { data, headers } = await authApi.post<AuthApiUser>("/sign-in", {
        username: input.username,
        password: input.password,
      });

      let session = toSession(withHeaderToken(data, headers.authorization));
      if (!session.user.id) {
        const currentUser = await this._getCurrentUserWithToken(session.tokens.accessToken);
        if (currentUser) {
          session = mergeSessionUser(session, currentUser);
        }
      }
      this._persistTokens(session);
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

    return this._getCurrentUserWithToken(token);
  }

  private async _getCurrentUserWithToken(token: string): Promise<User | null> {
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
