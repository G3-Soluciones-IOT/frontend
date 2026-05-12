export class AuthDomainError extends Error {
    public readonly code: string;

  constructor(
    message: string, code: string,
  ) {
    super(message);
    this.name = "AuthDomainError";
    this.code = code;
  }
}

export class InvalidCredentialsError extends AuthDomainError {
  constructor() {
    super("Invalid email or password.", "INVALID_CREDENTIALS");
  }
}

export class EmailAlreadyInUseError extends AuthDomainError {
  constructor() {
    super("This email is already registered.", "EMAIL_ALREADY_IN_USE");
  }
}

export class UnauthorizedError extends AuthDomainError {
  constructor() {
    super("You are not authorized to perform this action.", "UNAUTHORIZED");
  }
}