import { useEffect, useMemo, useRef, useState } from "react";
import { getStoredNutritionistProfile } from "@/modules/nutritionist/infrastructure/storage/nutritionistProfileStorage";
import { getAuthSession } from "@/shared/utils/authSession";
import type { ChatAttachment, ChatMessage, ChatPatient, PatientChat, PatientConnectionStatus } from "../../domain/models/PatientChat";
import {
  chatApi,
  type ChatMessageResource,
  type ChatNotificationResource,
  type ChatUserResource,
  type ChatValidateResource,
  type ChatUserExistsResource,
} from "../../infrastructure/api/chat.api";
import { StompClient } from "../../infrastructure/api/stompClient";

type ConnectionStatus = "CONNECTING" | "CONNECTED" | "DISCONNECTED";

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function toPreview(message: ChatMessage) {
  if (message.attachments?.length) return `Evidencia adjunta: ${message.attachments[0].name}`;
  return message.text;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatMessageTime(timestamp?: string | null) {
  if (!timestamp) return "Ahora";

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Ahora";

  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatLastActivity(messages: ChatMessage[]) {
  return messages.at(-1)?.time ?? "Nuevo";
}

function toConnectionStatus(status?: ChatUserResource["status"]): PatientConnectionStatus {
  return status === "ONLINE" ? "ONLINE" : "OFFLINE";
}

function toPatient(userId: number | string, onlineUser?: ChatUserResource): ChatPatient {
  const id = String(userId);
  const name = onlineUser?.fullName || onlineUser?.nickName || `Paciente #${id}`;
  const connectionStatus = toConnectionStatus(onlineUser?.status);

  return {
    id,
    userId: id,
    name,
    nickName: onlineUser?.nickName,
    initials: getInitials(name),
    avatarTone: connectionStatus === "ONLINE" ? "green" : "blue",
    connectionStatus,
    connectionLabel: connectionStatus === "ONLINE" ? "En linea ahora" : "No conectado",
    recordPath: `/nutritionist/patients/${id}`,
    statsPath: "/nutritionist/patients/tracking",
  };
}

function toChatMessage(message: ChatMessageResource, currentUserId: string): ChatMessage {
  return {
    id: message.id,
    author: String(message.senderId) === currentUserId ? "NUTRITIONIST" : "PATIENT",
    text: message.content,
    time: formatMessageTime(message.timestamp),
    status: String(message.senderId) === currentUserId ? "SENT" : undefined,
  };
}

function toResourceMessage(notification: ChatNotificationResource, currentUserId: string): ChatMessage {
  return {
    id: notification.id || `message-${Date.now()}`,
    author: String(notification.senderId) === currentUserId ? "NUTRITIONIST" : "PATIENT",
    text: notification.content,
    time: "Ahora",
    status: String(notification.senderId) === currentUserId ? "SENT" : undefined,
  };
}

function getCurrentUserIdentity() {
  const session = getAuthSession();
  const profile = getStoredNutritionistProfile(session?.user.id);
  const id = session?.user.id ?? "";
  const nickName = session?.user.username ?? "nutricionista@jameofit.com";
  const fullName = profile?.fullName || session?.user.username || "Nutricionista";

  return { id, nickName, fullName };
}

export function usePatientChats() {
  const [chats, setChats] = useState<PatientChat[]>([]);
  const [activeChatId, setActiveChatId] = useState("");
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("DISCONNECTED");
  const stompRef = useRef<StompClient | null>(null);
  const currentUser = useMemo(getCurrentUserIdentity, []);

  useEffect(() => {
    let isMounted = true;

    async function loadChats() {
      if (!currentUser.id) {
        setChats([]);
        setActiveChatId("");
        setErrorMessage("No se encontro una sesion activa para cargar el chat.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const [{ data: exists }, { data: contactIds }, { data: onlineUsers }] = await Promise.all([
          chatApi.get<ChatUserExistsResource>(`/api/v1/chat/users/${currentUser.id}/exists`),
          chatApi.get<number[]>(`/api/v1/chat/contacts/${currentUser.id}`),
          chatApi.get<ChatUserResource[]>("/users"),
        ]);

        if (!exists.exists) {
          throw new Error("El usuario actual no existe en el servicio de chat.");
        }

        const contactChats = await Promise.all(
          contactIds.map(async (contactId) => {
            const onlineUser = onlineUsers.find((user) => String(user.userId) === String(contactId));
            const [{ data: validation }, { data: messages }] = await Promise.all([
              chatApi.get<ChatValidateResource>("/api/v1/chat/validate", {
                params: { userId1: currentUser.id, userId2: contactId },
              }),
              chatApi.get<ChatMessageResource[]>(`/messages/${currentUser.id}/${contactId}`),
            ]);

            const mappedMessages = messages.map((message) => toChatMessage(message, currentUser.id));
            const patient = toPatient(contactId, onlineUser);

            return {
              id: `${currentUser.id}_${contactId}`,
              patient,
              preview: mappedMessages.at(-1)?.text ?? "Sin mensajes todavia",
              lastActivityLabel: formatLastActivity(mappedMessages),
              messages: mappedMessages,
              canChat: validation.canChat,
            } satisfies PatientChat;
          }),
        );

        if (!isMounted) return;
        setChats(contactChats);
        setActiveChatId(contactChats[0]?.id ?? "");
      } catch (error) {
        if (!isMounted) return;
        setChats([]);
        setActiveChatId("");
        setErrorMessage(error instanceof Error ? error.message : "No se pudo conectar con el chat.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadChats();

    return () => {
      isMounted = false;
    };
  }, [currentUser.id]);

  useEffect(() => {
    if (!currentUser.id) return;

    const client = new StompClient("/ws");
    stompRef.current = client;
    client.connect(setConnectionStatus);

    const messagesSubscription = client.subscribe("/user/queue/messages", (body) => {
      try {
        const notification = JSON.parse(body) as ChatNotificationResource;
        const contactId = String(notification.senderId) === currentUser.id ? String(notification.recipientId) : String(notification.senderId);
        const incomingMessage = toResourceMessage(notification, currentUser.id);

        setChats((current) =>
          current.map((chat) => {
            if (chat.patient.userId !== contactId) return chat;
            return {
              ...chat,
              messages: [...chat.messages, incomingMessage],
              preview: toPreview(incomingMessage),
              lastActivityLabel: "Ahora",
            };
          }),
        );
      } catch {
        setErrorMessage("Se recibio un mensaje de chat con formato no valido.");
      }
    });

    const usersSubscription = client.subscribe("/user/public", (body) => {
      try {
        const user = JSON.parse(body) as ChatUserResource;
        setChats((current) =>
          current.map((chat) => {
            if (chat.patient.userId !== String(user.userId)) return chat;
            const connectionStatus = toConnectionStatus(user.status);
            return {
              ...chat,
              patient: {
                ...chat.patient,
                name: user.fullName || chat.patient.name,
                nickName: user.nickName || chat.patient.nickName,
                connectionStatus,
                connectionLabel: connectionStatus === "ONLINE" ? "En linea ahora" : "No conectado",
              },
            };
          }),
        );
      } catch {
        setErrorMessage("Se recibio un estado de usuario con formato no valido.");
      }
    });

    client.send("/app/user.addUser", JSON.stringify({
      userId: Number(currentUser.id),
      nickName: currentUser.nickName,
      fullName: currentUser.fullName,
      status: "ONLINE",
    }));

    return () => {
      client.send("/app/user.disconnectUser", JSON.stringify({
        userId: Number(currentUser.id),
        nickName: currentUser.nickName,
        fullName: currentUser.fullName,
        status: "OFFLINE",
      }));
      messagesSubscription.unsubscribe();
      usersSubscription.unsubscribe();
      client.disconnect();
      stompRef.current = null;
    };
  }, [currentUser.fullName, currentUser.id, currentUser.nickName]);

  const filteredChats = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return chats;

    return chats.filter((chat) => {
      const fields = [chat.patient.name, chat.patient.nickName, chat.preview, chat.patient.userId].filter(Boolean);
      return fields.some((field) => String(field).toLowerCase().includes(normalizedQuery));
    });
  }, [chats, query]);

  const activeChat = useMemo(
    () => filteredChats.find((chat) => chat.id === activeChatId) ?? filteredChats[0] ?? chats[0],
    [activeChatId, chats, filteredChats],
  );

  const appendMessage = (chatId: string, message: ChatMessage) => {
    setChats((current) =>
      current.map((chat) => {
        if (chat.id !== chatId) return chat;
        return {
          ...chat,
          messages: [...chat.messages, message],
          preview: toPreview(message),
          lastActivityLabel: "Ahora",
        };
      }),
    );
  };

  const sendMessage = (chatId: string, text: string) => {
    const chat = chats.find((item) => item.id === chatId);
    const trimmedText = text.trim();
    if (!chat || !trimmedText || chat.canChat === false) return;

    const optimisticMessage: ChatMessage = {
      id: `message-local-${Date.now()}`,
      author: "NUTRITIONIST",
      text: trimmedText,
      time: "Ahora",
      status: "SENT",
    };

    appendMessage(chatId, optimisticMessage);
    setDraft("");

    stompRef.current?.send("/app/chat", JSON.stringify({
      senderId: currentUser.id,
      recipientId: chat.patient.userId,
      content: trimmedText,
    }));
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
      time: "Ahora",
      status: "SENT",
      attachments: [attachment],
    });
  };

  return {
    chats: filteredChats,
    activeChat,
    activeChatId: activeChat?.id ?? activeChatId,
    draft,
    query,
    isPatientTyping: false,
    canCreateChat: false,
    isLoading,
    errorMessage,
    connectionStatus,
    setDraft,
    setQuery,
    selectChat: setActiveChatId,
    createChat: () => undefined,
    deleteChat: (chatId: string) => {
      setChats((current) => current.filter((chat) => chat.id !== chatId));
    },
    sendMessage,
    attachEvidence,
  };
}
