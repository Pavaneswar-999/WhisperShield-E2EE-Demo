export interface PreKeyBundle {
  userId: string;
  identityKey: string;             // Base64 (X25519 DH public key)
  identitySigningKey: string;      // Base64 (Ed25519 signing public key)
  signedPreKey: string;            // Base64 (X25519 DH public key)
  signedPreKeySig: string;         // Base64 (Ed25519 signature over signedPreKey)
  oneTimePreKey?: string | null;   // Base64 (X25519 DH public key)
  oneTimePreKeys?: string[];       // Array of Base64 strings for registration/refill
  remainingOPKs?: number;
}

export interface EncryptedPayload {
  ciphertext: string; // Base64
  iv: string;         // Base64 (12 bytes)
  tag: string;        // Base64 (16 bytes)
}

export interface MessageHeader {
  dhRatchetPublicKey: string; // Base64 (X25519 public key)
  n: number;                  // Sequence number in current send chain
  pn: number;                 // Length of previous send chain
}

export interface EncryptedMessageEnvelope {
  header: MessageHeader;
  payload: EncryptedPayload;
  isInitialHandshake?: boolean;
  senderIdentityKey?: string;        // Base64 (X25519)
  senderIdentitySigningKey?: string; // Base64 (Ed25519)
  ephemeralPublicKey?: string;       // Base64 (X25519 EK_A)
  consumedOneTimePreKey?: string | null; // Base64 (X25519 OPK_B used)
}

export interface KeyPairRaw {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export interface KeyPairBase64 {
  publicKey: string;
  secretKey: string;
}

export interface StoredSession {
  peerId: string;
  peerIdentityKey?: string; // Remote Curve25519 identity key bound to this session
  rootKey: string; // Base64
  dhLocalKeyPair: KeyPairBase64;
  dhRemotePublicKey: string; // Base64
  sendingChainKey: string | null; // Base64
  receivingChainKey: string | null; // Base64
  nSend: number;
  nRecv: number;
  pnPrevious: number;
  skippedMessageKeys: Record<string, string>; // "ratchetPubKeyBase64:counter" -> base64(MK)
  lastUpdated: number;
}

export interface UserIdentity {
  userId: string;
  identityDHKeyPair: KeyPairBase64;
  identitySigningKeyPair: KeyPairBase64;
  signedPreKeyPair: KeyPairBase64 & { signature: string };
  createdAt: number;
}

export interface OneTimePreKeyRecord {
  id: string; // base64 public key
  keyPair: KeyPairBase64;
  consumed: boolean;
  createdAt: number;
}

export interface MessageTelemetry {
  n: number;
  pn: number;
  ratchetKeySnippet: string;
  iv: string;
  tag: string;
  isOutOfOrder?: boolean;
  isInitialHandshake?: boolean;
  cipher: string;
}

export interface MessageAttachment {
  name: string;
  size: number;
  type: 'image' | 'file';
  mimeType: string;
  dataUrl: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  attachment?: MessageAttachment;
  timestamp: number;
  direction: 'outgoing' | 'incoming';
  status: 'sending' | 'sent' | 'delivered' | 'failed';
  telemetry?: MessageTelemetry;
}

export interface SafetyNumberRecord {
  peerId: string;
  safetyNumber: string;
  verified: boolean;
  verifiedAt?: number;
}

