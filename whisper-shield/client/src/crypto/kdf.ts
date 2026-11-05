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

export class KDFEngine {
  /**
   * Derives key material using HKDF-SHA256 (RFC 5869 Extract-and-Expand).
   * @param salt Salt buffer (defaults to 32 zero bytes if empty)
   * @param ikm Input keying material
   * @param info Context and application-specific info string
   * @param length Desired output length in bytes (default 64)
   */
  public static async hkdf(
    salt: Uint8Array,
    ikm: Uint8Array,
    info: Uint8Array,
    length: number = 64
  ): Promise<Uint8Array> {
    const effectiveSalt = salt && salt.length > 0 ? salt : new Uint8Array(32);

    const keyMaterial = await subtleCrypto.importKey(
      'raw',
      toBufferSource(ikm),
      { name: 'HKDF' },
      false,
      ['deriveBits']
    );

    const derivedBits = await subtleCrypto.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: toBufferSource(effectiveSalt),
        info: toBufferSource(info)
      },
      keyMaterial,
      length * 8
    );

    return new Uint8Array(derivedBits);
  }

  /**
   * Computes an HMAC-SHA256 digest over input bytes.
   * Used for Double Ratchet symmetric chain key stepping:
   * MK = HMAC-SHA256(CK, 0x01)
   * CK_next = HMAC-SHA256(CK, 0x02)
   */
  public static async hmac(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
    const hmacKey = await subtleCrypto.importKey(
      'raw',
      toBufferSource(key),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await subtleCrypto.sign('HMAC', hmacKey, toBufferSource(data));
    return new Uint8Array(signature);
  }

  public static hmacSha256 = KDFEngine.hmac;
}
