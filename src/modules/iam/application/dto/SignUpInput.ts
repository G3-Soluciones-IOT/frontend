import type { UserRole } from "../../domain/models/User";

export interface SignUpInput {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
}