import type { TipRepository } from "../../domain/repositories/TipRepository";
import type { CreateTipInput } from "../dto/CreateTipInput";

export const createTipUseCase =
  (repository: TipRepository) =>
  async (input: CreateTipInput) => {
    return repository.create(input);
  };

