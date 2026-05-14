import type { TipRepository } from "../../domain/repositories/TipRepository";

export const getTipByIdUseCase =
  (repository: TipRepository) =>
  async (id: number) => {
    return repository.getById(id);
  };

