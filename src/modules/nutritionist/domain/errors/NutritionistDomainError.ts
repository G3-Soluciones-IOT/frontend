export class NutritionistDomainError extends Error {
   public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "NutritionistDomainError";
    this.code = code;
  }
}

export class MaxSpecialtiesReachedError extends NutritionistDomainError {
  constructor() {
    super("You can select up to 5 specialties.", "MAX_SPECIALTIES_REACHED");
  }
}

export class BioTooLongError extends NutritionistDomainError {
  constructor() {
    super("Bio cannot exceed 500 characters.", "BIO_TOO_LONG");
  }
}