import type { TipRepository } from "../../domain/repositories/TipRepository";
import type { UpdateTipInput } from "../dto/UpdateTipInput";

export const updateTipUseCase =
  (repository: TipRepository) =>
  async (id: number, input: UpdateTipInput) => {
    return repository.update(id, input);
  };

