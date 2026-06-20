export type UserRole = "ROLE_PATIENT" | "ROLE_NUTRITIONIST" | "ROLE_ADMIN";

export interface User {
  id: string;
  username: string;
  roles: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthSession {
  user: User;
  tokens: AuthTokens;
}
