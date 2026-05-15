import type { ListConsultationRequestsInput } from "../../application/dto/ListConsultationRequestsInput";
import type { ConsultationRequest, ConsultationRequestStatus } from "../../domain/models/ConsultationRequest";
import type { ConsultationRequestRepository } from "../../domain/repositories/ConsultationRequestRepository";
import { communicationApi } from "../api/communication.api";

function buildListParams(input?: ListConsultationRequestsInput) {
  if (!input?.status) return undefined;
  return { status: input.status };
}

export class HttpConsultationRequestRepository implements ConsultationRequestRepository {
  async list(input?: ListConsultationRequestsInput): Promise<ConsultationRequest[]> {
    const { data } = await communicationApi.get<ConsultationRequest[]>("/consultations", {
      params: buildListParams(input),
    });
    return data;
  }

  async updateStatus(id: string, status: ConsultationRequestStatus): Promise<ConsultationRequest> {
    const { data } = await communicationApi.patch<ConsultationRequest>(`/consultations/${id}`, {
      status,
    });
    return data;
  }
}
