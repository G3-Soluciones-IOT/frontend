// Domain
export type { User, AuthSession, AuthTokens, UserRole } from "./domain/models/User";
export { AuthDomainError, InvalidCredentialsError, EmailAlreadyInUseError } from "./domain/errors/AuthDomainError";
export type { AuthRepository } from "./domain/repositories/AuthRepository";

// Application DTOs
export type { SignInInput } from "./application/dto/SignInInput";
export type { SignUpInput } from "./application/dto/SignUpInput";

// Infrastructure
export { HttpAuthRepository } from "./infrastructure/repositories/HttpAuthRepository";

// Presentation
export { SignInPage } from "./presentation/pages/SignInPage";
export { SignUpPage } from "./presentation/pages/SignUpPage";
export { useSignIn } from "./presentation/hooks/useSignIn";
export { useSignUp } from "./presentation/hooks/useSignUp";