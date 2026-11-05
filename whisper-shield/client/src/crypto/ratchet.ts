import * as tweetnacl from 'tweetnacl';
import { CipherEngine, uint8ArrayToBase64, base64ToUint8Array, CryptographicVerificationError } from './cipher';
import { KDFEngine } from './kdf';
import type {
  MessageHeader,
  EncryptedMessageEnvelope,
  StoredSession,
  KeyPairRaw
} from '../types/crypto';

export function canonicalizeHeader(header: MessageHeader): Uint8Array {
  // Deterministic canonical JSON with sorted keys
  const canonicalObj = {
    dhRatchetPublicKey: header.dhRatchetPublicKey,
    n: header.n,
    pn: header.pn
  };
  return new TextEncoder().encode(JSON.stringify(canonicalObj));
}

export interface RatchetInitOptions {
  initialSharedMasterKey: Uint8Array;
  remoteDHKey?: Uint8Array;
  localDHKeyPair?: KeyPairRaw;
}

export class DoubleRatchetSession {
  private dhLocalKeyPair: tweetnacl.BoxKeyPair;
  private dhRemotePublicKey: Uint8Array | null = null;
  private rootKey: Uint8Array;
  private sendingChainKey: Uint8Array | null = null;
  private receivingChainKey: Uint8Array | null = null;
  private nSend: number = 0;
  private nRecv: number = 0;
  private pnPrevious: number = 0;
  private skippedMessageKeys: Map<string, Uint8Array> = new Map();

  public static readonly MAX_SKIP_WINDOW = 200;

  constructor(options: RatchetInitOptions) {
    this.rootKey = new Uint8Array(options.initialSharedMasterKey);

    if (options.localDHKeyPair) {
      // Use existing or specified key pair (e.g. Bob's SPK for initial responder turn)
      this.dhLocalKeyPair = {
        publicKey: new Uint8Array(options.localDHKeyPair.publicKey),
        secretKey: new Uint8Array(options.localDHKeyPair.secretKey)
      };
    } else {
      this.dhLocalKeyPair = tweetnacl.box.keyPair();
    }

    if (options.remoteDHKey) {
      this.dhRemotePublicKey = new Uint8Array(options.remoteDHKey);
    }
  }

  public getLocalDHPublicKey(): Uint8Array {
    return this.dhLocalKeyPair.publicKey;
  }

  public getRemoteDHPublicKey(): Uint8Array | null {
    return this.dhRemotePublicKey;
  }

  public getRootKey(): Uint8Array {
    return this.rootKey;
  }

  public getCounters(): { nSend: number; nRecv: number; pnPrevious: number } {
    return {
      nSend: this.nSend,
      nRecv: this.nRecv,
      pnPrevious: this.pnPrevious
    };
  }

  public getSkippedKeysCount(): number {
    return this.skippedMessageKeys.size;
  }

  /**
   * Encrypts outgoing message and advances symmetric sending ratchet.
   * Seals payload with AES-256-GCM using canonical message header as AAD.
   */
  public async encrypt(plaintextBytes: Uint8Array): Promise<EncryptedMessageEnvelope> {
    if (!this.sendingChainKey) {
      // Initialize sending chain if Alice is initiating with Bob's DH key
      await this.advanceDHRatchetSend();
    }

    // Advance symmetric sending chain:
    // MK = HMAC-SHA256(CK_send, 0x01)
    // CK_send_next = HMAC-SHA256(CK_send, 0x02)
    const messageKey = await KDFEngine.hmac(
      this.sendingChainKey!,
      new Uint8Array([0x01])
    );
    this.sendingChainKey = await KDFEngine.hmac(
      this.sendingChainKey!,
      new Uint8Array([0x02])
    );

    const header: MessageHeader = {
      dhRatchetPublicKey: uint8ArrayToBase64(this.dhLocalKeyPair.publicKey),
      n: this.nSend,
      pn: this.pnPrevious
    };

    const associatedData = canonicalizeHeader(header);
    const payload = await CipherEngine.encrypt(messageKey, plaintextBytes, associatedData);

    this.nSend++;
    return { header, payload };
  }

  /**
   * Decrypts incoming message, advancing ratchets and handling skipped keys.
   */
  public async decrypt(envelope: EncryptedMessageEnvelope): Promise<Uint8Array> {
    const remoteKeyBytes = base64ToUint8Array(envelope.header.dhRatchetPublicKey);
    const associatedData = canonicalizeHeader(envelope.header);

    // 1. Check for cached skipped message key (for out-of-order packets)
    const cacheKey = `${envelope.header.dhRatchetPublicKey}:${envelope.header.n}`;
    if (this.skippedMessageKeys.has(cacheKey)) {
      const messageKey = this.skippedMessageKeys.get(cacheKey)!;
      this.skippedMessageKeys.delete(cacheKey);
      return CipherEngine.decrypt(messageKey, envelope.payload, associatedData);
    }

    // 2. Advance DH Ratchet if remote presented a new ephemeral DH public key
    if (
      !this.dhRemotePublicKey ||
      !this.areKeysEqual(this.dhRemotePublicKey, remoteKeyBytes)
    ) {
      // Process remaining skipped keys on previous receiving chain up to previous chain length
      await this.skipMessageKeys(envelope.header.pn);
      await this.dhRatchetStep(remoteKeyBytes);
    }

    // 3. Skip missed message keys in current receiving chain up to current n
    await this.skipMessageKeys(envelope.header.n);

    // 4. Advance symmetric receiving ratchet
    if (!this.receivingChainKey) {
      throw new CryptographicVerificationError('Receiving chain key is not initialized.');
    }

    const messageKey = await KDFEngine.hmac(
      this.receivingChainKey,
      new Uint8Array([0x01])
    );
    this.receivingChainKey = await KDFEngine.hmac(
      this.receivingChainKey,
      new Uint8Array([0x02])
    );
    this.nRecv++;

    return CipherEngine.decrypt(messageKey, envelope.payload, associatedData);
  }

  /**
   * Executes a full Diffie-Hellman ratchet step when receiving a new remote DH key.
   * Derives a receiving chain and creates a fresh local key pair for the sending chain.
   */
  private async dhRatchetStep(remoteKeyBytes: Uint8Array): Promise<void> {
    this.pnPrevious = this.nSend;
    this.nSend = 0;
    this.nRecv = 0;
    this.dhRemotePublicKey = remoteKeyBytes;

    const ratchetInfo = new TextEncoder().encode('WhisperRatchetStep');

    // Receive chain derived from current local private key + new remote public key
    const dhReceiveSecret = tweetnacl.scalarMult(
      this.dhLocalKeyPair.secretKey,
      this.dhRemotePublicKey
    );
    const derivedRecv = await KDFEngine.hkdf(
      this.rootKey,
      dhReceiveSecret,
      ratchetInfo,
      64
    );
    this.rootKey = derivedRecv.slice(0, 32);
    this.receivingChainKey = derivedRecv.slice(32, 64);

    // Send chain derived from fresh local key pair + new remote public key
    this.dhLocalKeyPair = tweetnacl.box.keyPair();
    const dhSendSecret = tweetnacl.scalarMult(
      this.dhLocalKeyPair.secretKey,
      this.dhRemotePublicKey
    );
    const derivedSend = await KDFEngine.hkdf(
      this.rootKey,
      dhSendSecret,
      ratchetInfo,
      64
    );
    this.rootKey = derivedSend.slice(0, 32);
    this.sendingChainKey = derivedSend.slice(32, 64);
  }

  private async advanceDHRatchetSend(): Promise<void> {
    if (!this.dhRemotePublicKey) {
      throw new CryptographicVerificationError('Remote public key missing. Cannot advance sending ratchet.');
    }
    const ratchetInfo = new TextEncoder().encode('WhisperRatchetStep');
    const dhSendSecret = tweetnacl.scalarMult(
      this.dhLocalKeyPair.secretKey,
      this.dhRemotePublicKey
    );
    const derivedSend = await KDFEngine.hkdf(
      this.rootKey,
      dhSendSecret,
      ratchetInfo,
      64
    );
    this.rootKey = derivedSend.slice(0, 32);
    this.sendingChainKey = derivedSend.slice(32, 64);
  }

  /**
   * Derives and stores skipped message keys for out-of-order delivery.
   * Strictly enforces MAX_SKIP_WINDOW (200) to prevent memory exhaustion / DoS attacks.
   */
  private async skipMessageKeys(untilIndex: number): Promise<void> {
    if (this.receivingChainKey) {
      if (this.nRecv + DoubleRatchetSession.MAX_SKIP_WINDOW < untilIndex) {
        throw new CryptographicVerificationError(
          `Message sequence skip gap exceeds secure threshold (${untilIndex - this.nRecv} > ${DoubleRatchetSession.MAX_SKIP_WINDOW}). Possible DoS attempt.`
        );
      }

      while (this.nRecv < untilIndex) {
        const messageKey = await KDFEngine.hmac(
          this.receivingChainKey,
          new Uint8Array([0x01])
        );
        this.receivingChainKey = await KDFEngine.hmac(
          this.receivingChainKey,
          new Uint8Array([0x02])
        );

        if (this.dhRemotePublicKey) {
          const cacheKey = `${uint8ArrayToBase64(this.dhRemotePublicKey)}:${this.nRecv}`;
          // Enforce bounded cache size
          if (this.skippedMessageKeys.size >= DoubleRatchetSession.MAX_SKIP_WINDOW) {
            // Evict oldest entry
            const oldestKey = this.skippedMessageKeys.keys().next().value;
            if (oldestKey) {
              this.skippedMessageKeys.delete(oldestKey);
            }
          }
          this.skippedMessageKeys.set(cacheKey, messageKey);
        }
        this.nRecv++;
      }
    }
  }

  private areKeysEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
      diff |= a[i] ^ b[i];
    }
    return diff === 0;
  }

  /**
   * Serializes active session state for IndexedDB persistence.
   */
  public exportState(peerId: string): StoredSession {
    const skippedObj: Record<string, string> = {};
    for (const [key, val] of this.skippedMessageKeys.entries()) {
      skippedObj[key] = uint8ArrayToBase64(val);
    }

    return {
      peerId,
      rootKey: uint8ArrayToBase64(this.rootKey),
      dhLocalKeyPair: {
        publicKey: uint8ArrayToBase64(this.dhLocalKeyPair.publicKey),
        secretKey: uint8ArrayToBase64(this.dhLocalKeyPair.secretKey)
      },
      dhRemotePublicKey: this.dhRemotePublicKey ? uint8ArrayToBase64(this.dhRemotePublicKey) : '',
      sendingChainKey: this.sendingChainKey ? uint8ArrayToBase64(this.sendingChainKey) : null,
      receivingChainKey: this.receivingChainKey ? uint8ArrayToBase64(this.receivingChainKey) : null,
      nSend: this.nSend,
      nRecv: this.nRecv,
      pnPrevious: this.pnPrevious,
      skippedMessageKeys: skippedObj,
      lastUpdated: Date.now()
    };
  }

  /**
   * Rehydrates a session instance from IndexedDB storage.
   */
  public static importState(stored: StoredSession): DoubleRatchetSession {
    const session = new DoubleRatchetSession({
      initialSharedMasterKey: base64ToUint8Array(stored.rootKey),
      localDHKeyPair: {
        publicKey: base64ToUint8Array(stored.dhLocalKeyPair.publicKey),
        secretKey: base64ToUint8Array(stored.dhLocalKeyPair.secretKey)
      },
      remoteDHKey: stored.dhRemotePublicKey ? base64ToUint8Array(stored.dhRemotePublicKey) : undefined
    });

    session.sendingChainKey = stored.sendingChainKey ? base64ToUint8Array(stored.sendingChainKey) : null;
    session.receivingChainKey = stored.receivingChainKey ? base64ToUint8Array(stored.receivingChainKey) : null;
    session.nSend = stored.nSend;
    session.nRecv = stored.nRecv;
    session.pnPrevious = stored.pnPrevious;

    session.skippedMessageKeys = new Map();
    if (stored.skippedMessageKeys) {
      for (const [k, v] of Object.entries(stored.skippedMessageKeys)) {
        session.skippedMessageKeys.set(k, base64ToUint8Array(v));
      }
    }

    return session;
  }
}

