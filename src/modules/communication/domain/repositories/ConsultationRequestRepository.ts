import type { ListConsultationRequestsInput } from "../../application/dto/ListConsultationRequestsInput";
import type { ConsultationRequest, ConsultationRequestStatus } from "../models/ConsultationRequest";

export interface ConsultationRequestRepository {
  list(input?: ListConsultationRequestsInput): Promise<ConsultationRequest[]>;
  updateStatus(id: string, status: ConsultationRequestStatus): Promise<ConsultationRequest>;
}
