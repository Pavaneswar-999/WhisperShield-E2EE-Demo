import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type {
  UserIdentity,
  StoredSession,
  OneTimePreKeyRecord,
  ChatMessage,
  SafetyNumberRecord
} from '../types/crypto';

interface WhisperShieldDB extends DBSchema {
  identities: {
    key: string;
    value: UserIdentity;
  };
  sessions: {
    key: string;
    value: StoredSession;
  };
  prekeys: {
    key: string;
    value: OneTimePreKeyRecord;
    indexes: { 'by-consumed': number };
  };
  messages: {
    key: string;
    value: ChatMessage;
    indexes: {
      'by-peer': string;
      'by-timestamp': number;
    };
  };
  safety_numbers: {
    key: string;
    value: SafetyNumberRecord;
  };
}

const DB_BASE_NAME = 'whisper_shield_storage';
const DB_VERSION = 1;

let currentScope: string = 'default';
const dbPromiseMap = new Map<string, Promise<IDBPDatabase<WhisperShieldDB>>>();

export function setStorageScope(userId: string): void {
  currentScope = userId.trim().toLowerCase();
}

export function getDatabase(): Promise<IDBPDatabase<WhisperShieldDB>> {
  const dbName = currentScope && currentScope !== 'default'
    ? `${DB_BASE_NAME}_${currentScope}`
    : DB_BASE_NAME;

  if (!dbPromiseMap.has(dbName)) {
    const promise = openDB<WhisperShieldDB>(dbName, DB_VERSION, {
      upgrade(db) {
        // 1. Identities store
        if (!db.objectStoreNames.contains('identities')) {
          db.createObjectStore('identities', { keyPath: 'userId' });
        }

        // 2. Double Ratchet Sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'peerId' });
        }

        // 3. One-Time PreKeys store
        if (!db.objectStoreNames.contains('prekeys')) {
          const prekeyStore = db.createObjectStore('prekeys', { keyPath: 'id' });
          prekeyStore.createIndex('by-consumed', 'consumed');
        }

        // 4. Messages store
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          messageStore.createIndex('by-peer', 'recipientId');
          messageStore.createIndex('by-timestamp', 'timestamp');
        }

        // 5. Safety Numbers store
        if (!db.objectStoreNames.contains('safety_numbers')) {
          db.createObjectStore('safety_numbers', { keyPath: 'peerId' });
        }
      }
    });
    dbPromiseMap.set(dbName, promise);
  }
  return dbPromiseMap.get(dbName)!;
}

export class StorageEngine {
  public static setScope(userId: string): void {
    setStorageScope(userId);
  }

  // Identity Management
  public static async saveIdentity(identity: UserIdentity): Promise<void> {
    const db = await getDatabase();
    await db.put('identities', identity);
  }

  public static async getIdentity(userId: string): Promise<UserIdentity | undefined> {
    const db = await getDatabase();
    return db.get('identities', userId);
  }

  public static async getAllIdentities(): Promise<UserIdentity[]> {
    const db = await getDatabase();
    return db.getAll('identities');
  }

  // Double Ratchet Session Management
  public static async saveSession(session: StoredSession): Promise<void> {
    const db = await getDatabase();
    await db.put('sessions', session);
  }

  public static async getSession(peerId: string): Promise<StoredSession | undefined> {
    const db = await getDatabase();
    return db.get('sessions', peerId);
  }

  public static async deleteSession(peerId: string): Promise<void> {
    const db = await getDatabase();
    await db.delete('sessions', peerId);
  }

  public static async getAllSessions(): Promise<StoredSession[]> {
    const db = await getDatabase();
    return db.getAll('sessions');
  }

  // One-Time PreKey Management
  public static async savePreKeys(records: OneTimePreKeyRecord[]): Promise<void> {
    const db = await getDatabase();
    const tx = db.transaction('prekeys', 'readwrite');
    for (const record of records) {
      await tx.store.put(record);
    }
    await tx.done;
  }

  public static async getPreKey(id: string): Promise<OneTimePreKeyRecord | undefined> {
    const db = await getDatabase();
    return db.get('prekeys', id);
  }

  public static async markPreKeyConsumed(id: string): Promise<void> {
    const db = await getDatabase();
    const record = await db.get('prekeys', id);
    if (record) {
      record.consumed = true;
      await db.put('prekeys', record);
    }
  }

  public static async getAvailablePreKeysCount(): Promise<number> {
    const db = await getDatabase();
    const all = await db.getAll('prekeys');
    return all.filter((pk) => !pk.consumed).length;
  }

  public static async getPreKeyMap(): Promise<Map<string, { publicKey: string; secretKey: string }>> {
    const db = await getDatabase();
    const all = await db.getAll('prekeys');
    const map = new Map<string, { publicKey: string; secretKey: string }>();
    for (const pk of all) {
      map.set(pk.id, pk.keyPair);
    }
    return map;
  }

  // Message Management
  public static async saveMessage(message: ChatMessage): Promise<void> {
    const db = await getDatabase();
    await db.put('messages', message);
  }

  public static async getMessagesForPeer(currentUserId: string, peerId: string): Promise<ChatMessage[]> {
    const db = await getDatabase();
    const all = await db.getAll('messages');
    return all
      .filter(
        (m) =>
          (m.senderId === currentUserId && m.recipientId === peerId) ||
          (m.senderId === peerId && m.recipientId === currentUserId)
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  public static async updateMessageStatus(id: string, status: ChatMessage['status']): Promise<void> {
    const db = await getDatabase();
    const msg = await db.get('messages', id);
    if (msg) {
      msg.status = status;
      await db.put('messages', msg);
    }
  }

  // Safety Number Management
  public static async saveSafetyNumber(record: SafetyNumberRecord): Promise<void> {
    const db = await getDatabase();
    await db.put('safety_numbers', record);
  }

  public static async getSafetyNumber(peerId: string): Promise<SafetyNumberRecord | undefined> {
    const db = await getDatabase();
    return db.get('safety_numbers', peerId);
  }
}
