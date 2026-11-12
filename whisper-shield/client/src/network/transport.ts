import type { PreKeyBundle, EncryptedMessageEnvelope } from '../types/crypto';

export interface PeerUserInfo {
  userId: string;
  identityKey: string;
  remainingOPKs: number;
  isOnline: boolean;
}

export type InboundMessageHandler = (data: {
  senderId: string;
  recipientId: string;
  envelope: EncryptedMessageEnvelope;
  timestamp: number;
  wasQueuedOffline?: boolean;
}) => void;

export type DeliveryReceiptHandler = (data: {
  recipientId: string;
  status: 'delivered' | 'queued_offline';
  timestamp: number;
}) => void;

export type PresenceUpdateHandler = (data: {
  userId: string;
  isOnline: boolean;
}) => void;

export type StatusChangeHandler = (isConnected: boolean) => void;

export class TransportEngine {
  private static get apiUrl(): string {
    if (typeof window !== 'undefined') {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!isLocal) {
        return `${window.location.protocol}//${window.location.host}/api`;
      }
    }
    return 'http://localhost:8080/api';
  }

  private static get wsUrl(): string {
    if (typeof window !== 'undefined') {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (!isLocal) {
        const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${wsProto}//${window.location.host}`;
      }
    }
    return 'ws://localhost:8080';
  }

  public static getApiUrl(): string {
    return this.apiUrl;
  }

  public static getWsUrl(): string {
    return this.wsUrl;
  }

  public static async fetchHealth(): Promise<{ status: string; uptime: number } | null> {
    try {
      const res = await fetch(`${this.apiUrl}/health`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  private ws: WebSocket | null = null;
  private currentUserId: string | null = null;
  private messageHandlers: Set<InboundMessageHandler> = new Set();
  private receiptHandlers: Set<DeliveryReceiptHandler> = new Set();
  private presenceHandlers: Set<PresenceUpdateHandler> = new Set();
  private statusHandlers: Set<StatusChangeHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private isExplicitlyClosed: boolean = false;

  // --- REST Key Directory APIs ---

  public static async registerPreKeyBundle(bundle: PreKeyBundle): Promise<void> {
    const res = await fetch(`${this.apiUrl}/keys/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bundle)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(err.error || `Registration failed with status ${res.status}`);
    }
  }

  public static async fetchPreKeyBundle(userId: string): Promise<PreKeyBundle> {
    const res = await fetch(`${this.apiUrl}/keys/${encodeURIComponent(userId)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Bundle retrieval failed' }));
      throw new Error(err.error || `Bundle retrieval failed with status ${res.status}`);
    }
    return res.json();
  }

  public static async refillPreKeys(userId: string, oneTimePreKeys: string[]): Promise<number> {
    const res = await fetch(`${this.apiUrl}/keys/refill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, oneTimePreKeys })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Refill failed' }));
      throw new Error(err.error || `Refill failed with status ${res.status}`);
    }
    const data = await res.json();
    return data.remainingOPKs;
  }

  public static async fetchRegisteredUsers(): Promise<PeerUserInfo[]> {
    const res = await fetch(`${this.apiUrl}/users`);
    if (!res.ok) {
      return [];
    }
    return res.json();
  }

  public static async sendMessageHttp(
    senderId: string,
    recipientId: string,
    encryptedEnvelope: EncryptedMessageEnvelope
  ): Promise<{ status: 'delivered' | 'queued_offline'; timestamp: number }> {
    const res = await fetch(`${this.apiUrl}/messages/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: senderId.trim().toLowerCase(),
        recipientId: recipientId.trim().toLowerCase(),
        encryptedEnvelope,
        timestamp: Date.now()
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'HTTP relay delivery failed' }));
      throw new Error(err.error || `HTTP relay delivery failed with status ${res.status}`);
    }
    return res.json();
  }

  // --- WebSocket Real-Time Blind Routing ---

  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private notifyStatus(connected: boolean): void {
    for (const handler of this.statusHandlers) {
      handler(connected);
    }
  }

  public connect(userId: string): void {
    const normalizedId = userId.trim().toLowerCase();
    this.currentUserId = normalizedId;
    this.isExplicitlyClosed = false;
    this.clearTimers();

    if (this.ws) {
      const stale = this.ws;
      this.ws = null;
      stale.close();
    }

    const wsEndpoint = `${TransportEngine.wsUrl}?userId=${encodeURIComponent(normalizedId)}`;
    const socket = new WebSocket(wsEndpoint);
    this.ws = socket;

    socket.onopen = () => {
      if (this.ws !== socket) return;
      this.notifyStatus(true);
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'ping' }));
      }
      if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = setInterval(() => {
        if (this.ws === socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }));
        }
      }, 20000);
    };

    socket.onmessage = (event) => {
      if (this.ws !== socket) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'message' && data.encryptedEnvelope) {
          for (const handler of this.messageHandlers) {
            handler({
              senderId: data.senderId,
              recipientId: data.recipientId,
              envelope: data.encryptedEnvelope,
              timestamp: data.timestamp || Date.now(),
              wasQueuedOffline: data.wasQueuedOffline
            });
          }
        } else if (data.type === 'receipt') {
          for (const handler of this.receiptHandlers) {
            handler({
              recipientId: data.recipientId,
              status: data.status,
              timestamp: data.timestamp
            });
          }
        } else if (data.type === 'user_status') {
          for (const handler of this.presenceHandlers) {
            handler({
              userId: data.userId,
              isOnline: data.isOnline
            });
          }
        }
      } catch (e) {
        console.error('Error handling WebSocket message frame:', e);
      }
    };

    socket.onclose = () => {
      if (this.ws !== socket) return;
      this.clearTimers();
      this.notifyStatus(false);
      if (!this.isExplicitlyClosed) {
        this.reconnectTimer = setTimeout(() => {
          if (this.currentUserId && !this.isExplicitlyClosed) {
            this.connect(this.currentUserId);
          }
        }, 1500);
      }
    };

    socket.onerror = (err) => {
      if (this.ws !== socket) return;
      console.warn('Transport WebSocket error:', err);
    };
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    this.clearTimers();
    if (this.ws) {
      const active = this.ws;
      this.ws = null;
      active.close();
    }
    this.notifyStatus(false);
  }

  public sendEnvelope(recipientId: string, envelope: EncryptedMessageEnvelope): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    this.ws.send(
      JSON.stringify({
        type: 'message',
        senderId: this.currentUserId,
        recipientId: recipientId.trim().toLowerCase(),
        encryptedEnvelope: envelope,
        timestamp: Date.now()
      })
    );
    return true;
  }

  public onMessage(handler: InboundMessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  public onReceipt(handler: DeliveryReceiptHandler): () => void {
    this.receiptHandlers.add(handler);
    return () => this.receiptHandlers.delete(handler);
  }

  public onPresence(handler: PresenceUpdateHandler): () => void {
    this.presenceHandlers.add(handler);
    return () => this.presenceHandlers.delete(handler);
  }

  public onStatusChange(handler: StatusChangeHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

