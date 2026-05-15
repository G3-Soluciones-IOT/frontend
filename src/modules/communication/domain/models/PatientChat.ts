export type PatientConnectionStatus = "ONLINE" | "AWAY" | "OFFLINE";
export type ChatMessageAuthor = "NUTRITIONIST" | "PATIENT";
export type ChatMessageStatus = "SENT" | "DELIVERED" | "READ";

export interface ChatPatient {
  id: string;
  name: string;
  initials: string;
  avatarTone: "photo" | "green" | "blue";
  connectionStatus: PatientConnectionStatus;
  connectionLabel: string;
  recordPath: string;
  statsPath: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  sizeLabel: string;
  type: string;
}

export interface ChatMessage {
  id: string;
  author: ChatMessageAuthor;
  text: string;
  time: string;
  status?: ChatMessageStatus;
  attachments?: ChatAttachment[];
}

export interface PatientChat {
  id: string;
  patient: ChatPatient;
  preview: string;
  lastActivityLabel: string;
  messages: ChatMessage[];
}
