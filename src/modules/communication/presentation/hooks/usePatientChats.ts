import { useMemo, useState } from "react";
import type { ChatAttachment, ChatMessage, ChatPatient, PatientChat } from "../../domain/models/PatientChat";
import { availableChatPatients, demoIncomingMessage, demoOutgoingMessage, mockPatientChats } from "../../infrastructure/mock/patientChats.mock";

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function toPreview(message: ChatMessage) {
  if (message.attachments?.length) return `Evidence attached: ${message.attachments[0].name}`;
  return message.text;
}

export function usePatientChats() {
  const [chats, setChats] = useState<PatientChat[]>(mockPatientChats);
  const [activeChatId, setActiveChatId] = useState(mockPatientChats[0]?.id ?? "");
  const [draft, setDraft] = useState(demoOutgoingMessage);
  const [typingChatIds, setTypingChatIds] = useState<string[]>([]);
  const [demoReplyChatIds, setDemoReplyChatIds] = useState<string[]>([]);

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) ?? chats[0],
    [activeChatId, chats],
  );

  const createChat = () => {
    const nextPatient = availableChatPatients.find(
      (patient) => !chats.some((chat) => chat.patient.id === patient.id),
    );

    if (!nextPatient) return;

    const nextChat: PatientChat = {
      id: `chat-${nextPatient.id}`,
      patient: nextPatient as ChatPatient,
      preview: "New conversation",
      lastActivityLabel: "Now",
      messages: [],
    };

    setChats((current) => [nextChat, ...current]);
    setActiveChatId(nextChat.id);
    setDraft(demoOutgoingMessage);
  };

  const deleteChat = (chatId: string) => {
    setChats((current) => {
      const nextChats = current.filter((chat) => chat.id !== chatId);
      if (activeChatId === chatId) setActiveChatId(nextChats[0]?.id ?? "");
      return nextChats;
    });
  };

  const appendMessage = (chatId: string, message: ChatMessage) => {
    setChats((current) =>
      current.map((chat) => {
        if (chat.id !== chatId) return chat;
        return {
          ...chat,
          messages: [...chat.messages, message],
          preview: toPreview(message),
          lastActivityLabel: "Now",
        };
      }),
    );
  };

  const sendMessage = (chatId: string, text: string) => {
    const trimmedText = text.trim() || demoOutgoingMessage;
    appendMessage(chatId, {
      id: `message-nutritionist-${Date.now()}`,
      author: "NUTRITIONIST",
      text: trimmedText,
      time: "Now",
      status: "SENT",
    });
    setDraft("");

    if (!demoReplyChatIds.includes(chatId)) {
      setTypingChatIds((current) => [...current, chatId]);
      window.setTimeout(() => {
        appendMessage(chatId, {
          id: `message-patient-${Date.now()}`,
          author: "PATIENT",
          text: demoIncomingMessage,
          time: "Now",
        });
        setTypingChatIds((current) => current.filter((id) => id !== chatId));
        setDemoReplyChatIds((current) => [...current, chatId]);
      }, 1800);
    }
  };

  const attachEvidence = (chatId: string, file: File) => {
    const attachment: ChatAttachment = {
      id: `attachment-${Date.now()}`,
      name: file.name,
      sizeLabel: formatFileSize(file.size),
      type: file.type || "application/octet-stream",
    };

    appendMessage(chatId, {
      id: `message-attachment-${Date.now()}`,
      author: "NUTRITIONIST",
      text: "Evidencia adjunta",
      time: "Now",
      status: "SENT",
      attachments: [attachment],
    });
  };

  return {
    chats,
    activeChat,
    activeChatId,
    draft,
    isPatientTyping: activeChat ? typingChatIds.includes(activeChat.id) : false,
    canCreateChat: availableChatPatients.some((patient) => !chats.some((chat) => chat.patient.id === patient.id)),
    setDraft,
    selectChat: setActiveChatId,
    createChat,
    deleteChat,
    sendMessage,
    attachEvidence,
  };
}
