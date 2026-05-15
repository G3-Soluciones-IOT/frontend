import type { ListConsultationRequestsInput } from "../dto/ListConsultationRequestsInput";
import type { ConsultationRequest } from "../../domain/models/ConsultationRequest";
import type { ConsultationRequestRepository } from "../../domain/repositories/ConsultationRequestRepository";

export function getConsultationRequestsUseCase(repository: ConsultationRequestRepository) {
  return (input?: ListConsultationRequestsInput): Promise<ConsultationRequest[]> => {
    return repository.list(input);
  };
}
