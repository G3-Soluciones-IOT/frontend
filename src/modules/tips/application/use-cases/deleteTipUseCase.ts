import type { TipRepository } from "../../domain/repositories/TipRepository";

export const deleteTipUseCase =
  (repository: TipRepository) =>
  async (id: number) => {
    return repository.delete(id);
  };

