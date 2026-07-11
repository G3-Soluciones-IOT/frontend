import { API_BASE_URL } from "@/app/config/env";

type StompHeaders = Record<string, string>;

type StompSubscription = {
  unsubscribe: () => void;
};

type PendingReceipt = {
  destination: string;
  body: string;
  headers?: StompHeaders;
};

type ActiveSubscription = {
  destination: string;
  handler: StompMessageHandler;
};

export type StompMessageHandler = (body: string, headers: StompHeaders) => void;
export type StompErrorHandler = (message: string, headers: StompHeaders) => void;

function createWsUrl(path: string) {
  const wsBaseUrl = (import.meta.env.VITE_WS_BASE_URL as string | undefined) ?? API_BASE_URL;
  const apiBase = new URL(wsBaseUrl);
  const base = new URL(path, apiBase);
  base.protocol = apiBase.protocol === "https:" ? "wss:" : "ws:";
  return base.toString();
}

function encodeFrame(command: string, headers: StompHeaders = {}, body = "") {
  const headerLines = Object.entries(headers).map(([key, value]) => `${key}:${value}`);
  return `${command}\n${headerLines.join("\n")}\n\n${body}\0`;
}

function parseHeaders(lines: string[]) {
  return lines.reduce<StompHeaders>((headers, line) => {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex < 0) return headers;
    headers[line.slice(0, separatorIndex)] = line.slice(separatorIndex + 1);
    return headers;
  }, {});
}

export class StompClient {
  private socket: WebSocket | null = null;
  private connected = false;
  private shouldReconnect = true;
  private subscriptionId = 0;
  private reconnectTimer = 0;
  private readonly subscriptions = new Map<string, ActiveSubscription>();
  private readonly pendingReceipts: PendingReceipt[] = [];
  private readonly path: string;

  constructor(path = (import.meta.env.VITE_WS_PATH as string | undefined) ?? "/ws/websocket") {
    this.path = path;
  }

  connect(
    onStatusChange?: (status: "CONNECTING" | "CONNECTED" | "DISCONNECTED") => void,
    onError?: StompErrorHandler,
  ) {
    if (this.socket?.readyState === WebSocket.CONNECTING || this.socket?.readyState === WebSocket.OPEN) return;

    this.shouldReconnect = true;
    onStatusChange?.("CONNECTING");
    const socket = new WebSocket(createWsUrl(this.path));
    this.socket = socket;

    socket.onopen = () => {
      const token = localStorage.getItem("accessToken");
      socket.send(encodeFrame("CONNECT", {
        "accept-version": "1.2",
        "heart-beat": "10000,10000",
        ...(token ? { Authorization: `Bearer ${token}`, authorization: `Bearer ${token}` } : {}),
      }));
    };

    socket.onmessage = (event) => this.handleFrames(String(event.data), onStatusChange, onError);

    socket.onclose = () => {
      this.connected = false;
      onStatusChange?.("DISCONNECTED");
      window.clearTimeout(this.reconnectTimer);
      if (this.shouldReconnect) {
        this.reconnectTimer = window.setTimeout(() => this.connect(onStatusChange, onError), 3000);
      }
    };

    socket.onerror = () => {
      onStatusChange?.("DISCONNECTED");
    };
  }

  disconnect() {
    this.shouldReconnect = false;
    window.clearTimeout(this.reconnectTimer);
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(encodeFrame("DISCONNECT"));
      this.socket.close();
    }
    this.connected = false;
    this.socket = null;
  }

  subscribe(destination: string, handler: StompMessageHandler): StompSubscription {
    const id = `sub-${++this.subscriptionId}`;
    this.subscriptions.set(id, { destination, handler });

    if (this.connected) {
      this.socket?.send(encodeFrame("SUBSCRIBE", { id, destination }));
    }

    return {
      unsubscribe: () => {
        this.subscriptions.delete(id);
        if (this.connected) this.socket?.send(encodeFrame("UNSUBSCRIBE", { id }));
      },
    };
  }

  isConnected() {
    return this.connected;
  }

  send(destination: string, body: string, headers?: StompHeaders) {
    const receipt = { destination, body, headers };

    if (!this.connected) {
      this.pendingReceipts.push(receipt);
      return false;
    }

    this.socket?.send(encodeFrame("SEND", {
      destination,
      "content-type": "application/json",
      ...(headers ?? {}),
    }, body));
    return true;
  }

  private handleFrames(
    rawData: string,
    onStatusChange?: (status: "CONNECTING" | "CONNECTED" | "DISCONNECTED") => void,
    onError?: StompErrorHandler,
  ) {
    rawData
      .split("\0")
      .filter(Boolean)
      .forEach((rawFrame) => {
        const [head = "", body = ""] = rawFrame.split("\n\n");
        const [command = "", ...headerLines] = head.split("\n").filter(Boolean);
        const headers = parseHeaders(headerLines);

        if (command === "CONNECTED") {
          this.connected = true;
          onStatusChange?.("CONNECTED");
          this.flushSubscriptions();
          this.flushMessages();
          return;
        }

        if (command === "MESSAGE") {
          const subscriptionId = headers.subscription;
          const subscription = subscriptionId ? this.subscriptions.get(subscriptionId) : undefined;
          subscription?.handler(body, headers);
        }

        if (command === "ERROR") {
          onError?.(body || headers.message || "Error STOMP del servidor.", headers);
        }
      });
  }

  private flushSubscriptions() {
    this.subscriptions.forEach(({ destination }, id) => {
      this.socket?.send(encodeFrame("SUBSCRIBE", { id, destination }));
    });
  }

  private flushMessages() {
    this.pendingReceipts.splice(0).forEach(({ destination, body, headers }) => this.send(destination, body, headers));
  }
}
