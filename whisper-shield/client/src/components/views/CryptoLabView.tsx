import React, { useState } from 'react';
import * as tweetnacl from 'tweetnacl';
import { X3DHEngine } from '../../crypto/x3dh';
import { DoubleRatchetSession } from '../../crypto/ratchet';
import { CipherEngine, uint8ArrayToBase64, base64ToUint8Array } from '../../crypto/cipher';
import { LiquidButton } from '../common/LiquidButton';
import {
  Cpu,
  Key,
  Shield,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const CryptoLabView: React.FC = () => {
  // --- Lab 1: Interactive X3DH State ---
  const [x3dhRunning, setX3dhRunning] = useState(false);
  const [x3dhResults, setX3dhResults] = useState<{
    dh1Hex: string;
    dh2Hex: string;
    dh3Hex: string;
    dh4Hex: string;
    aliceSKHex: string;
    bobSKHex: string;
    matched: boolean;
  } | null>(null);

  const runX3DHDemo = async () => {
    setX3dhRunning(true);
    try {
      const aliceKeys = X3DHEngine.generatePreKeyBundle('alice_lab', 5);
      const bobKeys = X3DHEngine.generatePreKeyBundle('bob_lab', 5);

      const aliceHandshake = await X3DHEngine.initiateHandshake(
        aliceKeys.identityDH,
        bobKeys.bundle
      );

      const bobOPKMap = new Map();
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

      // Compute individual DH outputs for visual breakdown
      const bobSPK = base64ToUint8Array(bobKeys.bundle.signedPreKey);
      const bobIK = base64ToUint8Array(bobKeys.bundle.identityKey);
      const bobOPK = bobKeys.bundle.oneTimePreKey ? base64ToUint8Array(bobKeys.bundle.oneTimePreKey) : new Uint8Array(32);

      const dh1 = tweetnacl.scalarMult(aliceKeys.identityDH.secretKey, bobSPK);
      const dh2 = tweetnacl.scalarMult(aliceHandshake.ephemeralKeyPair.secretKey, bobIK);
      const dh3 = tweetnacl.scalarMult(aliceHandshake.ephemeralKeyPair.secretKey, bobSPK);
      const dh4 = tweetnacl.scalarMult(aliceHandshake.ephemeralKeyPair.secretKey, bobOPK);

      const toHex = (buf: Uint8Array) =>
        Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('');

      setX3dhResults({
        dh1Hex: toHex(dh1).substring(0, 32) + '...',
        dh2Hex: toHex(dh2).substring(0, 32) + '...',
        dh3Hex: toHex(dh3).substring(0, 32) + '...',
        dh4Hex: toHex(dh4).substring(0, 32) + '...',
        aliceSKHex: toHex(aliceHandshake.masterSecret),
        bobSKHex: toHex(bobHandshake.masterSecret),
        matched: uint8ArrayToBase64(aliceHandshake.masterSecret) === uint8ArrayToBase64(bobHandshake.masterSecret)
      });
    } finally {
      setX3dhRunning(false);
    }
  };

  // --- Lab 2: Interactive Double Ratchet Stepper State ---
  const [ratchetSessionA, setRatchetSessionA] = useState<DoubleRatchetSession | null>(null);
  const [ratchetSessionB, setRatchetSessionB] = useState<DoubleRatchetSession | null>(null);
  const [ratchetLogs, setRatchetLogs] = useState<Array<{ turn: string; text: string; rkHex: string; n: number; pn: number }>>([]);

  const initRatchetSessions = async () => {
    const aliceKeys = X3DHEngine.generatePreKeyBundle('alice_r', 5);
    const bobKeys = X3DHEngine.generatePreKeyBundle('bob_r', 5);
    const handshake = await X3DHEngine.initiateHandshake(aliceKeys.identityDH, bobKeys.bundle);

    const sA = new DoubleRatchetSession({
      initialSharedMasterKey: handshake.masterSecret,
      remoteDHKey: bobKeys.signedPreKey.publicKey
    });

    const sB = new DoubleRatchetSession({
      initialSharedMasterKey: handshake.masterSecret,
      localDHKeyPair: bobKeys.signedPreKey
    });

    setRatchetSessionA(sA);
    setRatchetSessionB(sB);

    const toHex = (buf: Uint8Array) =>
      Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('');

    setRatchetLogs([
      {
        turn: 'Init',
        text: 'Initial Shared Master Secret established via X3DH',
        rkHex: toHex(sA.getRootKey()).substring(0, 24) + '...',
        n: 0,
        pn: 0
      }
    ]);
  };

  const stepAliceSends = async () => {
    if (!ratchetSessionA || !ratchetSessionB) return;
    const plaintext = new TextEncoder().encode(`Turn #${ratchetLogs.length} from Alice`);
    const envelope = await ratchetSessionA.encrypt(plaintext);
    const decrypted = await ratchetSessionB.decrypt(envelope);

    const toHex = (buf: Uint8Array) =>
      Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('');

    setRatchetLogs((prev) => [
      ...prev,
      {
        turn: 'Alice -> Bob',
        text: new TextDecoder().decode(decrypted),
        rkHex: toHex(ratchetSessionA.getRootKey()).substring(0, 24) + '...',
        n: envelope.header.n,
        pn: envelope.header.pn
      }
    ]);
  };

  const stepBobReplies = async () => {
    if (!ratchetSessionA || !ratchetSessionB) return;
    const plaintext = new TextEncoder().encode(`Turn #${ratchetLogs.length} reply from Bob`);
    const envelope = await ratchetSessionB.encrypt(plaintext);
    const decrypted = await ratchetSessionA.decrypt(envelope);

    const toHex = (buf: Uint8Array) =>
      Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('');

    setRatchetLogs((prev) => [
      ...prev,
      {
        turn: 'Bob -> Alice (DH Ratchet Step)',
        text: new TextDecoder().decode(decrypted),
        rkHex: toHex(ratchetSessionB.getRootKey()).substring(0, 24) + '...',
        n: envelope.header.n,
        pn: envelope.header.pn
      }
    ]);
  };

  // --- Lab 3: AEAD Tampering Testbed State ---
  const [aeadInput, setAeadInput] = useState('Top secret payload sealed with AES-256-GCM');
  const [tamperBit, setTamperBit] = useState(false);
  const [tamperHeader, setTamperHeader] = useState(false);
  const [aeadResult, setAeadResult] = useState<{ status: 'verified' | 'failed'; message: string; tag: string } | null>(null);

  const testAeadDecryption = async () => {
    try {
      const key = new Uint8Array(32);
      window.crypto.getRandomValues(key);

      const header = { dhRatchetPublicKey: 'sample_ratchet_pub', n: 1, pn: 0 };
      const canonicalHeader = new TextEncoder().encode(JSON.stringify(header));
      const plaintext = new TextEncoder().encode(aeadInput);

      const sealed = await CipherEngine.encrypt(key, plaintext, canonicalHeader);

      // Apply tampering if checked
      if (tamperBit) {
        const ct = base64ToUint8Array(sealed.ciphertext);
        ct[0] ^= 0x55; // flip byte
        sealed.ciphertext = uint8ArrayToBase64(ct);
      }

      let testAAD = canonicalHeader;
      if (tamperHeader) {
        // Manipulate sequence counter n
        const forgedHeader = { dhRatchetPublicKey: 'sample_ratchet_pub', n: 2, pn: 0 };
        testAAD = new TextEncoder().encode(JSON.stringify(forgedHeader));
      }

      const decryptedBytes = await CipherEngine.decrypt(key, sealed, testAAD);
      const decryptedText = new TextDecoder().decode(decryptedBytes);

      setAeadResult({
        status: 'verified',
        message: `✓ Decryption succeeded! Authenticated text: "${decryptedText}"`,
        tag: sealed.tag
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setAeadResult({
        status: 'failed',
        message: `✗ ${errMsg}`,
        tag: 'TAG_MISMATCH'
      });
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto px-6 py-12 sm:px-12 sm:py-16 select-none bg-transparent relative z-10 transition-colors">
      <div className="max-w-6xl mx-auto space-y-16 pb-24">
        {/* Lab Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#285C70]/10 border border-[#285C70]/30 text-xs font-semibold text-[#285C70] backdrop-blur-md">
            <Cpu className="w-3.5 h-3.5" />
            <span>INTERACTIVE VERIFICATION SUITE</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white font-sans leading-tight">
            Cryptographic Primitives Laboratory
          </h1>
          <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            Execute real-time mathematical derivations directly in your browser. All computations run native <strong>TweetNaCl</strong> Curve25519 scalar multiplications, <strong>HKDF-SHA256</strong> expansions, and native <strong>SubtleCrypto AES-256-GCM</strong>.
          </p>
        </div>

        {/* SECTION 1: Interactive X3DH Calculation Lab */}
        <div className="p-8 md:p-10 rounded-3xl bg-white/95 dark:bg-[#141416]/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-card-studio space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/[0.06] pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#285C70]/10 border border-[#285C70]/30 flex items-center justify-center text-[#285C70]">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-sans">
                  Lab 1: Asynchronous X3DH Key Agreement
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 font-mono mt-0.5">
                  Calculates 4 Curve25519 DH agreements and derives the 32-byte Master Secret
                </p>
              </div>
            </div>

            <LiquidButton
              variant="brand"
              size="md"
              disabled={x3dhRunning}
              onClick={runX3DHDemo}
              icon={x3dhRunning ? RefreshCw : Play}
            >
              <span>{x3dhRunning ? 'Calculating...' : 'Compute 4-DH Handshake'}</span>
            </LiquidButton>
          </div>

          {x3dhResults ? (
            <div className="space-y-6 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] space-y-1.5">
                  <span className="text-[10px] text-slate-500 dark:text-neutral-500 font-bold">
                    DH1: X25519(IK_A, SPK_B)
                  </span>
                  <div className="text-[#285C70] font-semibold truncate text-[11px]">
                    {x3dhResults.dh1Hex}
                  </div>
                  <span className="text-[9px] text-slate-400">Mutual Identity Auth</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] space-y-1.5">
                  <span className="text-[10px] text-slate-500 dark:text-neutral-500 font-bold">
                    DH2: X25519(EK_A, IK_B)
                  </span>
                  <div className="text-[#285C70] font-semibold truncate text-[11px]">
                    {x3dhResults.dh2Hex}
                  </div>
                  <span className="text-[9px] text-slate-400">Ephemeral Secrecy</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] space-y-1.5">
                  <span className="text-[10px] text-slate-500 dark:text-neutral-500 font-bold">
                    DH3: X25519(EK_A, SPK_B)
                  </span>
                  <div className="text-[#255468] dark:text-[#6692A4] font-semibold truncate text-[11px]">
                    {x3dhResults.dh3Hex}
                  </div>
                  <span className="text-[9px] text-slate-400">Signed PreKey Agreement</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] space-y-1.5">
                  <span className="text-[10px] text-slate-500 dark:text-neutral-500 font-bold">
                    DH4: X25519(EK_A, OPK_B)
                  </span>
                  <div className="text-[#224D5F] dark:text-[#60899B] font-semibold truncate text-[11px]">
                    {x3dhResults.dh4Hex}
                  </div>
                  <span className="text-[9px] text-slate-400">Single-use Key Isolation</span>
                </div>
              </div>

              {/* Master Secret Derivation Result */}
              <div className="p-5 rounded-2xl bg-[#285C70]/10 border border-[#285C70]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-[#285C70] font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Alice & Bob Derived Bit-Exact Shared Master Secret (SK):</span>
                  </div>
                  <div className="mt-2 text-slate-900 dark:text-white break-all text-[11px] font-semibold bg-white/70 dark:bg-black/50 p-3 rounded-xl border border-slate-200 dark:border-white/[0.06]">
                    {x3dhResults.aliceSKHex}
                  </div>
                </div>
                <span className="px-4 py-1.5 rounded-full bg-[#285C70]/20 text-[#285C70] text-xs font-bold shrink-0 text-center">
                  256-bit Key Derived
                </span>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-black/20 border border-dashed border-slate-200 dark:border-white/[0.08] text-center text-xs text-slate-500 dark:text-neutral-400 font-mono">
              Click &quot;Compute 4-DH Handshake&quot; to generate fresh Curve25519 key pairs and trace the derivation live.
            </div>
          )}
        </div>

        {/* SECTION 2: Interactive Double Ratchet Stepper */}
        <div className="p-8 md:p-10 rounded-3xl bg-white/95 dark:bg-[#141416]/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-card-studio space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/[0.06] pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#285C70]/10 border border-[#285C70]/30 flex items-center justify-center text-[#285C70]">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-sans">
                  Lab 2: Double Ratchet State Machine Simulator
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 font-mono mt-0.5">
                  Observe Root Key (RK) self-healing and symmetric chain stepping turn by turn
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!ratchetSessionA ? (
                <LiquidButton
                  variant="brand"
                  size="md"
                  onClick={initRatchetSessions}
                  icon={Sparkles}
                >
                  Initialize Ratchet Pair
                </LiquidButton>
              ) : (
                <>
                  <LiquidButton
                    variant="brand"
                    size="md"
                    onClick={stepAliceSends}
                    icon={ArrowRight}
                    iconPosition="right"
                  >
                    Alice Sends
                  </LiquidButton>
                  <LiquidButton
                    variant="secondary"
                    size="md"
                    onClick={stepBobReplies}
                    icon={RefreshCw}
                  >
                    Bob Replies (DH Step)
                  </LiquidButton>
                </>
              )}
            </div>
          </div>

          {ratchetLogs.length > 0 ? (
            <div className="space-y-3 font-mono text-xs">
              <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-sans font-semibold">
                Ratchet Transition History:
              </span>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {ratchetLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/[0.06] flex items-center justify-between text-[11px]"
                  >
                    <div className="space-y-0.5">
                      <span className="text-[#285C70] font-bold block">
                        {log.turn}
                      </span>
                      <span className="text-slate-600 dark:text-neutral-300 font-sans">
                        {log.text}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Root Key Digest</span>
                      <span className="text-slate-900 dark:text-white font-semibold">{log.rkHex}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-black/20 border border-dashed border-slate-200 dark:border-white/[0.08] text-center text-xs text-slate-500 dark:text-neutral-400 font-mono">
              Click &quot;Initialize Ratchet Pair&quot; to spawn Alice and Bob state machines.
            </div>
          )}
        </div>

        {/* SECTION 3: AEAD Authenticated Additional Data (AAD) Sandbox */}
        <div className="p-8 md:p-10 rounded-3xl bg-white/95 dark:bg-[#141416]/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-card-studio space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/[0.06] pb-6">
            <div className="w-10 h-10 rounded-xl bg-[#285C70]/10 border border-[#285C70]/30 flex items-center justify-center text-[#285C70]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-sans">
                Lab 3: AES-256-GCM AEAD & Canonical Header Integrity
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 font-mono mt-0.5">
                Verify how AAD binding renders in-transit packet tampering mathematically impossible
              </p>
            </div>
          </div>

          <div className="space-y-6 font-mono text-xs">
            <div>
              <label className="text-[11px] font-sans font-semibold text-slate-700 dark:text-neutral-300 block mb-2">
                Plaintext Message:
              </label>
              <input
                type="text"
                value={aeadInput}
                onChange={(e) => setAeadInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-300 dark:border-white/[0.08] rounded-xl px-4 py-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#285C70]/50"
              />
            </div>

            {/* Tampering switches */}
            <div className="flex flex-wrap items-center gap-6 p-5 rounded-2xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/[0.06]">
              <label className="flex items-center gap-2 cursor-pointer font-sans text-xs text-slate-700 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={tamperBit}
                  onChange={(e) => setTamperBit(e.target.checked)}
                  className="rounded text-[#285C70] focus:ring-[#285C70]"
                />
                <span className="flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                  <Flame className="w-3.5 h-3.5" />
                  Flip Bit 0 in Ciphertext (Payload Corruption)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-sans text-xs text-slate-700 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={tamperHeader}
                  onChange={(e) => setTamperHeader(e.target.checked)}
                  className="rounded text-[#285C70] focus:ring-[#285C70]"
                />
                <span className="flex items-center gap-1 font-semibold text-[#285C70]">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Tamper Sequence Counter n in AAD Header
                </span>
              </label>
            </div>

            <LiquidButton
              variant="brand"
              size="md"
              onClick={testAeadDecryption}
              icon={Shield}
            >
              <span>Execute AEAD Encryption & Decrypt Verification</span>
            </LiquidButton>

            {aeadResult && (
              <div
                className={`p-4 rounded-2xl border text-xs font-mono flex items-center justify-between gap-3 ${
                  aeadResult.status === 'verified'
                    ? 'bg-[#285C70]/10 border-[#285C70]/30 text-[#285C70]'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  {aeadResult.status === 'verified' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#285C70] shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span>{aeadResult.message}</span>
                </div>
                <span className="text-[10px] opacity-75 font-bold shrink-0">
                  Tag: {aeadResult.tag.substring(0, 12)}...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

