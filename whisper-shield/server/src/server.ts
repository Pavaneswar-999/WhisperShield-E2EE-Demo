import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import { RelayDatabase } from './db.js';
import type { PreKeyBundle, InboundRelayEnvelope } from './types.js';

const app = express();
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const USER_ID_PATTERN = /^[a-z0-9_-]{1,32}$/;
function normalizeValidUserId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const normalized = raw.trim().toLowerCase();
  return USER_ID_PATTERN.test(normalized) ? normalized : null;
}

function isValidPreKeyList(keys: unknown): keys is string[] {
  return (
    Array.isArray(keys) &&
    keys.length <= 200 &&
    keys.every((k) => typeof k === 'string' && k.length > 0 && k.length <= 256)
  );
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

const server = http.createServer(app);
const wss = new WebSocketServer({ server, maxPayload: 10 * 1024 * 1024 });

const db = new RelayDatabase();

// Connected WebSocket clients mapped by userId
const connectedClients = new Map<string, WebSocket>();

// --- REST Endpoints for Cryptographic Key Management ---

app.get('/api/health', (_req: Request, res: Response): void => {
  res.status(200).json({ status: 'healthy', uptime: process.uptime(), timestamp: Date.now() });
});

app.post('/api/keys/register', (req: Request, res: Response): void => {
  const bundle: PreKeyBundle = req.body;
  const validUserId = normalizeValidUserId(bundle?.userId);
  if (
    !validUserId ||
    typeof bundle?.identityKey !== 'string' ||
    !bundle.identityKey ||
    typeof bundle?.identitySigningKey !== 'string' ||
    !bundle.identitySigningKey ||
    typeof bundle?.signedPreKey !== 'string' ||
    !bundle.signedPreKey ||
    typeof bundle?.signedPreKeySig !== 'string' ||
    !bundle.signedPreKeySig ||
    (bundle.oneTimePreKeys !== undefined && !isValidPreKeyList(bundle.oneTimePreKeys))
  ) {
    res.status(400).json({
      error:
        'Incomplete or invalid cryptographic bundle. Valid userId (1-32 alphanumeric/_/-), identityKey, identitySigningKey, signedPreKey, and signedPreKeySig are required.'
    });
    return;
  }

  try {
    db.registerUser({ ...bundle, userId: validUserId });
    res.status(200).json({
      status: 'success',
      message: 'Cryptographic prekey bundle registered successfully.'
    });
  } catch (err: unknown) {
    console.error('Failed to register prekey bundle:', err);
    res.status(500).json({ error: 'Internal server error while registering prekey bundle.' });
  }
});

app.get('/api/keys/:userId', (req: Request, res: Response): void => {
  const userId = normalizeValidUserId(req.params.userId);
  if (!userId) {
    res.status(400).json({ error: 'Invalid userId format.' });
    return;
  }
  try {
    const bundle = db.getUserBundle(userId);
    if (!bundle) {
      res.status(404).json({ error: `Requested identity '${userId}' does not exist.` });
      return;
    }
    res.status(200).json(bundle);
  } catch (err: unknown) {
    console.error('Database error retrieving bundle:', err);
    res.status(500).json({ error: 'Internal server error while retrieving prekey bundle.' });
  }
});

app.post('/api/keys/refill', (req: Request, res: Response): void => {
  const userId = normalizeValidUserId(req.body?.userId);
  const oneTimePreKeys = req.body?.oneTimePreKeys;
  if (!userId || !isValidPreKeyList(oneTimePreKeys) || oneTimePreKeys.length === 0) {
    res.status(400).json({ error: 'Valid userId and non-empty oneTimePreKeys array (max 200) are required.' });
    return;
  }

  try {
    const remainingCount = db.refillOPKs(userId, oneTimePreKeys);
    if (remainingCount === null) {
      res.status(404).json({ error: `Requested identity '${userId}' does not exist.` });
      return;
    }
    res.status(200).json({
      status: 'success',
      message: `Refilled ${oneTimePreKeys.length} OPKs successfully.`,
      remainingOPKs: remainingCount
    });
  } catch (err: unknown) {
    console.error('Failed to refill prekeys:', err);
    res.status(500).json({ error: 'Internal server error while refilling prekeys.' });
  }
});

// HTTP delivery fallback if WebSocket is momentarily reconnecting
app.post('/api/messages/send', (req: Request, res: Response): void => {
  const senderId = normalizeValidUserId(req.body?.senderId);
  const recipientId = normalizeValidUserId(req.body?.recipientId);
  const encryptedEnvelope = req.body?.encryptedEnvelope;
  const timestamp =
    typeof req.body?.timestamp === 'number' && Number.isFinite(req.body.timestamp)
      ? req.body.timestamp
      : Date.now();

  if (!senderId || !recipientId || !isPlainObject(encryptedEnvelope)) {
    res.status(400).json({ error: 'Valid senderId, recipientId, and encryptedEnvelope object are required.' });
    return;
  }

  try {
    const recipientSocket = connectedClients.get(recipientId);
    if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
      recipientSocket.send(
        JSON.stringify({
          type: 'message',
          senderId,
          recipientId,
          encryptedEnvelope,
          timestamp,
          wasQueuedOffline: false
        })
      );
      res.status(200).json({ status: 'delivered', timestamp: Date.now() });
      return;
    }

    db.enqueueOfflineMessage(recipientId, senderId, JSON.stringify(encryptedEnvelope));
    res.status(200).json({ status: 'queued_offline', timestamp: Date.now() });
  } catch (err: unknown) {
    console.error('Failed to relay message:', err);
    res.status(500).json({ error: 'Internal server error while relaying message.' });
  }
});

app.get('/api/users', (_req: Request, res: Response): void => {
  try {
    const users = db.getAllUsers();
    // Annotate with online status
    const result = users.map((u) => ({
      ...u,
      isOnline: connectedClients.has(u.userId) && connectedClients.get(u.userId)!.readyState === WebSocket.OPEN
    }));
    res.status(200).json(result);
  } catch (err: unknown) {
    console.error('Failed to list users:', err);
    res.status(500).json({ error: 'Internal server error while listing users.' });
  }
});

// --- Zero-Knowledge Blind WebSocket Router ---

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  const host = req.headers.host || 'localhost:8080';
  const url = new URL(req.url || '', `http://${host}`);
  const userId = normalizeValidUserId(url.searchParams.get('userId'));

  if (!userId) {
    ws.close(1008, 'Valid authentication parameter userId is required.');
    return;
  }

  const previousSocket = connectedClients.get(userId);
  connectedClients.set(userId, ws);
  if (previousSocket && previousSocket !== ws && previousSocket.readyState === WebSocket.OPEN) {
    previousSocket.close(4000, 'Replaced by newer connection');
  }

  // Notify peer status change
  broadcastUserStatus(userId, true);

  // Flush queued offline messages immediately upon reconnection
  try {
    const queuedMessages = db.dequeueOfflineMessages(userId);
    for (const msg of queuedMessages) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'message',
            senderId: msg.senderId,
            recipientId: userId,
            encryptedEnvelope: msg.envelope,
            timestamp: msg.timestamp,
            wasQueuedOffline: true
          })
        );
      }
    }
  } catch (err) {
    console.error(`Error delivering offline messages for ${userId}:`, err);
  }

  ws.on('message', (raw: Buffer | string) => {
    try {
      const dataStr = typeof raw === 'string' ? raw : raw.toString('utf-8');
      const envelope: InboundRelayEnvelope = JSON.parse(dataStr);

      if (envelope.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        return;
      }

      if (envelope.type === 'message') {
        // Bind sender strictly to authenticated socket userId to prevent sender spoofing
        const normalizedSenderId = userId;
        const normalizedRecipientId = normalizeValidUserId(envelope.recipientId);
        if (!normalizedRecipientId || !isPlainObject(envelope.encryptedEnvelope)) {
          ws.send(JSON.stringify({ error: 'Invalid recipientId or encryptedEnvelope payload.' }));
          return;
        }
        const recipientSocket = connectedClients.get(normalizedRecipientId);

        if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
          recipientSocket.send(
            JSON.stringify({
              type: 'message',
              senderId: normalizedSenderId,
              recipientId: normalizedRecipientId,
              encryptedEnvelope: envelope.encryptedEnvelope,
              timestamp: envelope.timestamp || Date.now(),
              wasQueuedOffline: false
            })
          );

          // Acknowledge immediate delivery to sender
          ws.send(
            JSON.stringify({
              type: 'receipt',
              recipientId: normalizedRecipientId,
              status: 'delivered',
              timestamp: Date.now()
            })
          );
        } else {
          // Recipient is offline: store zero-knowledge encrypted envelope in SQLite queue
          db.enqueueOfflineMessage(
            normalizedRecipientId,
            normalizedSenderId,
            JSON.stringify(envelope.encryptedEnvelope)
          );

          ws.send(
            JSON.stringify({
              type: 'receipt',
              recipientId: normalizedRecipientId,
              status: 'queued_offline',
              timestamp: Date.now()
            })
          );
        }
      }
    } catch {
      ws.send(JSON.stringify({ error: 'Malformed message frame rejected.' }));
    }
  });

  ws.on('close', () => {
    if (connectedClients.get(userId) === ws) {
      connectedClients.delete(userId);
      broadcastUserStatus(userId, false);
    }
  });

  ws.on('error', (err) => {
    console.error(`WebSocket error for ${userId}:`, err);
    if (connectedClients.get(userId) === ws) {
      connectedClients.delete(userId);
      broadcastUserStatus(userId, false);
    }
  });
});

function broadcastUserStatus(userId: string, isOnline: boolean): void {
  const payload = JSON.stringify({
    type: 'user_status',
    userId,
    isOnline,
    timestamp: Date.now()
  });

  for (const client of connectedClients.values()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// --- Serve Static Client Assets (Production / Cloud Deployment) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req: Request, res: Response, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🛡️  WhisperShield Zero-Knowledge Relay running on :${PORT}`);
  console.log(`   REST API: http://localhost:${PORT}/api`);
  console.log(`   WebSocket: ws://localhost:${PORT}`);
  console.log(`======================================================\n`);
});

