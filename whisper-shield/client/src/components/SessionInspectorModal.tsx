import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { uint8ArrayToBase64 } from '../crypto/cipher';
import {
  X,
  Sliders,
  Key,
  Shield,
  Layers,
  Activity,
  AlertOctagon,
  Sparkles,
  Lock
} from 'lucide-react';

export const SessionInspectorModal: React.FC = () => {
  const {
    isInspectorOpen,
    setIsInspectorOpen,
    activePeerId,
    activeSession,
    opkRemainingCount,
    simulateStateCompromise
  } = useChat();

  const [compromiseLog, setCompromiseLog] = useState<{
    compromisedKeyHex: string;
    turnCount: number;
    timestamp: number;
  } | null>(null);

  if (!isInspectorOpen) return null;

  const rootKeyBytes = activeSession ? activeSession.getRootKey() : null;
  const rootKeyHex = rootKeyBytes
    ? Array.from(rootKeyBytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
    : 'No active session';

  const localDHPublic = activeSession
    ? uint8ArrayToBase64(activeSession.getLocalDHPublicKey())
    : 'N/A';

  const remoteDHPublic = activeSession?.getRemoteDHPublicKey()
    ? uint8ArrayToBase64(activeSession.getRemoteDHPublicKey()!)
    : 'Initial handshaking...';

  const counters = activeSession
    ? activeSession.getCounters()
    : { nSend: 0, nRecv: 0, pnPrevious: 0 };

  const skippedKeysCount = activeSession ? activeSession.getSkippedKeysCount() : 0;

  const handleSimulateCompromise = () => {
    const result = simulateStateCompromise();
    setCompromiseLog({
      ...result,
      timestamp: Date.now()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-2xl bg-white dark:bg-[#090b0f] border border-slate-200 dark:border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between bg-slate-50 dark:bg-[#0e1117]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#285C70]/10 border border-[#285C70]/30 text-[#285C70] flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100 font-mono">
                Cryptographic Session Inspector
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                Active Peer: @{activePeerId || 'none'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsInspectorOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs font-mono">
          {/* Active Root Key Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0d0f15] border border-slate-200 dark:border-white/[0.08] space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400">
              <span className="flex items-center gap-1.5 text-[#285C70] font-bold">
                <Key className="w-3.5 h-3.5" />
                Double Ratchet Root Key (RK)
              </span>
              <span className="text-[10px]">256-bit entropy</span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-black/60 border border-slate-200 dark:border-white/[0.04] text-[11px] text-[#285C70] break-all select-text font-mono leading-relaxed">
              {rootKeyHex}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-neutral-500 font-sans">
              Derivation: Continuous HKDF-SHA256 ratcheting combining asymmetric Diffie-Hellman turns with symmetric chain keys.
            </p>
          </div>

          {/* Ratchet Counters Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0d0f15] border border-slate-200 dark:border-white/[0.08]">
              <span className="block text-[10px] text-slate-500 dark:text-neutral-500">Sending Counter (nSend)</span>
              <span className="text-base font-bold text-slate-900 dark:text-neutral-100 font-mono mt-0.5 block">
                {counters.nSend}
              </span>
              <span className="text-[9px] text-slate-400 dark:text-neutral-500">Current TX chain</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0d0f15] border border-slate-200 dark:border-white/[0.08]">
              <span className="block text-[10px] text-slate-500 dark:text-neutral-500">Receiving Counter (nRecv)</span>
              <span className="text-base font-bold text-slate-900 dark:text-neutral-100 font-mono mt-0.5 block">
                {counters.nRecv}
              </span>
              <span className="text-[9px] text-slate-400 dark:text-neutral-500">Current RX chain</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0d0f15] border border-slate-200 dark:border-white/[0.08]">
              <span className="block text-[10px] text-slate-500 dark:text-neutral-500">Previous Chain (pn)</span>
              <span className="text-base font-bold text-slate-900 dark:text-neutral-100 font-mono mt-0.5 block">
                {counters.pnPrevious}
              </span>
              <span className="text-[9px] text-slate-400 dark:text-neutral-500">Prior turn length</span>
            </div>
          </div>

          {/* Ephemeral Diffie-Hellman Ratchet Keys */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0d0f15] border border-slate-200 dark:border-white/[0.08] space-y-3">
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-neutral-300 font-bold">
              <Layers className="w-3.5 h-3.5 text-[#285C70]" />
              <span>Curve25519 Ephemeral Ratchet Keys</span>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-neutral-500 block mb-0.5">Local Ephemeral DH PubKey:</span>
                <div className="p-2.5 rounded-xl bg-white dark:bg-black/50 border border-slate-200 dark:border-white/[0.04] text-[10px] text-slate-700 dark:text-neutral-300 break-all select-text font-mono">
                  {localDHPublic}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 dark:text-neutral-500 block mb-0.5">Remote Ephemeral DH PubKey:</span>
                <div className="p-2.5 rounded-xl bg-white dark:bg-black/50 border border-slate-200 dark:border-white/[0.04] text-[10px] text-slate-700 dark:text-neutral-300 break-all select-text font-mono">
                  {remoteDHPublic}
                </div>
              </div>
            </div>
          </div>

          {/* Memory Cache & OPK Health */}
          <div className="grid grid-cols-2 gap-3">
            {/* Out-of-Order Skipped Keys */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0d0f15] border border-slate-200 dark:border-white/[0.08] space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400">
                <span className="flex items-center gap-1 text-slate-800 dark:text-neutral-300 font-bold">
                  <Activity className="w-3.5 h-3.5 text-[#285C70]" />
                  Skipped Keys
                </span>
                <span className="text-[10px] text-slate-400">Max 200</span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-neutral-200">
                {skippedKeysCount} <span className="text-[10px] text-slate-500 font-normal">in memory cache</span>
              </div>
              <p className="text-[9px] text-slate-500 font-sans">
                Supports out-of-order delivery without unbounded HMAC memory expansion DoS.
              </p>
            </div>

            {/* OPK Health */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0d0f15] border border-slate-200 dark:border-white/[0.08] space-y-1.5">
              <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400">
                <span className="flex items-center gap-1 text-slate-800 dark:text-neutral-300 font-bold">
                  <Shield className="w-3.5 h-3.5 text-[#285C70]" />
                  OPK Pool
                </span>
                <span className="text-[10px] font-bold text-[#285C70]">{opkRemainingCount} Available</span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    opkRemainingCount > 20 ? 'bg-[#285C70]' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, (opkRemainingCount / 60) * 100)}%` }}
                />
              </div>
              <p className="text-[9px] text-slate-500 font-sans">
                Single-use One-Time PreKeys. Refills automatically when pool &lt; 10.
              </p>
            </div>
          </div>

          {/* Post-Compromise Security (Break-in Recovery) Demonstration */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0e1117] border border-[#285C70]/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[#285C70] font-bold">
                <Sparkles className="w-4 h-4" />
                <span>Post-Compromise Security (Break-In Recovery) Lab</span>
              </div>
              <button
                type="button"
                onClick={handleSimulateCompromise}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-500/20 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40 font-mono text-[11px] transition-colors font-bold self-start sm:self-auto"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Simulate State Compromise</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-neutral-400 leading-relaxed font-sans">
              If an attacker steals your device memory today, they obtain your current Root Key. However, as soon as the uncompromised user sends a reply message, the Double Ratchet generates fresh uncompromised Curve25519 entropy, <strong>self-healing the session</strong> and permanently cutting off the attacker!
            </p>

            {compromiseLog && (
              <div className="p-3.5 rounded-xl bg-white dark:bg-black/60 border border-rose-300 dark:border-rose-500/20 space-y-1.5 shadow-sm">
                <div className="flex justify-between items-center text-[10px] text-rose-700 dark:text-rose-400 font-bold">
                  <span>EXPOSED ROOT KEY AT STEP #{compromiseLog.turnCount}:</span>
                  <span>{new Date(compromiseLog.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/10 text-[10px] text-rose-800 dark:text-rose-300 break-all select-text font-mono">
                  {compromiseLog.compromisedKeyHex}
                </div>
                <div className="text-[10px] text-[#285C70] pt-1 flex items-center gap-1 font-sans font-semibold">
                  <Lock className="w-3 h-3" />
                  <span>
                    Send a reply message now to witness the DH Ratchet derive a completely unlinked Root Key!
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
