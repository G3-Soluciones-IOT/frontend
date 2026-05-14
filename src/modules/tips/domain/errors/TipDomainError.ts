export class TipDomainError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "TipDomainError";
    this.code = code;
  }
}

export class TipNotFoundError extends TipDomainError {
  constructor(id?: number) {
    super(
      id === undefined ? "Tip not found." : `Tip with id ${id} not found.`,
      "TIP_NOT_FOUND"
    );
  }
}

export class InvalidTipError extends TipDomainError {
  constructor(message = "Tip data is invalid.") {
    super(message, "INVALID_TIP");
  }
}

