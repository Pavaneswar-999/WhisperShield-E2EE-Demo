import * as tweetnacl from 'tweetnacl';
import { KDFEngine } from './kdf';
import {
  uint8ArrayToBase64,
  base64ToUint8Array,
  CryptographicVerificationError
} from './cipher';
import type {
  PreKeyBundle,
  KeyPairRaw,
  KeyPairBase64,
  OneTimePreKeyRecord
} from '../types/crypto';

export interface GeneratedClientKeys {
  bundle: PreKeyBundle;
  identityDH: KeyPairRaw;
  identitySigning: KeyPairRaw;
  signedPreKey: KeyPairRaw & { signature: Uint8Array };
  oneTimePreKeys: OneTimePreKeyRecord[];
}

export class X3DHEngine {
  private static readonly X3DH_INFO = new TextEncoder().encode('WhisperRatchetMaster');

  /**
   * Generates a complete cryptographic identity and prekey set for registration.
   */
  public static generatePreKeyBundle(userId: string, opkCount: number = 50): GeneratedClientKeys {
    // 1. Identity Key Pair (Curve25519 for DH)
    const identityDH = tweetnacl.box.keyPair();

    // 2. Identity Signing Key Pair (Ed25519 for signing SPK)
    const identitySigning = tweetnacl.sign.keyPair();

    // 3. Signed PreKey Pair (Curve25519)
    const signedPreKeyBox = tweetnacl.box.keyPair();

    // 4. Ed25519 Signature of Signed PreKey under Identity Signing Key
    const signature = tweetnacl.sign.detached(
      signedPreKeyBox.publicKey,
      identitySigning.secretKey
    );

    // 5. One-Time PreKeys Pool (Curve25519)
    const oneTimePreKeys: OneTimePreKeyRecord[] = [];
    const opkPublicKeysBase64: string[] = [];

    for (let i = 0; i < opkCount; i++) {
      const opkBox = tweetnacl.box.keyPair();
      const pubB64 = uint8ArrayToBase64(opkBox.publicKey);
      const secB64 = uint8ArrayToBase64(opkBox.secretKey);

      oneTimePreKeys.push({
        id: pubB64,
        keyPair: {
          publicKey: pubB64,
          secretKey: secB64
        },
        consumed: false,
        createdAt: Date.now()
      });
      opkPublicKeysBase64.push(pubB64);
    }

    const bundle: PreKeyBundle = {
      userId,
      identityKey: uint8ArrayToBase64(identityDH.publicKey),
      identitySigningKey: uint8ArrayToBase64(identitySigning.publicKey),
      signedPreKey: uint8ArrayToBase64(signedPreKeyBox.publicKey),
      signedPreKeySig: uint8ArrayToBase64(signature),
      oneTimePreKeys: opkPublicKeysBase64,
      remainingOPKs: opkPublicKeysBase64.length
    };

    return {
      bundle,
      identityDH: {
        publicKey: identityDH.publicKey,
        secretKey: identityDH.secretKey
      },
      identitySigning: {
        publicKey: identitySigning.publicKey,
        secretKey: identitySigning.secretKey
      },
      signedPreKey: {
        publicKey: signedPreKeyBox.publicKey,
        secretKey: signedPreKeyBox.secretKey,
        signature
      },
      oneTimePreKeys
    };
  }

  /**
   * Generates additional One-Time PreKeys to refill a depleted pool.
   */
  public static generateOPKRefill(count: number = 50): { records: OneTimePreKeyRecord[]; publicKeys: string[] } {
    const records: OneTimePreKeyRecord[] = [];
    const publicKeys: string[] = [];

    for (let i = 0; i < count; i++) {
      const opkBox = tweetnacl.box.keyPair();
      const pubB64 = uint8ArrayToBase64(opkBox.publicKey);
      const secB64 = uint8ArrayToBase64(opkBox.secretKey);

      records.push({
        id: pubB64,
        keyPair: { publicKey: pubB64, secretKey: secB64 },
        consumed: false,
        createdAt: Date.now()
      });
      publicKeys.push(pubB64);
    }

    return { records, publicKeys };
  }

  /**
   * Alice initiates an X3DH key agreement with Bob's public prekey bundle.
   * Derives a 32-byte shared master secret (SK) and samples an ephemeral key pair EK_A.
   */
  public static async initiateHandshake(
    aliceIdentityDH: KeyPairRaw,
    bobBundle: PreKeyBundle
  ): Promise<{
    masterSecret: Uint8Array;
    ephemeralKeyPair: KeyPairRaw;
    consumedOPK: string | null;
  }> {
    const bobIKBytes = base64ToUint8Array(bobBundle.identityKey);
    const bobSigningKeyBytes = base64ToUint8Array(bobBundle.identitySigningKey);
    const bobSPKBytes = base64ToUint8Array(bobBundle.signedPreKey);
    const bobSigBytes = base64ToUint8Array(bobBundle.signedPreKeySig);

    // Verify Bob's Signed PreKey signature
    const isValidSignature = tweetnacl.sign.detached.verify(
      bobSPKBytes,
      bobSigBytes,
      bobSigningKeyBytes
    );

    if (!isValidSignature) {
      throw new CryptographicVerificationError(
        "X3DH Handshake aborted: Bob's Signed PreKey signature is INVALID. Possible key substitution or Man-in-the-Middle attack."
      );
    }

    // Alice samples fresh ephemeral Curve25519 key pair EK_A
    const ephemeralBox = tweetnacl.box.keyPair();
    const aliceEK: KeyPairRaw = {
      publicKey: ephemeralBox.publicKey,
      secretKey: ephemeralBox.secretKey
    };

    // DH1 = X25519(IK_A.secretKey, SPK_B)
    const dh1 = tweetnacl.scalarMult(aliceIdentityDH.secretKey, bobSPKBytes);

    // DH2 = X25519(EK_A.secretKey, IK_B)
    const dh2 = tweetnacl.scalarMult(aliceEK.secretKey, bobIKBytes);

    // DH3 = X25519(EK_A.secretKey, SPK_B)
    const dh3 = tweetnacl.scalarMult(aliceEK.secretKey, bobSPKBytes);

    let dhConcat: Uint8Array;
    let consumedOPK: string | null = null;

    if (bobBundle.oneTimePreKey) {
      consumedOPK = bobBundle.oneTimePreKey;
      const bobOPKBytes = base64ToUint8Array(bobBundle.oneTimePreKey);
      // DH4 = X25519(EK_A.secretKey, OPK_B)
      const dh4 = tweetnacl.scalarMult(aliceEK.secretKey, bobOPKBytes);

      dhConcat = new Uint8Array(32 * 4);
      dhConcat.set(dh1, 0);
      dhConcat.set(dh2, 32);
      dhConcat.set(dh3, 64);
      dhConcat.set(dh4, 96);
    } else {
      // 3-DH fallback if Bob's OPKs are exhausted
      dhConcat = new Uint8Array(32 * 3);
      dhConcat.set(dh1, 0);
      dhConcat.set(dh2, 32);
      dhConcat.set(dh3, 64);
    }

    // SK = HKDF-SHA256(salt=0_32, IKM=dhConcat, info="WhisperRatchetMaster", length=32)
    const masterSecret = await KDFEngine.hkdf(
      new Uint8Array(32),
      dhConcat,
      X3DHEngine.X3DH_INFO,
      32
    );

    return {
      masterSecret,
      ephemeralKeyPair: aliceEK,
      consumedOPK
    };
  }

  /**
   * Bob receives Alice's initial handshake envelope and derives the identical shared master secret.
   */
  public static async receiveHandshake(
    bobIdentityDH: KeyPairRaw,
    bobSPK: KeyPairRaw,
    bobOPKs: Map<string, KeyPairBase64>,
    aliceIKPub: Uint8Array,
    aliceEKPub: Uint8Array,
    consumedOPKPubBase64?: string | null
  ): Promise<{ masterSecret: Uint8Array }> {
    // DH1 = X25519(SPK_B.secretKey, IK_A)
    const dh1 = tweetnacl.scalarMult(bobSPK.secretKey, aliceIKPub);

    // DH2 = X25519(IK_B.secretKey, EK_A)
    const dh2 = tweetnacl.scalarMult(bobIdentityDH.secretKey, aliceEKPub);

    // DH3 = X25519(SPK_B.secretKey, EK_A)
    const dh3 = tweetnacl.scalarMult(bobSPK.secretKey, aliceEKPub);

    let dhConcat: Uint8Array;

    if (consumedOPKPubBase64 && bobOPKs.has(consumedOPKPubBase64)) {
      const opkRecord = bobOPKs.get(consumedOPKPubBase64)!;
      const opkSecretKey = base64ToUint8Array(opkRecord.secretKey);
      // DH4 = X25519(OPK_B.secretKey, EK_A)
      const dh4 = tweetnacl.scalarMult(opkSecretKey, aliceEKPub);

      dhConcat = new Uint8Array(32 * 4);
      dhConcat.set(dh1, 0);
      dhConcat.set(dh2, 32);
      dhConcat.set(dh3, 64);
      dhConcat.set(dh4, 96);
    } else {
      // 3-DH fallback
      dhConcat = new Uint8Array(32 * 3);
      dhConcat.set(dh1, 0);
      dhConcat.set(dh2, 32);
      dhConcat.set(dh3, 64);
    }

    const masterSecret = await KDFEngine.hkdf(
      new Uint8Array(32),
      dhConcat,
      X3DHEngine.X3DH_INFO,
      32
    );

    return { masterSecret };
  }
}

