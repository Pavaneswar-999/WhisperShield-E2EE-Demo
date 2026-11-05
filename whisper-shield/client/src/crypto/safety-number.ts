import { toBufferSource } from './cipher';

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

export class SafetyNumber {
  /**
   * Generates deterministic, verifiable 60-digit safety numbers.
   * Compares local and remote identity keys lexicographically by raw byte values,
   * performs 5,200 iterations of SHA-512 proof-of-work stretching, and formats
   * the output into 12 distinct 5-digit blocks separated by spaces.
   */
  public static async generate(
    localIdentityKey: Uint8Array,
    remoteIdentityKey: Uint8Array
  ): Promise<string> {
    // 1. Lexicographical byte-by-byte sort
    let firstKey = localIdentityKey;
    let secondKey = remoteIdentityKey;

    const minLen = Math.min(localIdentityKey.length, remoteIdentityKey.length);
    let comparison = 0;

    for (let i = 0; i < minLen; i++) {
      if (localIdentityKey[i] < remoteIdentityKey[i]) {
        comparison = -1;
        break;
      } else if (localIdentityKey[i] > remoteIdentityKey[i]) {
        comparison = 1;
        break;
      }
    }

    if (comparison === 0) {
      comparison = localIdentityKey.length - remoteIdentityKey.length;
    }

    if (comparison > 0) {
      firstKey = remoteIdentityKey;
      secondKey = localIdentityKey;
    }

    // 2. Concatenate sorted keys: firstKey || secondKey
    const combinedData = new Uint8Array(firstKey.length + secondKey.length);
    combinedData.set(firstKey, 0);
    combinedData.set(secondKey, firstKey.length);

    // 3. 5,200 sequential iterations of SHA-512
    let currentDigest: Uint8Array = combinedData;
    for (let i = 0; i < 5200; i++) {
      const digestBuffer = await subtleCrypto.digest('SHA-512', toBufferSource(currentDigest));
      currentDigest = new Uint8Array(digestBuffer);
    }

    // 4. Convert 64-byte digest into 12 distinct 5-digit blocks
    const chunks: string[] = [];
    for (let i = 0; i < 12; i++) {
      const offset = i * 4;
      const num =
        ((currentDigest[offset] << 24) |
          (currentDigest[offset + 1] << 16) |
          (currentDigest[offset + 2] << 8) |
          currentDigest[offset + 3]) >>>
        0;

      const block = (num % 100000).toString().padStart(5, '0');
      chunks.push(block);
    }

    return chunks.join(' ');
  }

  /**
   * Generates a concise hex fingerprint (first 8 bytes of SHA-256) for quick badge display.
   */
  public static async generateShortFingerprint(keyBytes: Uint8Array): Promise<string> {
    const hash = await subtleCrypto.digest('SHA-256', toBufferSource(keyBytes));
    const hashBytes = new Uint8Array(hash).slice(0, 8);
    return Array.from(hashBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(':')
      .toUpperCase();
  }
}
