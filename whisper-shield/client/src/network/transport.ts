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

  private ws: WebSocket | null = null;
  private currentUserId: string | null = null;
  private messageHandlers: Set<InboundMessageHandler> = new Set();
  private receiptHandlers: Set<DeliveryReceiptHandler> = new Set();
  private presenceHandlers: Set<PresenceUpdateHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
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

  // --- WebSocket Real-Time Blind Routing ---

  public connect(userId: string): void {
    this.currentUserId = userId;
    this.isExplicitlyClosed = false;

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    const wsEndpoint = `${TransportEngine.wsUrl}?userId=${encodeURIComponent(userId)}`;
    this.ws = new WebSocket(wsEndpoint);

    this.ws.onopen = () => {
      // Send ping to keep connection warm
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    };

    this.ws.onmessage = (event) => {
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

    this.ws.onclose = () => {
      if (!this.isExplicitlyClosed) {
        // Attempt automatic reconnection every 2.5 seconds
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          if (this.currentUserId && !this.isExplicitlyClosed) {
            this.connect(this.currentUserId);
          }
        }, 2500);
      }
    };

    this.ws.onerror = (err) => {
      console.warn('Transport WebSocket error:', err);
    };
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public sendEnvelope(recipientId: string, envelope: EncryptedMessageEnvelope): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    this.ws.send(
      JSON.stringify({
        type: 'message',
        senderId: this.currentUserId,
        recipientId,
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

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

