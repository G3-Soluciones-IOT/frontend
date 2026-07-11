import { useEffect, useMemo, useRef, useState } from "react";
import { apiUrl } from "@/app/config/env";
import { getStoredNutritionistProfile } from "@/modules/nutritionist/infrastructure/storage/nutritionistProfileStorage";
import { getAuthSession } from "@/shared/utils/authSession";
import type { ChatAttachment, ChatMessage, ChatPatient, PatientChat, PatientConnectionStatus } from "../../domain/models/PatientChat";
import {
  type ChatNotificationResource,
  type ChatUserResource,
} from "../../infrastructure/api/chat.api";
import { StompClient } from "../../infrastructure/api/stompClient";

const CHAT_SEND_DESTINATION = (import.meta.env.VITE_STOMP_CHAT_SEND_DESTINATION as string | undefined) ?? "/app/chat.sendMessage";
const CHAT_SEND_REST_PATH = import.meta.env.VITE_CHAT_SEND_REST_PATH as string | undefined;
const CHAT_SEND_DESTINATIONS = Array.from(
  new Set([
    CHAT_SEND_DESTINATION,
    "/app/chat",
    "/app/chat.send",
    "/app/chat/message",
    "/app/chat.private",
    "/app/sendMessage",
  ].filter(Boolean)),
);

interface ChatContactResource {
  contactUserId: number | string;
  relationshipId: number | string;
  role: "NUTRITIONIST" | "PATIENT";
  displayName?: string | null;
  username?: string | null;
  profilePictureUrl?: string | null;
  accepted?: boolean;
}

interface ChatConversationMessageResource {
  id?: number | string;
  senderId?: number | string;
  senderUserId?: number | string;
  recipientId?: number | string;
  recipientUserId?: number | string;
  content?: string;
  message?: string;
  text?: string;
  timestamp?: string | null;
  sentAt?: string | null;
  createdAt?: string | null;
}

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

function toConnectionStatus(status?: ChatUserResource["status"]): PatientConnectionStatus {
  return status === "ONLINE" ? "ONLINE" : "OFFLINE";
}

function toPatient(contact: ChatContactResource, onlineUser?: ChatUserResource): ChatPatient {
  const id = String(contact.contactUserId);
  const name = onlineUser?.fullName || contact.displayName || onlineUser?.nickName || contact.username || `Paciente #${id}`;
  const connectionStatus = toConnectionStatus(onlineUser?.status);

  return {
    id,
    userId: id,
    name,
    nickName: onlineUser?.nickName || contact.username || undefined,
    initials: getInitials(name),
    avatarTone: contact.profilePictureUrl ? "photo" : connectionStatus === "ONLINE" ? "green" : "blue",
    connectionStatus,
    connectionLabel: connectionStatus === "ONLINE" ? "En linea ahora" : "No conectado",
    recordPath: `/nutritionist/patients/${id}`,
    statsPath: "/nutritionist/patients/tracking",
  };
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("accessToken");
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
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

function formatMessageTime(timestamp?: string | null) {
  if (!timestamp) return "Ahora";

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Ahora";

  return new Intl.DateTimeFormat("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function messageTimestamp(message: ChatConversationMessageResource) {
  return message.timestamp ?? message.sentAt ?? message.createdAt ?? null;
}

function messageSenderId(message: ChatConversationMessageResource) {
  return message.senderUserId ?? message.senderId ?? "";
}

function messageContent(message: ChatConversationMessageResource) {
  return message.content ?? message.message ?? message.text ?? "";
}

function toChatMessage(message: ChatConversationMessageResource, currentUserId: string): ChatMessage {
  const senderId = messageSenderId(message);

  return {
    id: String(message.id ?? `message-${senderId}-${messageTimestamp(message) ?? Date.now()}`),
    author: String(senderId) === currentUserId ? "NUTRITIONIST" : "PATIENT",
    text: messageContent(message),
    time: formatMessageTime(messageTimestamp(message)),
    status: String(senderId) === currentUserId ? "SENT" : undefined,
  };
}

function messageMatches(message: ChatConversationMessageResource, currentUserId: string, contactUserId: string, text: string) {
  const senderId = String(messageSenderId(message));
  const recipientId = String(message.recipientUserId ?? message.recipientId ?? "");
  const sameText = messageContent(message).trim() === text.trim();

  return sameText && senderId === currentUserId && (!recipientId || recipientId === contactUserId);
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function getChatContacts() {
  const contacts = await fetchJson<ChatContactResource[]>("/api/v1/chat/me/contacts");
  return contacts.filter((contact) => contact.accepted !== false);
}

async function getConversationMessages(contactUserId: number | string) {
  return fetchJson<ChatConversationMessageResource[]>(
    `/api/v1/chat/conversations/${encodeURIComponent(String(contactUserId))}/messages?limit=50`,
  ).catch(() => []);
}

async function sendConversationMessage(contactUserId: number | string, content: string) {
  if (!CHAT_SEND_REST_PATH) return null;

  const path = CHAT_SEND_REST_PATH
    .replace(":contactUserId", encodeURIComponent(String(contactUserId)))
    .replace("{contactUserId}", encodeURIComponent(String(contactUserId)));

  return fetchJson<ChatConversationMessageResource>(
    path,
    {
      method: "POST",
      body: JSON.stringify({ content }),
    },
  );
}

async function getContactChat(currentUserId: string, contact: ChatContactResource): Promise<PatientChat> {
  const messages = (await getConversationMessages(contact.contactUserId)).map((message) => toChatMessage(message, currentUserId));
  const patient = toPatient(contact);
  const lastMessage = messages.at(-1);

  return {
    id: `${currentUserId}_${contact.contactUserId}`,
    patient,
    preview: lastMessage?.text || "Sin mensajes todavia",
    lastActivityLabel: lastMessage?.time ?? "Nuevo",
    messages,
    canChat: contact.accepted !== false,
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
        const contacts = await getChatContacts();
        const chatResults = await Promise.allSettled(
          contacts.map((contact) => getContactChat(currentUser.id, contact)),
        );
        const contactChats = chatResults.reduce<PatientChat[]>((items, result) => {
          if (result.status === "fulfilled") items.push(result.value);
          return items;
        }, []);

        if (!isMounted) return;
        setChats(contactChats);
        setActiveChatId(contactChats[0]?.id ?? "");
        setErrorMessage(contactChats.length === 0 ? "No hay pacientes aceptados para iniciar conversaciones." : "");
      } catch (error) {
        setChats([]);
        setActiveChatId("");
        setErrorMessage("No se pudieron cargar los contactos de chat.");
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

    const client = new StompClient();
    stompRef.current = client;
    client.connect(setConnectionStatus, (message) => {
      setErrorMessage(`Error STOMP: ${message}`);
    });

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

  const replaceMessage = (chatId: string, messageId: string, nextMessage: ChatMessage) => {
    setChats((current) =>
      current.map((chat) => {
        if (chat.id !== chatId) return chat;

        const messages = chat.messages.map((message) => (message.id === messageId ? nextMessage : message));
        return {
          ...chat,
          messages,
          preview: toPreview(nextMessage),
          lastActivityLabel: "Ahora",
        };
      }),
    );
  };

  const removeMessage = (chatId: string, messageId: string) => {
    setChats((current) =>
      current.map((chat) => {
        if (chat.id !== chatId) return chat;

        const messages = chat.messages.filter((message) => message.id !== messageId);
        const lastMessage = messages.at(-1);

        return {
          ...chat,
          messages,
          preview: lastMessage?.text ?? "Sin mensajes todavia",
          lastActivityLabel: lastMessage?.time ?? "Nuevo",
        };
      }),
    );
  };

  const sendMessage = async (chatId: string, text: string) => {
    const chat = chats.find((item) => item.id === chatId);
    const trimmedText = text.trim();
    if (!chat || !trimmedText || chat.canChat === false) return;
    if (!stompRef.current?.isConnected()) {
      setErrorMessage("El WebSocket aun no esta conectado. Espera a que indique WS conectado antes de enviar.");
      return;
    }

    const localMessageId = `message-local-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: localMessageId,
      author: "NUTRITIONIST",
      text: trimmedText,
      time: "Ahora",
      status: "SENT",
    };

    appendMessage(chatId, optimisticMessage);
    setDraft("");

    try {
      const savedMessage = await sendConversationMessage(chat.patient.userId, trimmedText);
      if (savedMessage) {
        replaceMessage(chatId, localMessageId, toChatMessage(savedMessage, currentUser.id));
      }
    } catch {
      setErrorMessage("No se pudo confirmar el guardado del mensaje por REST.");
    } finally {
      const payload = {
        senderId: currentUser.id,
        senderUserId: currentUser.id,
        recipientId: chat.patient.userId,
        recipientUserId: chat.patient.userId,
        receiverId: chat.patient.userId,
        receiverUserId: chat.patient.userId,
        contactUserId: chat.patient.userId,
        content: trimmedText,
        message: trimmedText,
        text: trimmedText,
      };

      void (async () => {
        for (const destination of CHAT_SEND_DESTINATIONS) {
          const sent = stompRef.current?.send(destination, JSON.stringify(payload));

          if (!sent) {
            removeMessage(chatId, localMessageId);
            setErrorMessage("No se pudo enviar el mensaje porque el WebSocket no esta conectado.");
            return;
          }

          await wait(900);

          const savedMessages = await getConversationMessages(chat.patient.userId);
          const savedMessage = savedMessages.find((message) =>
            messageMatches(message, currentUser.id, chat.patient.userId, trimmedText),
          );

          if (savedMessage) {
            replaceMessage(chatId, localMessageId, toChatMessage(savedMessage, currentUser.id));
            setErrorMessage("");
            return;
          }
        }

        removeMessage(chatId, localMessageId);
        setErrorMessage(`El servidor no guardo el mensaje. Se probaron estos destinos STOMP: ${CHAT_SEND_DESTINATIONS.join(", ")}.`);
      })();
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
