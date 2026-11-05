import type { EncryptedPayload } from '../types/crypto';

// Environment-agnostic WebCrypto SubtleCrypto reference
const subtleCrypto = ((): SubtleCrypto => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    return window.crypto.subtle;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle;
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nodeCrypto = require('node:crypto');
  return nodeCrypto.webcrypto.subtle;
})();

export function toBufferSource(bytes: Uint8Array): BufferSource {
  return bytes as unknown as BufferSource;
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    const buf = Buffer.from(base64, 'base64');
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export class CryptographicVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CryptographicVerificationError';
  }
}

export class CipherEngine {
  /**
   * Encrypts plaintext using AES-256-GCM with authenticated additional data (AAD).
   * Generates a 12-byte cryptographically secure random IV and returns Base64 strings.
   */
  public static async encrypt(
    keyBytes: Uint8Array,
    plaintext: Uint8Array,
    associatedData: Uint8Array
  ): Promise<EncryptedPayload> {
    if (keyBytes.length !== 32) {
      throw new Error(`Invalid key length for AES-256: expected 32 bytes, got ${keyBytes.length}`);
    }

    const iv = new Uint8Array(12);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(iv);
    } else if (typeof globalThis !== 'undefined' && globalThis.crypto) {
      globalThis.crypto.getRandomValues(iv);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodeCrypto = require('node:crypto');
      nodeCrypto.randomFillSync(iv);
    }

    const cryptoKey = await subtleCrypto.importKey(
      'raw',
      toBufferSource(keyBytes),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const encryptedBuffer = await subtleCrypto.encrypt(
      {
        name: 'AES-GCM',
        iv: toBufferSource(iv),
        additionalData: toBufferSource(associatedData),
        tagLength: 128
      },
      cryptoKey,
      toBufferSource(plaintext)
    );

    const encryptedBytes = new Uint8Array(encryptedBuffer);
    const tag = encryptedBytes.slice(encryptedBytes.length - 16);
    const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - 16);

    return {
      ciphertext: uint8ArrayToBase64(ciphertext),
      iv: uint8ArrayToBase64(iv),
      tag: uint8ArrayToBase64(tag)
    };
  }

  /**
   * Decrypts AES-256-GCM ciphertext and verifies payload and AAD integrity.
   * Throws CryptographicVerificationError if tag verification fails or tampering is detected.
   */
  public static async decrypt(
    keyBytes: Uint8Array,
    payload: EncryptedPayload,
    associatedData: Uint8Array
  ): Promise<Uint8Array> {
    if (keyBytes.length !== 32) {
      throw new Error(`Invalid key length for AES-256: expected 32 bytes, got ${keyBytes.length}`);
    }

    const cryptoKey = await subtleCrypto.importKey(
      'raw',
      toBufferSource(keyBytes),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    const ciphertextBytes = base64ToUint8Array(payload.ciphertext);
    const tagBytes = base64ToUint8Array(payload.tag);
    const ivBytes = base64ToUint8Array(payload.iv);

    if (ivBytes.length !== 12) {
      throw new CryptographicVerificationError(`Invalid IV length: expected 12 bytes, got ${ivBytes.length}`);
    }
    if (tagBytes.length !== 16) {
      throw new CryptographicVerificationError(`Invalid auth tag length: expected 16 bytes, got ${tagBytes.length}`);
    }

    // WebCrypto expects the 16-byte tag appended at the end of the ciphertext
    const combined = new Uint8Array(ciphertextBytes.length + tagBytes.length);
    combined.set(ciphertextBytes, 0);
    combined.set(tagBytes, ciphertextBytes.length);

    try {
      const decryptedBuffer = await subtleCrypto.decrypt(
        {
          name: 'AES-GCM',
          iv: toBufferSource(ivBytes),
          additionalData: toBufferSource(associatedData),
          tagLength: 128
        },
        cryptoKey,
        toBufferSource(combined)
      );

      return new Uint8Array(decryptedBuffer);
    } catch {
      throw new CryptographicVerificationError(
        'AEAD decryption failed: Authentication tag verification failed. Ciphertext or AAD header metadata has been tampered with or corrupted.'
      );
    }
  }

  // Backwards-compatible aliases matching spec
  public static encryptAES_GCM = CipherEngine.encrypt;
  public static decryptAES_GCM = CipherEngine.decrypt;
}

export const CryptoEngine = CipherEngine;
