// Domain
export type {
  ConsultationPatient,
  ConsultationRequest,
  ConsultationRequestStatus,
} from "./domain/models/ConsultationRequest";
export type {
  ChatAttachment,
  ChatMessage,
  ChatMessageAuthor,
  ChatMessageStatus,
  ChatPatient,
  PatientChat,
  PatientConnectionStatus,
} from "./domain/models/PatientChat";
export type { ConsultationRequestRepository } from "./domain/repositories/ConsultationRequestRepository";

// Application DTOs
export type { ListConsultationRequestsInput } from "./application/dto/ListConsultationRequestsInput";

// Infrastructure
export { HttpConsultationRequestRepository } from "./infrastructure/repositories/HttpConsultationRequestRepository";

// Presentation
export { ChatPage } from "./presentation/pages/ChatPage";
export { ConsultationsPage } from "./presentation/pages/ConsultationsPage";
export { RecommendationsPage } from "./presentation/pages/RecommendationsPage";
export { useConsultationRequests } from "./presentation/hooks/useConsultationRequests";
export { usePatientChats } from "./presentation/hooks/usePatientChats";

