export type ConsultationRequestStatus = "REQUESTED" | "CONFIRMED" | "REJECTED" | "CANCELLED" | "COMPLETED";

export interface ConsultationPatient {
  id: string;
  userId: number;
  name: string;
  initials: string;
}

export interface ConsultationRequest {
  id: string;
  numericId: number;
  nutritionistPatientId: number;
  patient: ConsultationPatient;
  reason: string;
  description: string;
  requestedDateLabel: string;
  requestedTimeRange: string;
  durationMinutes: number;
  meetingUrl?: string;
  notes?: string;
  status: ConsultationRequestStatus;
}
