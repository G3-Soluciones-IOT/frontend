import type { TipRepository } from "../../domain/repositories/TipRepository";
import type { ListTipsInput } from "../dto/ListTipsInput";

export const getListTipsUseCase =
  (repository: TipRepository) =>
  async (input?: ListTipsInput) => {
    return repository.list(input);
  };

