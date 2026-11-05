import React, { useState } from 'react';
import { LiquidButton } from '../common/LiquidButton';
import { TiltCard } from '../common/TiltCard';
import {
  Shield,
  ArrowRight,
  Layers,
  Sparkles,
  MessageSquare,
  X
} from 'lucide-react';

interface ProtocolSuiteViewProps {
  onOpenLabs: () => void;
  onOpenMessenger: () => void;
}

export const ProtocolSuiteView: React.FC<ProtocolSuiteViewProps> = ({
  onOpenLabs,
  onOpenMessenger
}) => {
  const [activeModalSection, setActiveModalSection] = useState<string | null>(null);

  return (
    <div className="flex-1 h-full overflow-y-auto px-6 py-8 sm:px-10 sm:py-10 bg-transparent select-none space-y-10 transition-colors relative z-10">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Hero Section */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#285C70]/10 border border-[#285C70]/25 text-xs font-semibold text-[#285C70] backdrop-blur-md bg-white/50 dark:bg-black/30">
            <Shield className="w-3.5 h-3.5" />
            <span>CRYPTOGRAPHIC PROTOCOL ARCHITECTURE</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-neutral-100 font-sans">
            Post-Compromise Resilient E2EE Specification
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-neutral-300 max-w-3xl leading-relaxed">
            WhisperShield combines <strong>Extended Triple Diffie-Hellman (X3DH)</strong> key agreement with the continuous <strong>Double Ratchet</strong> state machine, authenticated payloads via <strong>AES-256-GCM AEAD</strong>, and out-of-band MitM verification using <strong>60-digit iterative SHA-512 Safety Numbers</strong>.
          </p>
        </div>

        {/* 6-Card Bento Grid with REAL 3D Render Artwork & Gyroscopic Tilt */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          
          {/* Card 1: X3DH Handshake */}
          <TiltCard className="h-full">
            <div
              onClick={() => setActiveModalSection('x3dh')}
              className="relative p-6 sm:p-7 rounded-3xl bg-white/85 dark:bg-[#0f1219]/85 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.1] shadow-card-studio hover:shadow-card-hover transition-all duration-300 cursor-pointer group flex flex-col justify-between min-h-[420px] h-full overflow-hidden"
            >
              <div className="space-y-3">
                <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/[0.08] shadow-inner bg-slate-900">
                  <img
                    src="/images/bob_identity_card.jpg"
                    alt="X3DH Handshake"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold text-[#285C70] uppercase tracking-wider">
                    RFC 5869 / X3DH
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight group-hover:text-[#285C70] transition-colors">
                    Extended Triple DH
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed font-normal">
                    Asynchronous key agreement with offline endpoints via revolving One-Time PreKeys ($OPK$) and Ed25519 signatures.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] mt-4">
                <LiquidButton
                  variant="brand"
                  size="sm"
                  icon={ArrowRight}
                  iconPosition="right"
                  className="w-full justify-between"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModalSection('x3dh');
                  }}
                >
                  <span>4-DH Deep-Dive</span>
                </LiquidButton>
              </div>
            </div>
          </TiltCard>

          {/* Card 2: Double Ratchet State Machine */}
          <TiltCard className="h-full">
            <div
              onClick={() => setActiveModalSection('ratchet')}
              className="relative p-6 sm:p-7 rounded-3xl bg-white/85 dark:bg-[#0f1219]/85 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.1] shadow-card-studio hover:shadow-card-hover transition-all duration-300 cursor-pointer group flex flex-col justify-between min-h-[420px] h-full overflow-hidden"
            >
              <div className="space-y-3">
                <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/[0.08] shadow-inner bg-slate-900">
                  <img
                    src="/images/charlie_sealed_envelope.jpg"
                    alt="Double Ratchet Engine"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold text-[#285C70] uppercase tracking-wider">
                    Continuous Ratchet
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight group-hover:text-[#285C70] transition-colors">
                    Double Ratchet Engine
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed font-normal">
                    Asymmetric Curve25519 DH ratchet per conversational turn with symmetric HMAC-SHA256 chains per message.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] mt-4">
                <LiquidButton
                  variant="brand"
                  size="sm"
                  icon={ArrowRight}
                  iconPosition="right"
                  className="w-full justify-between"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModalSection('ratchet');
                  }}
                >
                  <span>Ratchet Math Details</span>
                </LiquidButton>
              </div>
            </div>
          </TiltCard>

          {/* Card 3: Break-in Recovery & Post-Compromise Security */}
          <TiltCard className="h-full">
            <div
              onClick={() => setActiveModalSection('post-compromise')}
              className="relative p-6 sm:p-7 rounded-3xl bg-white/85 dark:bg-[#0f1219]/85 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.1] shadow-card-studio hover:shadow-card-hover transition-all duration-300 cursor-pointer group flex flex-col justify-between min-h-[420px] h-full overflow-hidden"
            >
              <div className="space-y-3">
                <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/[0.08] shadow-inner bg-slate-900">
                  <img
                    src="/images/forward_secrecy_vault.jpg"
                    alt="Post-Compromise Security"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold text-[#285C70] uppercase tracking-wider">
                    Self-Healing
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight group-hover:text-[#285C70] transition-colors">
                    Post-Compromise Security
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed font-normal">
                    Even if memory is compromised at step $t$, the next uncompromised turn introduces fresh entropy, locking out the attacker.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] mt-4">
                <LiquidButton
                  variant="brand"
                  size="sm"
                  icon={ArrowRight}
                  iconPosition="right"
                  className="w-full justify-between"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModalSection('post-compromise');
                  }}
                >
                  <span>Forward & PCS Guarantees</span>
                </LiquidButton>
              </div>
            </div>
          </TiltCard>

          {/* Card 4: AEAD & Canonical Header Binding */}
          <TiltCard className="h-full">
            <div
              onClick={() => setActiveModalSection('aead')}
              className="relative p-6 sm:p-7 rounded-3xl bg-white/85 dark:bg-[#0f1219]/85 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.1] shadow-card-studio hover:shadow-card-hover transition-all duration-300 cursor-pointer group flex flex-col justify-between min-h-[420px] h-full overflow-hidden"
            >
              <div className="space-y-3">
                <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/[0.08] shadow-inner bg-slate-900">
                  <img
                    src="/images/crypto_labs_chipset.jpg"
                    alt="AEAD Header Binding"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold text-[#285C70] uppercase tracking-wider">
                    AES-256-GCM
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight group-hover:text-[#285C70] transition-colors">
                    AEAD Header Binding
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed font-normal">
                    Headers containing ratchet keys and sequence counters are bound into Authenticated Additional Data to stop tampering.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] mt-4">
                <LiquidButton
                  variant="secondary"
                  size="sm"
                  icon={ArrowRight}
                  iconPosition="right"
                  className="w-full justify-between"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModalSection('aead');
                  }}
                >
                  <span>AAD Verification Details</span>
                </LiquidButton>
              </div>
            </div>
          </TiltCard>

          {/* Card 5: Deterministic Safety Numbers */}
          <TiltCard className="h-full">
            <div
              onClick={() => setActiveModalSection('safety')}
              className="relative p-6 sm:p-7 rounded-3xl bg-white/85 dark:bg-[#0f1219]/85 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.1] shadow-card-studio hover:shadow-card-hover transition-all duration-300 cursor-pointer group flex flex-col justify-between min-h-[420px] h-full overflow-hidden"
            >
              <div className="space-y-3">
                <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/[0.08] shadow-inner bg-slate-900">
                  <img
                    src="/images/safety_number_biometric.jpg"
                    alt="Safety Numbers"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold text-[#285C70] uppercase tracking-wider">
                    5,200 Rounds
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight group-hover:text-[#285C70] transition-colors">
                    60-Digit Safety Numbers
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed font-normal">
                    Out-of-band MitM verification: sorted identity keys are processed through 5,200 rounds of SHA-512 proof-of-work.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] mt-4">
                <LiquidButton
                  variant="secondary"
                  size="sm"
                  icon={ArrowRight}
                  iconPosition="right"
                  className="w-full justify-between"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModalSection('safety');
                  }}
                >
                  <span>Proof-of-Work Audit</span>
                </LiquidButton>
              </div>
            </div>
          </TiltCard>

          {/* Card 6: Zero-Knowledge Relay */}
          <TiltCard className="h-full">
            <div
              onClick={() => setActiveModalSection('relay')}
              className="relative p-6 sm:p-7 rounded-3xl bg-white/85 dark:bg-[#0f1219]/85 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.1] shadow-card-studio hover:shadow-card-hover transition-all duration-300 cursor-pointer group flex flex-col justify-between min-h-[420px] h-full overflow-hidden"
            >
              <div className="space-y-3">
                <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/[0.08] shadow-inner bg-slate-900">
                  <img
                    src="/images/blind_relay_server.jpg"
                    alt="Blind Relay Router"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold text-[#285C70] uppercase tracking-wider">
                    Zero-Knowledge
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight group-hover:text-[#285C70] transition-colors">
                    Blind Relay Router
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed font-normal">
                    Untrusted server storing zero private keys or plaintexts. Enforces atomic single-use OPKs and blind queuing.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] mt-4">
                <LiquidButton
                  variant="secondary"
                  size="sm"
                  icon={ArrowRight}
                  iconPosition="right"
                  className="w-full justify-between"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModalSection('relay');
                  }}
                >
                  <span>Blind Queue Architecture</span>
                </LiquidButton>
              </div>
            </div>
          </TiltCard>

        </div>

        {/* Interactive Lab Callout Banner */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#285C70] via-[#224D5F] to-[#1C3E4E] text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-2xl font-bold font-sans">
              Test These Cryptographic Primitives in Real Time
            </h2>
            <p className="text-xs md:text-sm text-white/90 leading-relaxed font-sans">
              The Cryptographic Labs section allows you to interactively run the 4-part Diffie-Hellman handshake, step the Double Ratchet state machine, simulate state compromise, and trigger live AEAD tampering errors.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <LiquidButton
              variant="secondary"
              size="md"
              icon={Sparkles}
              onClick={onOpenLabs}
            >
              Open Cryptographic Lab
            </LiquidButton>

            <LiquidButton
              variant="dark"
              size="md"
              icon={MessageSquare}
              onClick={onOpenMessenger}
            >
              Back to Chat
            </LiquidButton>
          </div>
        </div>
      </div>

      {/* Detail Modal if a card is clicked */}
      {activeModalSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 select-none">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0c0e14] border border-slate-200 dark:border-white/[0.12] rounded-3xl shadow-2xl p-6 md:p-8 space-y-5 text-slate-900 dark:text-neutral-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#285C70] font-bold font-mono">
                <Layers className="w-5 h-5" />
                <span className="text-sm uppercase tracking-wide">Protocol Deep-Dive</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalSection(null)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeModalSection === 'x3dh' && (
              <div className="space-y-3 text-xs leading-relaxed">
                <h3 className="text-lg font-bold font-sans">Extended Triple Diffie-Hellman (X3DH)</h3>
                <p className="text-slate-600 dark:text-neutral-400">
                  X3DH eliminates interactive handshakes by using pre-published public keys stored on an untrusted relay server:
                </p>
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-black/50 font-mono text-[11px] space-y-1.5 border border-slate-200 dark:border-white/[0.06]">
                  <div>DH1 = X25519(IK_A.secretKey, SPK_B) [Mutual Authentication]</div>
                  <div>DH2 = X25519(EK_A.secretKey, IK_B) [Forward Secrecy]</div>
                  <div>DH3 = X25519(EK_A.secretKey, SPK_B) [Forward Secrecy]</div>
                  <div>DH4 = X25519(EK_A.secretKey, OPK_B) [Concurrent Session Isolation]</div>
                  <div className="pt-2 text-[#285C70] font-semibold">
                    SK = HKDF-SHA256(salt=0_32, IKM=DH1 || DH2 || DH3 || DH4, "WhisperRatchetMaster", 32)
                  </div>
                </div>
              </div>
            )}

            {activeModalSection === 'ratchet' && (
              <div className="space-y-3 text-xs leading-relaxed">
                <h3 className="text-lg font-bold font-sans">Double Ratchet State Machine</h3>
                <p className="text-slate-600 dark:text-neutral-400">
                  Combines an asymmetric DH ratchet and symmetric KDF chains to advance keys continuously:
                </p>
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-black/50 font-mono text-[11px] space-y-1.5 border border-slate-200 dark:border-white/[0.06]">
                  <div>MK = HMAC-SHA256(CK_curr, 0x01) [Single-use Message Encryption Key]</div>
                  <div>CK_next = HMAC-SHA256(CK_curr, 0x02) [Advanced Chain Key]</div>
                  <div>Root Ratchet: {`{RK_next, CK_send}`} = HKDF(RK_mid, DH_send, "WhisperRatchetStep", 64)</div>
                  <div className="text-[#285C70] pt-1">
                    ✓ Hard skip window bounded to 200 keys max to prevent DoS attacks.
                  </div>
                </div>
              </div>
            )}

            {activeModalSection === 'post-compromise' && (
              <div className="space-y-3 text-xs leading-relaxed">
                <h3 className="text-lg font-bold font-sans">Forward Secrecy vs Post-Compromise Security</h3>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 rounded-2xl bg-[#285C70]/10 border border-[#285C70]/30">
                    <span className="font-bold text-[#285C70] block mb-1">
                      Forward Secrecy
                    </span>
                    <span className="text-slate-600 dark:text-neutral-400 text-[11px]">
                      Message keys $MK$ are wiped immediately after decryption. An attacker stealing credentials today cannot invert the one-way HMAC to decrypt yesterday.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08]">
                    <span className="font-bold text-slate-900 dark:text-neutral-100 block mb-1">
                      Post-Compromise Security
                    </span>
                    <span className="text-slate-600 dark:text-neutral-400 text-[11px]">
                      If device memory is dumped at step $t$, the next conversational turn samples fresh ephemeral Curve25519 entropy, re-seeding $RK$ and cutting off the attacker!
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeModalSection === 'aead' && (
              <div className="space-y-3 text-xs leading-relaxed">
                <h3 className="text-lg font-bold font-sans">AEAD Authenticated Additional Data (AAD)</h3>
                <p className="text-slate-600 dark:text-neutral-400">
                  Plaintext headers containing ratchet keys and sequence numbers must be authenticated:
                </p>
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-black/50 font-mono text-[11px] space-y-1">
                  <div>Header: {`{ dhRatchetPublicKey: "...", n: 1, pn: 0 }`}</div>
                  <div>AAD: canonicalJson(header)</div>
                  <div className="text-[#285C70] font-semibold">
                    Ciphertext, Tag = AES-256-GCM(Key=MK, IV=12bytes, Plaintext, AAD)
                  </div>
                </div>
              </div>
            )}

            {activeModalSection === 'safety' && (
              <div className="space-y-3 text-xs leading-relaxed">
                <h3 className="text-lg font-bold font-sans">Deterministic Safety Numbers</h3>
                <p className="text-slate-600 dark:text-neutral-400">
                  5,200 sequential iterations of SHA-512 over sorted identity keys generate 12 blocks of 5 decimal digits:
                </p>
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-black/50 font-mono text-center tracking-widest text-[#285C70] text-sm font-bold">
                  23847 91028 47192 03819 48192 03918 47291 03819 48291 03819 48291 03819
                </div>
              </div>
            )}

            {activeModalSection === 'relay' && (
              <div className="space-y-3 text-xs leading-relaxed">
                <h3 className="text-lg font-bold font-sans">Zero-Knowledge Relay Server</h3>
                <p className="text-slate-600 dark:text-neutral-400">
                  The relay server operates under strict zero-knowledge principles. It only acts as a public prekey directory and blind transit queue, with SQLite transactions guaranteeing atomic OPK consumption.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
