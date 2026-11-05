export interface PreKeyBundle {
  userId: string;
  identityKey: string;             // Base64 (X25519)
  identitySigningKey: string;      // Base64 (Ed25519)
  signedPreKey: string;            // Base64 (X25519)
  signedPreKeySig: string;         // Base64 (Ed25519 signature)
  oneTimePreKeys: string[];        // Array of Base64 strings
}

export interface UserPreKeyResponse {
  userId: string;
  identityKey: string;
  identitySigningKey: string;
  signedPreKey: string;
  signedPreKeySig: string;
  oneTimePreKey: string | null;
  remainingOPKs: number;
}

export interface InboundRelayEnvelope {
  type: 'message' | 'receipt' | 'ping';
  senderId: string;
  recipientId: string;
  encryptedEnvelope: object;
  timestamp: number;
}

export interface StoredUser {
  user_id: string;
  identity_key: string;
  identity_signing_key: string;
  signed_pre_key: string;
  signed_pre_key_sig: string;
  created_at: number;
}

export interface StoredOPK {
  id: number;
  user_id: string;
  key_data: string;
  consumed: number;
  created_at: number;
}

export interface StoredOfflineMessage {
  id: number;
  recipient_id: string;
  sender_id: string;
  envelope_json: string;
  timestamp: number;
}

