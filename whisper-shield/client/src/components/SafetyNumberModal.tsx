import React, { useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import QRCode from 'qrcode';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  QrCode,
  KeyRound,
  Lock
} from 'lucide-react';

export const SafetyNumberModal: React.FC = () => {
  const {
    isSafetyModalOpen,
    setIsSafetyModalOpen,
    activePeerId,
    currentUser,
    safetyNumber,
    isSafetyNumberVerified,
    verifySafetyNumber
  } = useChat();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (isSafetyModalOpen && safetyNumber && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, safetyNumber, {
        width: 180,
        margin: 1,
        color: {
          dark: '#285C70',
          light: '#FFFFFF'
        }
      }).catch((err) => {
        console.error('Failed to generate QR code canvas:', err);
      });
    }
  }, [isSafetyModalOpen, safetyNumber]);

  if (!isSafetyModalOpen) return null;

  const blocks = safetyNumber ? safetyNumber.split(' ') : [];

  const handleCopy = () => {
    if (safetyNumber) {
      navigator.clipboard.writeText(safetyNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const localIKPreview = currentUser?.identityDHKeyPair.publicKey
    ? currentUser.identityDHKeyPair.publicKey.substring(0, 12) + '...'
    : 'Unknown';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-lg bg-white dark:bg-[#090b0f] border border-slate-200 dark:border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between bg-slate-50 dark:bg-[#0e1117]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#285C70]/10 border border-[#285C70]/30 text-[#285C70] flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-neutral-100 font-mono">
                Cryptographic Safety Number
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                Verify Peer: @{activePeerId || 'none'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSafetyModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs font-mono">
          {/* QR Code and Explanation */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 dark:bg-[#0d0f15] border border-slate-200 dark:border-white/[0.08]">
            <div className="p-2.5 bg-white dark:bg-[#050506] rounded-xl border border-slate-200 dark:border-white/[0.08] shrink-0 shadow-sm">
              <canvas ref={canvasRef} className="rounded" />
            </div>

            <div className="space-y-2 text-slate-700 dark:text-neutral-300 text-[11px] font-sans leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-[#285C70] font-mono">
                <Lock className="w-3.5 h-3.5" />
                <span>Out-of-Band Fingerprint</span>
              </div>
              <p className="text-slate-600 dark:text-neutral-400 text-xs">
                To confirm that no untrusted relay server or Man-in-the-Middle (MitM) attacker has substituted public keys, compare this 60-digit number with <strong>@{activePeerId}</strong> on a secure secondary channel or scan the QR code.
              </p>
              <div className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono pt-1">
                Proof-of-Work: 5,200 rounds of SHA-512 over sorted Curve25519 identity keys.
              </div>
            </div>
          </div>

          {/* 60-Digit Numeric Fingerprint Matrix */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0d0f15] border border-slate-200 dark:border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between text-slate-600 dark:text-neutral-400">
              <span className="text-[#285C70] font-bold flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" />
                60-Digit Cryptographic Sequence
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-[#285C70]" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* 12 blocks of 5 digits in a 3x4 grid */}
            <div className="grid grid-cols-3 gap-2 py-1 select-text">
              {blocks.map((block, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-white dark:bg-black/60 border border-slate-200 dark:border-white/[0.04] text-center font-mono text-[13px] tracking-widest text-slate-900 dark:text-neutral-200 font-semibold shadow-xs"
                >
                  {block}
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200/70 dark:border-white/[0.04] flex items-center justify-between text-[10px] text-slate-400 dark:text-neutral-500 font-mono">
              <span>Local IK: {localIKPreview}</span>
              <span>Sorted Lexicographically</span>
            </div>
          </div>

          {/* Verification Status & Manual Toggle */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0d0f15] border border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isSafetyNumberVerified
                    ? 'bg-[#285C70]/15 text-[#285C70]'
                    : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                }`}
              >
                {isSafetyNumberVerified ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : (
                  <ShieldAlert className="w-4 h-4" />
                )}
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-neutral-200 block text-xs">
                  {isSafetyNumberVerified ? 'Identity Verified' : 'Identity Unverified'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-neutral-500 font-sans">
                  {isSafetyNumberVerified
                    ? 'Keys confirmed authentic. Alerts will fire if peer keys rotate.'
                    : 'Verification pending. Compare numbers to protect against MitM.'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => verifySafetyNumber(!isSafetyNumberVerified)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                isSafetyNumberVerified
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30'
                  : 'bg-[#285C70] hover:bg-[#1C3E4E] text-white border-[#285C70] shadow-sm'
              }`}
            >
              {isSafetyNumberVerified ? 'Mark Unverified' : 'Mark as Verified'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
