import type { ConsultationRequest, ConsultationRequestStatus } from "../../domain/models/ConsultationRequest";
import type { ConsultationRequestRepository } from "../../domain/repositories/ConsultationRequestRepository";

export function updateConsultationRequestStatusUseCase(repository: ConsultationRequestRepository) {
  return (id: string, status: ConsultationRequestStatus): Promise<ConsultationRequest> => {
    return repository.updateStatus(id, status);
  };
}
