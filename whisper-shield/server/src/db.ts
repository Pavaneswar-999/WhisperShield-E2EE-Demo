import Database from 'better-sqlite3';
import path from 'node:path';
import type {
  PreKeyBundle,
  UserPreKeyResponse,
  StoredUser,
  StoredOfflineMessage
} from './types.js';

export class RelayDatabase {
  private db: Database.Database;

  constructor(customPath?: string) {
    const dbPath = customPath || path.resolve(process.cwd(), 'whisper_relay.db');
    this.db = new Database(dbPath);
    // Enable Write-Ahead Logging for high concurrency
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initTables();
  }

  private initTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        identity_key TEXT NOT NULL,
        identity_signing_key TEXT NOT NULL,
        signed_pre_key TEXT NOT NULL,
        signed_pre_key_sig TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS one_time_prekeys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        key_data TEXT NOT NULL,
        consumed INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(user_id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_opk_user_unconsumed ON one_time_prekeys(user_id, consumed);

      CREATE TABLE IF NOT EXISTS offline_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        envelope_json TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_offline_recipient ON offline_messages(recipient_id);
    `);
  }

  /**
   * Registers or updates a user identity and their initial pool of One-Time PreKeys.
   */
  public registerUser(bundle: PreKeyBundle): void {
    const now = Date.now();
    const insertUser = this.db.prepare(`
      INSERT INTO users (user_id, identity_key, identity_signing_key, signed_pre_key, signed_pre_key_sig, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        identity_key = excluded.identity_key,
        identity_signing_key = excluded.identity_signing_key,
        signed_pre_key = excluded.signed_pre_key,
        signed_pre_key_sig = excluded.signed_pre_key_sig,
        created_at = excluded.created_at
    `);

    const insertOPK = this.db.prepare(`
      INSERT INTO one_time_prekeys (user_id, key_data, consumed, created_at)
      VALUES (?, ?, 0, ?)
    `);

    const transaction = this.db.transaction(() => {
      insertUser.run(
        bundle.userId,
        bundle.identityKey,
        bundle.identitySigningKey,
        bundle.signedPreKey,
        bundle.signedPreKeySig,
        now
      );

      if (bundle.oneTimePreKeys && bundle.oneTimePreKeys.length > 0) {
        for (const opk of bundle.oneTimePreKeys) {
          insertOPK.run(bundle.userId, opk, now);
        }
      }
    });

    transaction();
  }

  /**
   * Refills the One-Time PreKey pool for an existing registered identity.
   */
  public refillOPKs(userId: string, opks: string[]): number {
    const now = Date.now();
    const insertOPK = this.db.prepare(`
      INSERT INTO one_time_prekeys (user_id, key_data, consumed, created_at)
      VALUES (?, ?, 0, ?)
    `);

    const countRemainingStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM one_time_prekeys WHERE user_id = ? AND consumed = 0
    `);

    const transaction = this.db.transaction(() => {
      for (const opk of opks) {
        insertOPK.run(userId, opk, now);
      }
      const result = countRemainingStmt.get(userId) as { count: number };
      return result.count;
    });

    return transaction();
  }

  /**
   * Atomically fetches a user's prekey bundle and extracts one One-Time PreKey.
   * Ensures that concurrent initiators never receive the identical OPK.
   */
  public getUserBundle(userId: string): UserPreKeyResponse | null {
    const userStmt = this.db.prepare(`
      SELECT * FROM users WHERE user_id = ?
    `);

    const selectOPKStmt = this.db.prepare(`
      SELECT id, key_data FROM one_time_prekeys
      WHERE user_id = ? AND consumed = 0
      ORDER BY id ASC
      LIMIT 1
    `);

    const consumeOPKStmt = this.db.prepare(`
      UPDATE one_time_prekeys SET consumed = 1 WHERE id = ?
    `);

    const countRemainingStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM one_time_prekeys WHERE user_id = ? AND consumed = 0
    `);

    const transaction = this.db.transaction(() => {
      const user = userStmt.get(userId) as StoredUser | undefined;
      if (!user) {
        return null;
      }

      const opkRow = selectOPKStmt.get(userId) as { id: number; key_data: string } | undefined;
      let consumedOPK: string | null = null;

      if (opkRow) {
        consumeOPKStmt.run(opkRow.id);
        consumedOPK = opkRow.key_data;
      }

      const remainingResult = countRemainingStmt.get(userId) as { count: number };

      return {
        userId: user.user_id,
        identityKey: user.identity_key,
        identitySigningKey: user.identity_signing_key,
        signedPreKey: user.signed_pre_key,
        signedPreKeySig: user.signed_pre_key_sig,
        oneTimePreKey: consumedOPK,
        remainingOPKs: remainingResult.count
      };
    });

    return transaction();
  }

  /**
   * Lists all registered users and their public keys / remaining OPK count.
   */
  public getAllUsers(): Array<{ userId: string; identityKey: string; remainingOPKs: number }> {
    const stmt = this.db.prepare(`
      SELECT u.user_id, u.identity_key,
        (SELECT COUNT(*) FROM one_time_prekeys WHERE user_id = u.user_id AND consumed = 0) as remaining_opks
      FROM users u
      ORDER BY u.created_at DESC
    `);

    const rows = stmt.all() as Array<{ user_id: string; identity_key: string; remaining_opks: number }>;
    return rows.map((r) => ({
      userId: r.user_id,
      identityKey: r.identity_key,
      remainingOPKs: r.remaining_opks
    }));
  }

  /**
   * Enqueues an encrypted message envelope for an offline recipient.
   */
  public enqueueOfflineMessage(recipientId: string, senderId: string, envelopeJson: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO offline_messages (recipient_id, sender_id, envelope_json, timestamp)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(recipientId, senderId, envelopeJson, Date.now());
  }

  /**
   * Retrieves and permanently flushes all queued offline messages for a recipient.
   */
  public dequeueOfflineMessages(
    recipientId: string
  ): Array<{ id: number; senderId: string; envelope: object; timestamp: number }> {
    const selectStmt = this.db.prepare(`
      SELECT id, sender_id, envelope_json, timestamp
      FROM offline_messages
      WHERE recipient_id = ?
      ORDER BY timestamp ASC
    `);

    const deleteStmt = this.db.prepare(`
      DELETE FROM offline_messages WHERE id = ?
    `);

    const transaction = this.db.transaction(() => {
      const rows = selectStmt.all(recipientId) as StoredOfflineMessage[];
      const messages: Array<{ id: number; senderId: string; envelope: object; timestamp: number }> = [];

      for (const row of rows) {
        deleteStmt.run(row.id);
        try {
          messages.push({
            id: row.id,
            senderId: row.sender_id,
            envelope: JSON.parse(row.envelope_json),
            timestamp: row.timestamp
          });
        } catch {
          // ignore corrupted payload json
        }
      }

      return messages;
    });

    return transaction();
  }

  public close(): void {
    this.db.close();
  }
}
