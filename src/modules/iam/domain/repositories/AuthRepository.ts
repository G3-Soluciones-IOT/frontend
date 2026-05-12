import type { AuthSession, User } from "../models/User";
import type { SignInInput } from "../../application/dto/SignInInput";
import type { SignUpInput } from "../../application/dto/SignUpInput";

export interface AuthRepository {
  signIn(input: SignInInput): Promise<AuthSession>;
  signUp(input: SignUpInput): Promise<AuthSession>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  refreshToken(refreshToken: string): Promise<AuthSession>;
}