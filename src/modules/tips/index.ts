// Domain
export type { Tip, TipResource, TipStatus } from "./domain/models/Tip";
export {
  TipDomainError,
  TipNotFoundError,
  InvalidTipError,
} from "./domain/errors/TipDomainError";
export type { TipRepository } from "./domain/repositories/TipRepository";

// Application DTOs
export type { ListTipsInput } from "./application/dto/ListTipsInput";
export type { CreateTipInput } from "./application/dto/CreateTipInput";
export type { UpdateTipInput } from "./application/dto/UpdateTipInput";

// Application use cases
export { getListTipsUseCase } from "./application/use-cases/getListTipsUseCase";
export { getTipByIdUseCase } from "./application/use-cases/getTipByIdUseCase";
export { createTipUseCase } from "./application/use-cases/createTipUseCase";
export { updateTipUseCase } from "./application/use-cases/updateTipUseCase";
export { deleteTipUseCase } from "./application/use-cases/deleteTipUseCase";

// Infrastructure
export { tipsApi } from "./infrastructure/api/tips.api";
export { HttpTipRepository } from "./infrastructure/repositories/HttpTipRepository";

// Presentation
export { TipsPage } from "./presentation/pages/TipsPage";
export { useTips } from "./presentation/hooks/useTips";

