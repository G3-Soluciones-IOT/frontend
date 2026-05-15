export type ConsultationRequestStatus = "PENDING" | "CONFIRMED";

export interface ConsultationPatient {
  id: string;
  name: string;
  initials: string;
  avatarTone: "photo-woman" | "photo-man" | "blue";
}

export interface ConsultationRequest {
  id: string;
  patient: ConsultationPatient;
  reason: string;
  description: string;
  requestedDateLabel: string;
  requestedTimeRange: string;
  status: ConsultationRequestStatus;
}
