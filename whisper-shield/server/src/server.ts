import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { RelayDatabase } from './db.js';
import type { PreKeyBundle, InboundRelayEnvelope } from './types.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const db = new RelayDatabase();

// Connected WebSocket clients mapped by userId
const connectedClients = new Map<string, WebSocket>();

// --- REST Endpoints for Cryptographic Key Management ---

app.get('/api/health', (_req: Request, res: Response): void => {
  res.status(200).json({ status: 'healthy', uptime: process.uptime(), timestamp: Date.now() });
});

app.post('/api/keys/register', (req: Request, res: Response): void => {
  const bundle: PreKeyBundle = req.body;
  if (!bundle.userId || !bundle.identityKey || !bundle.signedPreKey || !bundle.signedPreKeySig) {
    res.status(400).json({
      error: 'Incomplete cryptographic bundle provided. userId, identityKey, signedPreKey, and signedPreKeySig are required.'
    });
    return;
  }

  try {
    db.registerUser(bundle);
    res.status(200).json({
      status: 'success',
      message: 'Cryptographic prekey bundle registered successfully.'
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Failed to register prekey bundle: ${errorMsg}` });
  }
});

app.get('/api/keys/:userId', (req: Request, res: Response): void => {
  const { userId } = req.params;
  try {
    const bundle = db.getUserBundle(userId);
    if (!bundle) {
      res.status(404).json({ error: `Requested identity '${userId}' does not exist.` });
      return;
    }
    res.status(200).json(bundle);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Database error retrieving bundle: ${errorMsg}` });
  }
});

app.post('/api/keys/refill', (req: Request, res: Response): void => {
  const { userId, oneTimePreKeys } = req.body;
  if (!userId || !Array.isArray(oneTimePreKeys) || oneTimePreKeys.length === 0) {
    res.status(400).json({ error: 'userId and non-empty oneTimePreKeys array are required.' });
    return;
  }

  try {
    const remainingCount = db.refillOPKs(userId, oneTimePreKeys);
    res.status(200).json({
      status: 'success',
      message: `Refilled ${oneTimePreKeys.length} OPKs successfully.`,
      remainingOPKs: remainingCount
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Failed to refill prekeys: ${errorMsg}` });
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
    const errorMsg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Failed to list users: ${errorMsg}` });
  }
});

// --- Zero-Knowledge Blind WebSocket Router ---

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  const host = req.headers.host || 'localhost:8080';
  const url = new URL(req.url || '', `http://${host}`);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    ws.close(1008, 'Authentication parameter userId is required.');
    return;
  }

  connectedClients.set(userId, ws);

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
        const recipientSocket = connectedClients.get(envelope.recipientId);

        if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
          recipientSocket.send(
            JSON.stringify({
              type: 'message',
              senderId: envelope.senderId,
              recipientId: envelope.recipientId,
              encryptedEnvelope: envelope.encryptedEnvelope,
              timestamp: envelope.timestamp || Date.now(),
              wasQueuedOffline: false
            })
          );

          // Acknowledge immediate delivery to sender
          ws.send(
            JSON.stringify({
              type: 'receipt',
              recipientId: envelope.recipientId,
              status: 'delivered',
              timestamp: Date.now()
            })
          );
        } else {
          // Recipient is offline: store zero-knowledge encrypted envelope in SQLite queue
          db.enqueueOfflineMessage(
            envelope.recipientId,
            envelope.senderId,
            JSON.stringify(envelope.encryptedEnvelope)
          );

          ws.send(
            JSON.stringify({
              type: 'receipt',
              recipientId: envelope.recipientId,
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
    connectedClients.delete(userId);
    broadcastUserStatus(userId, false);
  });

  ws.on('error', (err) => {
    console.error(`WebSocket error for ${userId}:`, err);
    connectedClients.delete(userId);
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

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🛡️  WhisperShield Zero-Knowledge Relay running on :${PORT}`);
  console.log(`   REST API: http://localhost:${PORT}/api`);
  console.log(`   WebSocket: ws://localhost:${PORT}`);
  console.log(`======================================================\n`);
});

