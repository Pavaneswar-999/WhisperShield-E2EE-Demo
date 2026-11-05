import { describe, it, expect } from 'vitest';
import { X3DHEngine } from '../crypto/x3dh';
import { DoubleRatchetSession } from '../crypto/ratchet';
import { uint8ArrayToBase64, base64ToUint8Array, CryptographicVerificationError } from '../crypto/cipher';
import { SafetyNumber } from '../crypto/safety-number';
import type { KeyPairBase64 } from '../types/crypto';

describe('WhisperShield Cryptographic Engine Integration Tests', () => {
  it('1. Executes full X3DH Initial Key Agreement with matching Master Secret', async () => {
    // Generate Alice and Bob prekey bundles
    const aliceKeys = X3DHEngine.generatePreKeyBundle('alice', 10);
    const bobKeys = X3DHEngine.generatePreKeyBundle('bob', 10);

    // Alice initiates handshake using Bob's public bundle
    const aliceHandshake = await X3DHEngine.initiateHandshake(
      aliceKeys.identityDH,
      {
        ...bobKeys.bundle,
        oneTimePreKey: bobKeys.bundle.oneTimePreKeys![0]
      }
    );

    // Bob receives handshake parameters and resolves matching master secret
    const bobOPKMap = new Map<string, KeyPairBase64>();
    for (const opk of bobKeys.oneTimePreKeys) {
      bobOPKMap.set(opk.id, opk.keyPair);
    }

    const bobHandshake = await X3DHEngine.receiveHandshake(
      bobKeys.identityDH,
      bobKeys.signedPreKey,
      bobOPKMap,
      aliceKeys.identityDH.publicKey,
      aliceHandshake.ephemeralKeyPair.publicKey,
      aliceHandshake.consumedOPK
    );

    // Both parties must derive bit-exact identical 32-byte Master Secret (SK)
    expect(aliceHandshake.masterSecret.length).toBe(32);
    expect(bobHandshake.masterSecret.length).toBe(32);
    expect(uint8ArrayToBase64(aliceHandshake.masterSecret)).toBe(
      uint8ArrayToBase64(bobHandshake.masterSecret)
    );
  });

  it('2. Normal alternating conversational flow across multiple ratchet turns', async () => {
    const aliceKeys = X3DHEngine.generatePreKeyBundle('alice', 5);
    const bobKeys = X3DHEngine.generatePreKeyBundle('bob', 5);

    const aliceHandshake = await X3DHEngine.initiateHandshake(
      aliceKeys.identityDH,
      {
        ...bobKeys.bundle,
        oneTimePreKey: bobKeys.bundle.oneTimePreKeys![0]
      }
    );

    const bobOPKMap = new Map<string, KeyPairBase64>();
    for (const opk of bobKeys.oneTimePreKeys) {
      bobOPKMap.set(opk.id, opk.keyPair);
    }

    const bobHandshake = await X3DHEngine.receiveHandshake(
      bobKeys.identityDH,
      bobKeys.signedPreKey,
      bobOPKMap,
      aliceKeys.identityDH.publicKey,
      aliceHandshake.ephemeralKeyPair.publicKey,
      aliceHandshake.consumedOPK
    );

    // Initialize Alice session with Bob's SPK as initial remote DH key
    const aliceSession = new DoubleRatchetSession({
      initialSharedMasterKey: aliceHandshake.masterSecret,
      remoteDHKey: bobKeys.signedPreKey.publicKey
    });

    // Initialize Bob session with Bob's SPK as local key pair
    const bobSession = new DoubleRatchetSession({
      initialSharedMasterKey: bobHandshake.masterSecret,
      localDHKeyPair: bobKeys.signedPreKey
    });

    // Turn 1: Alice -> Bob
    const msg1Text = 'Hello Bob, this is message 1!';
    const env1 = await aliceSession.encrypt(new TextEncoder().encode(msg1Text));
    const dec1 = await bobSession.decrypt(env1);
    expect(new TextDecoder().decode(dec1)).toBe(msg1Text);

    // Turn 2: Bob -> Alice (triggers asymmetric DH ratchet step on both sides)
    const msg2Text = 'Hi Alice, acknowledged turn 1!';
    const env2 = await bobSession.encrypt(new TextEncoder().encode(msg2Text));
    const dec2 = await aliceSession.decrypt(env2);
    expect(new TextDecoder().decode(dec2)).toBe(msg2Text);

    // Turn 3: Alice -> Bob
    const msg3Text = 'Ratchet step successful, sending turn 3.';
    const env3 = await aliceSession.encrypt(new TextEncoder().encode(msg3Text));
    const dec3 = await bobSession.decrypt(env3);
    expect(new TextDecoder().decode(dec3)).toBe(msg3Text);

    // Verify ratchet public keys have evolved
    expect(env1.header.dhRatchetPublicKey).not.toBe(env3.header.dhRatchetPublicKey);
  });

  it('3. Burst message delivery (multiple sequential messages sent before a reply)', async () => {
    const aliceKeys = X3DHEngine.generatePreKeyBundle('alice', 5);
    const bobKeys = X3DHEngine.generatePreKeyBundle('bob', 5);

    const handshake = await X3DHEngine.initiateHandshake(aliceKeys.identityDH, bobKeys.bundle);
    const aliceSession = new DoubleRatchetSession({
      initialSharedMasterKey: handshake.masterSecret,
      remoteDHKey: bobKeys.signedPreKey.publicKey
    });
    const bobSession = new DoubleRatchetSession({
      initialSharedMasterKey: handshake.masterSecret,
      localDHKeyPair: bobKeys.signedPreKey
    });

    // Alice sends a burst of 5 sequential messages without waiting for Bob
    const burstEnvelopes = [];
    for (let i = 0; i < 5; i++) {
      const env = await aliceSession.encrypt(new TextEncoder().encode(`Burst item #${i}`));
      burstEnvelopes.push(env);
      expect(env.header.n).toBe(i);
    }

    // Bob receives and decrypts all 5 in order
    for (let i = 0; i < 5; i++) {
      const decrypted = await bobSession.decrypt(burstEnvelopes[i]);
      expect(new TextDecoder().decode(decrypted)).toBe(`Burst item #${i}`);
    }
  });

  it('4. Out-of-order message delivery via bounded skipped-key cache', async () => {
    const aliceKeys = X3DHEngine.generatePreKeyBundle('alice', 5);
    const bobKeys = X3DHEngine.generatePreKeyBundle('bob', 5);

    const handshake = await X3DHEngine.initiateHandshake(aliceKeys.identityDH, bobKeys.bundle);
    const aliceSession = new DoubleRatchetSession({
      initialSharedMasterKey: handshake.masterSecret,
      remoteDHKey: bobKeys.signedPreKey.publicKey
    });
    const bobSession = new DoubleRatchetSession({
      initialSharedMasterKey: handshake.masterSecret,
      localDHKeyPair: bobKeys.signedPreKey
    });

    // Alice sends 3 messages: index 0, 1, 2
    const env0 = await aliceSession.encrypt(new TextEncoder().encode('Packet 0'));
    const env1 = await aliceSession.encrypt(new TextEncoder().encode('Packet 1'));
    const env2 = await aliceSession.encrypt(new TextEncoder().encode('Packet 2'));

    // Network reordering: Bob receives Packet 2 first!
    const dec2 = await bobSession.decrypt(env2);
    expect(new TextDecoder().decode(dec2)).toBe('Packet 2');

    // Skipped keys should now cache keys for Packet 0 and Packet 1
    expect(bobSession.getSkippedKeysCount()).toBe(2);

    // Network later delivers Packet 0
    const dec0 = await bobSession.decrypt(env0);
    expect(new TextDecoder().decode(dec0)).toBe('Packet 0');
    expect(bobSession.getSkippedKeysCount()).toBe(1);

    // Finally Packet 1 arrives
    const dec1 = await bobSession.decrypt(env1);
    expect(new TextDecoder().decode(dec1)).toBe('Packet 1');
    expect(bobSession.getSkippedKeysCount()).toBe(0);
  });

  it('5. Hard skip window enforcement (rejects skipping > 200 keys)', async () => {
    const aliceKeys = X3DHEngine.generatePreKeyBundle('alice', 5);
    const bobKeys = X3DHEngine.generatePreKeyBundle('bob', 5);

    const handshake = await X3DHEngine.initiateHandshake(aliceKeys.identityDH, bobKeys.bundle);
    const aliceSession = new DoubleRatchetSession({
      initialSharedMasterKey: handshake.masterSecret,
      remoteDHKey: bobKeys.signedPreKey.publicKey
    });
    const bobSession = new DoubleRatchetSession({
      initialSharedMasterKey: handshake.masterSecret,
      localDHKeyPair: bobKeys.signedPreKey
    });

    // Craft a forged envelope with sequence gap = 205
    const realEnv = await aliceSession.encrypt(new TextEncoder().encode('Probe'));
    const forgedEnv = {
      ...realEnv,
      header: {
        ...realEnv.header,
        n: 205
      }
    };

    // Bob must immediately abort with CryptographicVerificationError before deriving HMACs
    await expect(bobSession.decrypt(forgedEnv)).rejects.toThrow(
      /exceeds secure threshold/i
    );
  });

  it('6. Integrity failure detection (tampered ciphertext or header AAD throws tag error)', async () => {
    const aliceKeys = X3DHEngine.generatePreKeyBundle('alice', 5);
    const bobKeys = X3DHEngine.generatePreKeyBundle('bob', 5);

    const handshake = await X3DHEngine.initiateHandshake(aliceKeys.identityDH, bobKeys.bundle);
    const aliceSession = new DoubleRatchetSession({
      initialSharedMasterKey: handshake.masterSecret,
      remoteDHKey: bobKeys.signedPreKey.publicKey
    });
    const bobSession = new DoubleRatchetSession({
      initialSharedMasterKey: handshake.masterSecret,
      localDHKeyPair: bobKeys.signedPreKey
    });

    const env = await aliceSession.encrypt(new TextEncoder().encode('Confidential message'));

    // Attack A: Flip 1 byte in the ciphertext payload
    const ctBytes = base64ToUint8Array(env.payload.ciphertext);
    ctBytes[0] ^= 0x55;
    const tamperedPayloadEnv = {
      ...env,
      payload: {
        ...env.payload,
        ciphertext: uint8ArrayToBase64(ctBytes)
      }
    };

    await expect(bobSession.decrypt(tamperedPayloadEnv)).rejects.toThrow(
      CryptographicVerificationError
    );

    // Attack B: Tamper with unencrypted header counter n
    const tamperedHeaderEnv = {
      ...env,
      header: {
        ...env.header,
        pn: env.header.pn + 1
      }
    };

    await expect(bobSession.decrypt(tamperedHeaderEnv)).rejects.toThrow(
      CryptographicVerificationError
    );
  });

  it('7. Deterministic Safety Number derivation across endpoints', async () => {
    const aliceKeys = X3DHEngine.generatePreKeyBundle('alice', 2);
    const bobKeys = X3DHEngine.generatePreKeyBundle('bob', 2);

    const aliceSN = await SafetyNumber.generate(
      aliceKeys.identityDH.publicKey,
      bobKeys.identityDH.publicKey
    );

    const bobSN = await SafetyNumber.generate(
      bobKeys.identityDH.publicKey,
      aliceKeys.identityDH.publicKey
    );

    // Both endpoints must produce the exact same 12 5-digit blocks (60 digits total)
    expect(aliceSN).toBe(bobSN);
    const blocks = aliceSN.split(' ');
    expect(blocks.length).toBe(12);
    for (const block of blocks) {
      expect(block.length).toBe(5);
      expect(/^\d{5}$/.test(block)).toBe(true);
    }
  });

  it('8. X3DH invalid signature rejection', async () => {
    const aliceKeys = X3DHEngine.generatePreKeyBundle('alice', 2);
    const bobKeys = X3DHEngine.generatePreKeyBundle('bob', 2);

    // Corrupt Bob's Signed PreKey signature
    const sigBytes = base64ToUint8Array(bobKeys.bundle.signedPreKeySig);
    sigBytes[0] ^= 0xff;

    const corruptedBundle = {
      ...bobKeys.bundle,
      signedPreKeySig: uint8ArrayToBase64(sigBytes)
    };

    await expect(
      X3DHEngine.initiateHandshake(aliceKeys.identityDH, corruptedBundle)
    ).rejects.toThrow(CryptographicVerificationError);
  });
});
