import type { UserRole } from "../../domain/models/User";

export interface SignUpInput {
  username: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}