import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type {
  UserIdentity,
  ChatMessage,
  EncryptedMessageEnvelope,
  MessageAttachment
} from '../types/crypto';
import { X3DHEngine } from '../crypto/x3dh';
import { DoubleRatchetSession } from '../crypto/ratchet';
import { SafetyNumber } from '../crypto/safety-number';
import { base64ToUint8Array, uint8ArrayToBase64 } from '../crypto/cipher';
import { StorageEngine } from '../storage/db';
import { TransportEngine, PeerUserInfo } from '../network/transport';

interface ChatContextType {
  currentUser: UserIdentity | null;
  activePeerId: string | null;
  activePeerInfo: PeerUserInfo | null;
  allPeers: PeerUserInfo[];
  messages: ChatMessage[];
  activeSession: DoubleRatchetSession | null;
  safetyNumber: string | null;
  isSafetyNumberVerified: boolean;
  opkRemainingCount: number;
  isConnected: boolean;
  isInspectorOpen: boolean;
  isSafetyModalOpen: boolean;
  setIsInspectorOpen: (open: boolean) => void;
  setIsSafetyModalOpen: (open: boolean) => void;
  loginAs: (userId: string) => Promise<void>;
  selectPeer: (peerId: string) => Promise<void>;
  sendMessage: (content: string, simulateTamper?: boolean, attachment?: MessageAttachment) => Promise<void>;
  verifySafetyNumber: (verified: boolean) => Promise<void>;
  refillOPKs: (count?: number) => Promise<void>;
  simulateStateCompromise: () => { compromisedKeyHex: string; turnCount: number };
}

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserIdentity | null>(null);
  const [activePeerId, setActivePeerId] = useState<string | null>(null);
  const [allPeers, setAllPeers] = useState<PeerUserInfo[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeSession, setActiveSession] = useState<DoubleRatchetSession | null>(null);
  const [safetyNumber, setSafetyNumber] = useState<string | null>(null);
  const [isSafetyNumberVerified, setIsSafetyNumberVerified] = useState<boolean>(false);
  const [opkRemainingCount, setOpkRemainingCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState<boolean>(false);

  const transportRef = useRef<TransportEngine>(new TransportEngine());
  const activeSessionRef = useRef<DoubleRatchetSession | null>(null);
  const currentUserRef = useRef<UserIdentity | null>(null);
  const activePeerIdRef = useRef<string | null>(null);

  // Keep refs synchronized
  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    activePeerIdRef.current = activePeerId;
  }, [activePeerId]);

  // Load available peers from relay and ensure demo peers are registered
  const refreshPeers = useCallback(async () => {
    try {
      let users = await TransportEngine.fetchRegisteredUsers();
      
      // Auto-seed Bob and Charlie if not registered yet
      const existingUserIds = new Set(users.map((u) => u.userId));
      const demoUsers = ['bob', 'charlie'];
      let seeded = false;
      
      for (const demoId of demoUsers) {
        if (!existingUserIds.has(demoId) && demoId !== currentUserRef.current?.userId) {
          try {
            const keys = X3DHEngine.generatePreKeyBundle(demoId, 40);
            await TransportEngine.registerPreKeyBundle(keys.bundle);
            seeded = true;
          } catch (seedErr) {
            console.warn(`Could not seed demo peer ${demoId}:`, seedErr);
          }
        }
      }

      if (seeded) {
        users = await TransportEngine.fetchRegisteredUsers();
      }

      if (currentUserRef.current) {
        setAllPeers(users.filter((u) => u.userId !== currentUserRef.current?.userId));
      } else {
        setAllPeers(users);
      }
    } catch (e) {
      console.warn('Failed to refresh registered users:', e);
    }
  }, []);

  // Update OPK count for current user
  const refreshOPKCount = useCallback(async () => {
    const count = await StorageEngine.getAvailablePreKeysCount();
    setOpkRemainingCount(count);
  }, []);

  // Load or create user identity
  const loginAs = useCallback(
    async (userId: string) => {
      StorageEngine.setScope(userId);
      let identity = await StorageEngine.getIdentity(userId);

      if (!identity) {
        // Generate complete prekey bundle
        const keys = X3DHEngine.generatePreKeyBundle(userId, 60);

        identity = {
          userId,
          identityDHKeyPair: {
            publicKey: uint8ArrayToBase64(keys.identityDH.publicKey),
            secretKey: uint8ArrayToBase64(keys.identityDH.secretKey)
          },
          identitySigningKeyPair: {
            publicKey: uint8ArrayToBase64(keys.identitySigning.publicKey),
            secretKey: uint8ArrayToBase64(keys.identitySigning.secretKey)
          },
          signedPreKeyPair: {
            publicKey: uint8ArrayToBase64(keys.signedPreKey.publicKey),
            secretKey: uint8ArrayToBase64(keys.signedPreKey.secretKey),
            signature: uint8ArrayToBase64(keys.signedPreKey.signature)
          },
          createdAt: Date.now()
        };

        // Persist identity and OPKs to IndexedDB
        await StorageEngine.saveIdentity(identity);
        await StorageEngine.savePreKeys(keys.oneTimePreKeys);

        // Register public bundle on zero-knowledge relay server
        try {
          await TransportEngine.registerPreKeyBundle(keys.bundle);
        } catch (err) {
          console.error('Failed to register bundle with relay server:', err);
        }
      }

      setCurrentUser(identity);
      currentUserRef.current = identity;
      setActivePeerId(null);
      activePeerIdRef.current = null;
      setActiveSession(null);
      activeSessionRef.current = null;
      setMessages([]);
      setSafetyNumber(null);
      setIsSafetyNumberVerified(false);

      // Connect WebSocket transport
      transportRef.current.connect(userId);
      setIsConnected(true);

      await refreshOPKCount();
      await refreshPeers();
    },
    [refreshOPKCount, refreshPeers]
  );

  // Refill One-Time PreKeys
  const refillOPKs = useCallback(
    async (count: number = 50) => {
      if (!currentUserRef.current) return;
      const { records, publicKeys } = X3DHEngine.generateOPKRefill(count);
      await StorageEngine.savePreKeys(records);
      await TransportEngine.refillPreKeys(currentUserRef.current.userId, publicKeys);
      await refreshOPKCount();
    },
    [refreshOPKCount]
  );

  // Select an active peer conversation
  const selectPeer = useCallback(
    async (peerId: string) => {
      setActivePeerId(peerId);
      activePeerIdRef.current = peerId;

      if (!currentUserRef.current) return;

      // 1. Load active or stored session
      const storedSession = await StorageEngine.getSession(peerId);
      if (storedSession) {
        const session = DoubleRatchetSession.importState(storedSession);
        setActiveSession(session);
        activeSessionRef.current = session;
      } else {
        setActiveSession(null);
        activeSessionRef.current = null;
      }

      // 2. Load historical decrypted messages
      const storedMsgs = await StorageEngine.getMessagesForPeer(currentUserRef.current.userId, peerId);
      setMessages(storedMsgs);

      // 3. Compute deterministic Safety Number if peer identity is known
      try {
        const peerBundle = await TransportEngine.fetchPreKeyBundle(peerId);
        const myIK = base64ToUint8Array(currentUserRef.current.identityDHKeyPair.publicKey);
        const peerIK = base64ToUint8Array(peerBundle.identityKey);

        const sn = await SafetyNumber.generate(myIK, peerIK);
        setSafetyNumber(sn);

        const snRecord = await StorageEngine.getSafetyNumber(peerId);
        setIsSafetyNumberVerified(Boolean(snRecord?.verified));
      } catch (err) {
        console.warn('Could not compute safety number yet:', err);
        setSafetyNumber(null);
        setIsSafetyNumberVerified(false);
      }
    },
    []
  );

  // Verify or unverify Safety Number
  const verifySafetyNumber = useCallback(
    async (verified: boolean) => {
      if (!activePeerId || !safetyNumber) return;
      await StorageEngine.saveSafetyNumber({
        peerId: activePeerId,
        safetyNumber,
        verified,
        verifiedAt: verified ? Date.now() : undefined
      });
      setIsSafetyNumberVerified(verified);
    },
    [activePeerId, safetyNumber]
  );

  // Inbound Message Processor
  const handleInboundMessage = useCallback(
    async (data: {
      senderId: string;
      recipientId: string;
      envelope: EncryptedMessageEnvelope;
      timestamp: number;
    }) => {
      const { senderId, envelope, timestamp } = data;
      const me = currentUserRef.current;
      if (!me) return;

      try {
        let session = activeSessionRef.current;
        if (!session || activePeerIdRef.current !== senderId) {
          const stored = await StorageEngine.getSession(senderId);
          if (stored) {
            session = DoubleRatchetSession.importState(stored);
          }
        }

        // Handle X3DH initial handshake message
        if (envelope.isInitialHandshake) {
          if (!envelope.senderIdentityKey || !envelope.ephemeralPublicKey) {
            throw new Error('Initial handshake missing required ephemeral or identity keys.');
          }

          const aliceIKBytes = base64ToUint8Array(envelope.senderIdentityKey);
          const aliceEKBytes = base64ToUint8Array(envelope.ephemeralPublicKey);
          const bobIKRaw = {
            publicKey: base64ToUint8Array(me.identityDHKeyPair.publicKey),
            secretKey: base64ToUint8Array(me.identityDHKeyPair.secretKey)
          };
          const bobSPKRaw = {
            publicKey: base64ToUint8Array(me.signedPreKeyPair.publicKey),
            secretKey: base64ToUint8Array(me.signedPreKeyPair.secretKey)
          };

          const prekeyMap = await StorageEngine.getPreKeyMap();

          // Responder derives identical Master Secret
          const { masterSecret } = await X3DHEngine.receiveHandshake(
            bobIKRaw,
            bobSPKRaw,
            prekeyMap,
            aliceIKBytes,
            aliceEKBytes,
            envelope.consumedOneTimePreKey
          );

          // Mark OPK as consumed if one was used
          if (envelope.consumedOneTimePreKey) {
            await StorageEngine.markPreKeyConsumed(envelope.consumedOneTimePreKey);
            await refreshOPKCount();
          }

          // Bob initializes session with his SPK as local key pair
          session = new DoubleRatchetSession({
            initialSharedMasterKey: masterSecret,
            localDHKeyPair: bobSPKRaw
          });
        }

        if (!session) {
          throw new Error(`No active session found to decrypt message from ${senderId}`);
        }

        // Decrypt envelope using Double Ratchet
        const decryptedBytes = await session.decrypt(envelope);
        const rawPlaintext = new TextDecoder().decode(decryptedBytes);

        let parsedContent = rawPlaintext;
        let parsedAttachment: MessageAttachment | undefined;
        try {
          const parsed = JSON.parse(rawPlaintext);
          if (parsed && typeof parsed === 'object') {
            if ('text' in parsed || 'attachment' in parsed) {
              parsedContent = typeof parsed.text === 'string' ? parsed.text : '';
              parsedAttachment = parsed.attachment;
            }
          }
        } catch {
          // Standard text message
        }

        // Update active session state if this peer is currently open
        if (activePeerIdRef.current === senderId) {
          setActiveSession(session);
          activeSessionRef.current = session;
        }

        // Save session state to IndexedDB
        await StorageEngine.saveSession(session.exportState(senderId));

        // Create ChatMessage record
        const chatMsg: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          senderId,
          recipientId: me.userId,
          content: parsedContent,
          attachment: parsedAttachment,
          timestamp,
          direction: 'incoming',
          status: 'delivered',
          telemetry: {
            n: envelope.header.n,
            pn: envelope.header.pn,
            ratchetKeySnippet: envelope.header.dhRatchetPublicKey.substring(0, 10) + '...',
            iv: envelope.payload.iv,
            tag: envelope.payload.tag,
            cipher: 'AES-256-GCM + AAD'
          }
        };

        await StorageEngine.saveMessage(chatMsg);

        if (activePeerIdRef.current === senderId) {
          setMessages((prev) => [...prev, chatMsg]);
        }

        // Automatic OPK refill if remaining pool drops below 10
        const availableOPKs = await StorageEngine.getAvailablePreKeysCount();
        if (availableOPKs < 10) {
          await refillOPKs(50);
        }
      } catch (err) {
        console.error('Failed to decrypt inbound message:', err);
      }
    },
    [refillOPKs, refreshOPKCount]
  );

  // Send message to peer (supports text and/or encrypted file/image attachment)
  const sendMessage = useCallback(
    async (content: string, simulateTamper: boolean = false, attachment?: MessageAttachment) => {
      const me = currentUserRef.current;
      const peerId = activePeerIdRef.current;
      if (!me || !peerId || (!content.trim() && !attachment)) return;

      let session = activeSessionRef.current;
      let isInitialHandshake = false;
      let ephemeralPublicKey: string | undefined;
      let consumedOneTimePreKey: string | null = null;

      // Step 1: If session doesn't exist, execute X3DH initial handshake
      if (!session) {
        const peerBundle = await TransportEngine.fetchPreKeyBundle(peerId);
        const aliceIKRaw = {
          publicKey: base64ToUint8Array(me.identityDHKeyPair.publicKey),
          secretKey: base64ToUint8Array(me.identityDHKeyPair.secretKey)
        };

        const handshake = await X3DHEngine.initiateHandshake(aliceIKRaw, peerBundle);

        session = new DoubleRatchetSession({
          initialSharedMasterKey: handshake.masterSecret,
          remoteDHKey: base64ToUint8Array(peerBundle.signedPreKey)
        });

        isInitialHandshake = true;
        ephemeralPublicKey = uint8ArrayToBase64(handshake.ephemeralKeyPair.publicKey);
        consumedOneTimePreKey = handshake.consumedOPK;

        setActiveSession(session);
        activeSessionRef.current = session;
      }

      // Step 2: Encrypt message payload with Double Ratchet AES-256-GCM AEAD
      const payloadData = attachment
        ? JSON.stringify({ text: content, attachment })
        : content;
      const plaintextBytes = new TextEncoder().encode(payloadData);
      const envelope = await session.encrypt(plaintextBytes);

      if (isInitialHandshake) {
        envelope.isInitialHandshake = true;
        envelope.senderIdentityKey = me.identityDHKeyPair.publicKey;
        envelope.senderIdentitySigningKey = me.identitySigningKeyPair.publicKey;
        envelope.ephemeralPublicKey = ephemeralPublicKey;
        envelope.consumedOneTimePreKey = consumedOneTimePreKey;
      }

      // Optional simulation: tamper with ciphertext to trigger AEAD integrity failure on receiver
      if (simulateTamper) {
        const ctBytes = base64ToUint8Array(envelope.payload.ciphertext);
        ctBytes[0] ^= 0xaa;
        envelope.payload.ciphertext = uint8ArrayToBase64(ctBytes);
      }

      // Step 3: Transmit envelope over transport
      transportRef.current.sendEnvelope(peerId, envelope);

      // Step 4: Persist session and message to IndexedDB
      await StorageEngine.saveSession(session.exportState(peerId));

      const chatMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        senderId: me.userId,
        recipientId: peerId,
        content,
        attachment,
        timestamp: Date.now(),
        direction: 'outgoing',
        status: 'delivered',
        telemetry: {
          n: envelope.header.n,
          pn: envelope.header.pn,
          ratchetKeySnippet: envelope.header.dhRatchetPublicKey.substring(0, 10) + '...',
          iv: envelope.payload.iv,
          tag: envelope.payload.tag,
          cipher: 'AES-256-GCM + AAD'
        }
      };

      await StorageEngine.saveMessage(chatMsg);
      setMessages((prev) => [...prev, chatMsg]);
    },
    []
  );

  // Simulate Post-Compromise Security (Break-in Recovery)
  const simulateStateCompromise = useCallback(() => {
    const session = activeSessionRef.current;
    if (!session) {
      return { compromisedKeyHex: 'No active session', turnCount: 0 };
    }
    const currentRootKey = session.getRootKey();
    const hex = Array.from(currentRootKey)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    const counters = session.getCounters();
    return {
      compromisedKeyHex: hex,
      turnCount: counters.nSend + counters.nRecv
    };
  }, []);

  // Listen to Transport events
  useEffect(() => {
    const transport = transportRef.current;

    const unsubMsg = transport.onMessage((data) => {
      handleInboundMessage(data);
    });

    const unsubPresence = transport.onPresence((data) => {
      setAllPeers((prev) => {
        const exists = prev.some((p) => p.userId === data.userId);
        if (!exists) {
          refreshPeers();
        }
        return prev.map((p) => (p.userId === data.userId ? { ...p, isOnline: data.isOnline } : p));
      });
    });

    // Periodic sync for dynamic peer discovery
    const syncInterval = setInterval(() => {
      if (currentUserRef.current) {
        refreshPeers();
        refreshOPKCount();
      }
    }, 3500);

    return () => {
      unsubMsg();
      unsubPresence();
      clearInterval(syncInterval);
      transport.disconnect();
    };
  }, [handleInboundMessage, refreshPeers, refreshOPKCount]);

  const activePeerInfo = allPeers.find((p) => p.userId === activePeerId) || null;

  return (
    <ChatContext.Provider
      value={{
        currentUser,
        activePeerId,
        activePeerInfo,
        allPeers,
        messages,
        activeSession,
        safetyNumber,
        isSafetyNumberVerified,
        opkRemainingCount,
        isConnected,
        isInspectorOpen,
        isSafetyModalOpen,
        setIsInspectorOpen,
        setIsSafetyModalOpen,
        loginAs,
        selectPeer,
        sendMessage,
        verifySafetyNumber,
        refillOPKs,
        simulateStateCompromise
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
