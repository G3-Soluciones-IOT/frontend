import type { ConsultationRequestStatus } from "../../domain/models/ConsultationRequest";

export interface ListConsultationRequestsInput {
  status?: ConsultationRequestStatus;
}
