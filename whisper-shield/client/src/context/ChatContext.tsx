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
  unreadCounts: Record<string, number>;
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
  resetPeerSession: (peerId?: string) => Promise<void>;
  verifySafetyNumber: (verified: boolean, targetPeerId?: string, overrideSafetyNumber?: string) => Promise<void>;
  getPeerVerificationStatus: (peerId: string, expectedSafetyNumber?: string) => Promise<boolean>;
  refillOPKs: (count?: number) => Promise<void>;
  simulateStateCompromise: () => { compromisedKeyHex: string; turnCount: number };
}

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserIdentity | null>(null);
  const [activePeerId, setActivePeerId] = useState<string | null>(null);
  const [allPeers, setAllPeers] = useState<PeerUserInfo[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [activeSession, setActiveSession] = useState<DoubleRatchetSession | null>(null);
  const [safetyNumber, setSafetyNumber] = useState<string | null>(null);
  const [isSafetyNumberVerified, setIsSafetyNumberVerified] = useState<boolean>(false);
  const [opkRemainingCount, setOpkRemainingCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('inspect') === 'true';
    }
    return false;
  });
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('safetyModal') === 'true';
    }
    return false;
  });

  const transportRef = useRef<TransportEngine>(new TransportEngine());
  const activeSessionRef = useRef<DoubleRatchetSession | null>(null);
  const currentUserRef = useRef<UserIdentity | null>(null);
  const activePeerIdRef = useRef<string | null>(null);
  const allPeersRef = useRef<PeerUserInfo[]>([]);

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

  useEffect(() => {
    allPeersRef.current = allPeers;
  }, [allPeers]);

  // Load real registered peers from the relay directory
  const refreshPeers = useCallback(async () => {
    try {
      const users = await TransportEngine.fetchRegisteredUsers();
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

  // Load or create user identity and always sync real public keys to the relay
  const loginAs = useCallback(
    async (rawUserId: string) => {
      const userId = rawUserId.trim().toLowerCase();
      if (!userId) return;

      StorageEngine.setScope(userId);
      let identity = await StorageEngine.getIdentity(userId);
      let opkPublicKeys: string[] = [];

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
        opkPublicKeys = keys.bundle.oneTimePreKeys || [];
      } else {
        opkPublicKeys = await StorageEngine.getUnconsumedPreKeyPublicKeys();
        if (opkPublicKeys.length < 10) {
          const { records, publicKeys } = X3DHEngine.generateOPKRefill(50);
          await StorageEngine.savePreKeys(records);
          opkPublicKeys = [...opkPublicKeys, ...publicKeys];
        }
      }

      // Always re-sync existing/new public keys with relay so restarts or sleep never leave peer lookup 404
      try {
        await TransportEngine.registerPreKeyBundle({
          userId: identity.userId,
          identityKey: identity.identityDHKeyPair.publicKey,
          identitySigningKey: identity.identitySigningKeyPair.publicKey,
          signedPreKey: identity.signedPreKeyPair.publicKey,
          signedPreKeySig: identity.signedPreKeyPair.signature,
          oneTimePreKeys: opkPublicKeys,
          remainingOPKs: opkPublicKeys.length
        });
      } catch (err) {
        console.error('Failed to register bundle with relay server:', err);
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('whispershield_active_user', userId);
      }

      setCurrentUser(identity);
      currentUserRef.current = identity;
      setActivePeerId(null);
      activePeerIdRef.current = null;
      setActiveSession(null);
      activeSessionRef.current = null;
      setMessages([]);
      setUnreadCounts({});
      setSafetyNumber(null);
      setIsSafetyNumberVerified(false);

      // Connect WebSocket transport (real status arrives via onStatusChange)
      transportRef.current.connect(userId);

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
    async (rawPeerId: string) => {
      const peerId = rawPeerId.trim().toLowerCase();
      if (!peerId) {
        setActivePeerId(null);
        activePeerIdRef.current = null;
        setActiveSession(null);
        activeSessionRef.current = null;
        setMessages([]);
        setSafetyNumber(null);
        setIsSafetyNumberVerified(false);
        return;
      }

      setActivePeerId(peerId);
      activePeerIdRef.current = peerId;
      setUnreadCounts((prev) => {
        if (!prev[peerId]) return prev;
        const next = { ...prev };
        delete next[peerId];
        return next;
      });

      if (!currentUserRef.current) return;

      // Refresh latest peer directory without consuming an OPK
      let knownPeer = allPeersRef.current.find((p) => p.userId === peerId);
      if (!knownPeer) {
        try {
          const users = await TransportEngine.fetchRegisteredUsers();
          setAllPeers(users.filter((u) => u.userId !== currentUserRef.current?.userId));
          knownPeer = users.find((u) => u.userId === peerId);
        } catch {
          // ignore
        }
      }

      // 1. Load active or stored session (discard stale session if peer regenerated device keys)
      const storedSession = await StorageEngine.getSession(peerId);
      if (storedSession) {
        if (
          knownPeer?.identityKey &&
          storedSession.peerIdentityKey &&
          storedSession.peerIdentityKey !== knownPeer.identityKey
        ) {
          await StorageEngine.deleteSession(peerId);
          setActiveSession(null);
          activeSessionRef.current = null;
        } else {
          const session = DoubleRatchetSession.importState(storedSession);
          setActiveSession(session);
          activeSessionRef.current = session;
        }
      } else {
        setActiveSession(null);
        activeSessionRef.current = null;
      }

      // 2. Load historical decrypted messages
      const storedMsgs = await StorageEngine.getMessagesForPeer(currentUserRef.current.userId, peerId);
      setMessages(storedMsgs);

      // 3. Compute deterministic Safety Number using directory identityKey (zero OPK consumption)
      try {
        if (!knownPeer?.identityKey) {
          setSafetyNumber(null);
          setIsSafetyNumberVerified(false);
          return;
        }
        const myIK = base64ToUint8Array(currentUserRef.current.identityDHKeyPair.publicKey);
        const peerIK = base64ToUint8Array(knownPeer.identityKey);

        const sn = await SafetyNumber.generate(myIK, peerIK);
        setSafetyNumber(sn);

        const snRecord = await StorageEngine.getSafetyNumber(peerId);
        setIsSafetyNumberVerified(Boolean(snRecord?.verified && snRecord.safetyNumber === sn));
      } catch (err) {
        console.warn('Could not compute safety number yet:', err);
        setSafetyNumber(null);
        setIsSafetyNumberVerified(false);
      }
    },
    []
  );

  // Auto-select peer from URL query parameter (?peer=bob) if provided
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const peer = p.get('peer');
      if (peer && currentUser) {
        const timer = setTimeout(() => {
          selectPeer(peer);
        }, 400);
        return () => clearTimeout(timer);
      }
    }
  }, [currentUser, selectPeer]);

  // Verify or unverify Safety Number
  const verifySafetyNumber = useCallback(
    async (verified: boolean, targetPeerId?: string, overrideSafetyNumber?: string) => {
      const peerId = targetPeerId || activePeerId;
      const sn = overrideSafetyNumber || safetyNumber;
      if (!peerId || !sn) return;
      await StorageEngine.saveSafetyNumber({
        peerId,
        safetyNumber: sn,
        verified,
        verifiedAt: verified ? Date.now() : undefined
      });
      if (peerId === activePeerId) {
        setIsSafetyNumberVerified(verified);
      }
    },
    [activePeerId, safetyNumber]
  );

  const getPeerVerificationStatus = useCallback(
    async (peerId: string, expectedSafetyNumber?: string): Promise<boolean> => {
      if (!peerId) return false;
      const snRecord = await StorageEngine.getSafetyNumber(peerId);
      if (!snRecord?.verified) return false;
      if (expectedSafetyNumber && snRecord.safetyNumber !== expectedSafetyNumber) {
        return false;
      }
      return true;
    },
    []
  );

  // Inbound Message Processor
  const handleInboundMessage = useCallback(
    async (data: {
      senderId: string;
      recipientId: string;
      envelope: EncryptedMessageEnvelope;
      timestamp: number;
    }) => {
      const senderId = data.senderId.trim().toLowerCase();
      const { envelope, timestamp } = data;
      const me = currentUserRef.current;
      if (!me) return;

      try {
        const stored = await StorageEngine.getSession(senderId);
        let session = activePeerIdRef.current === senderId ? activeSessionRef.current : null;
        if (!session && stored) {
          session = DoubleRatchetSession.importState(stored);
        }

        const peerKnownIK =
          envelope.senderIdentityKey ||
          stored?.peerIdentityKey ||
          allPeersRef.current.find((p) => p.userId === senderId)?.identityKey;

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

          // Responder initializes session with its SPK as local key pair
          session = new DoubleRatchetSession({
            initialSharedMasterKey: masterSecret,
            localDHKeyPair: bobSPKRaw
          });
        }

        if (!session) {
          throw new Error(
            `No active Double Ratchet session with @${senderId}. Ask @${senderId} to reset/re-send or reset the session.`
          );
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
        } else {
          setUnreadCounts((prev) => ({ ...prev, [senderId]: (prev[senderId] || 0) + 1 }));
        }

        // Save session state to IndexedDB bound to peer's identity key
        await StorageEngine.saveSession(session.exportState(senderId, peerKnownIK));

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
        const errText = err instanceof Error ? err.message : String(err);
        const failedMsg: ChatMessage = {
          id: `msg-err-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          senderId,
          recipientId: me.userId,
          content: `[Rejected / Decryption Failed] ${errText}`,
          timestamp,
          direction: 'incoming',
          status: 'failed'
        };
        await StorageEngine.saveMessage(failedMsg);
        if (activePeerIdRef.current === senderId) {
          setMessages((prev) => [...prev, failedMsg]);
        } else {
          setUnreadCounts((prev) => ({ ...prev, [senderId]: (prev[senderId] || 0) + 1 }));
        }
      }
    },
    [refillOPKs, refreshOPKCount]
  );

  // Manually reset ratchet session to force a fresh X3DH handshake on next message
  const resetPeerSession = useCallback(async (targetPeerId?: string) => {
    const peerId = (targetPeerId || activePeerIdRef.current || '').trim().toLowerCase();
    if (!peerId) return;
    await StorageEngine.deleteSession(peerId);
    if (activePeerIdRef.current === peerId) {
      setActiveSession(null);
      activeSessionRef.current = null;
    }
  }, []);

  // Send message to peer (supports text and/or encrypted file/image attachment)
  const sendMessage = useCallback(
    async (content: string, simulateTamper: boolean = false, attachment?: MessageAttachment) => {
      const me = currentUserRef.current;
      const peerId = activePeerIdRef.current?.trim().toLowerCase();
      if (!me || !peerId || (!content.trim() && !attachment)) return;

      let session = activeSessionRef.current;
      let storedSession = await StorageEngine.getSession(peerId);
      let isInitialHandshake = false;
      let ephemeralPublicKey: string | undefined;
      let consumedOneTimePreKey: string | null = null;

      // Refresh directory check so we catch newly registered peers or rotated browser keys
      let currentPeerInfo = allPeersRef.current.find((p) => p.userId === peerId);
      try {
        const users = await TransportEngine.fetchRegisteredUsers();
        setAllPeers(users.filter((u) => u.userId !== me.userId));
        currentPeerInfo = users.find((u) => u.userId === peerId);
      } catch {
        // use cached allPeers if directory fetch fails momentarily
      }

      if (!currentPeerInfo) {
        throw new Error(
          `@${peerId} is not registered on the relay server yet. Open another browser or Incognito window and log in as @${peerId} first.`
        );
      }

      // If peer rotated/recreated keys in another browser or Incognito, discard obsolete ratchet session
      if (
        session &&
        storedSession?.peerIdentityKey &&
        storedSession.peerIdentityKey !== currentPeerInfo.identityKey
      ) {
        await StorageEngine.deleteSession(peerId);
        session = null;
        storedSession = undefined;
      }

      const peerIdentityKey = currentPeerInfo.identityKey;

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

      // Step 3: Transmit via WebSocket, or guarantee delivery via HTTP relay fallback
      let deliveryStatus: ChatMessage['status'] = 'delivered';
      const sentViaWs = transportRef.current.sendEnvelope(peerId, envelope);
      if (!sentViaWs) {
        const httpRes = await TransportEngine.sendMessageHttp(me.userId, peerId, envelope);
        deliveryStatus = httpRes.status === 'delivered' ? 'delivered' : 'sent';
      } else if (!currentPeerInfo.isOnline) {
        deliveryStatus = 'sent';
      }

      // Step 4: Persist session (bound to peerIdentityKey) and message to IndexedDB
      await StorageEngine.saveSession(session.exportState(peerId, peerIdentityKey));

      const chatMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        senderId: me.userId,
        recipientId: peerId,
        content,
        attachment,
        timestamp: Date.now(),
        direction: 'outgoing',
        status: deliveryStatus,
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

  // Auto-select peer from URL query parameter (?peer=bob) if provided
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const peer = p.get('peer');
      if (peer && currentUser) {
        const timer = setTimeout(() => {
          selectPeer(peer);
        }, 400);
        return () => clearTimeout(timer);
      }
    }
  }, [currentUser, selectPeer]);

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
    refreshPeers();

    const unsubStatus = transport.onStatusChange((connected) => {
      setIsConnected(connected);
      if (connected) {
        refreshPeers();
      }
    });

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
      refreshPeers();
      if (currentUserRef.current) {
        refreshOPKCount();
      }
    }, 3500);

    return () => {
      unsubStatus();
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
        unreadCounts,
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
        resetPeerSession,
        verifySafetyNumber,
        getPeerVerificationStatus,
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
