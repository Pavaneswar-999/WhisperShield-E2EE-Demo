import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { SafetyNumber } from '../../crypto/safety-number';
import { base64ToUint8Array } from '../../crypto/cipher';
import { TransportEngine } from '../../network/transport';
import { LiquidButton } from '../common/LiquidButton';
import QRCode from 'qrcode';
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Zap,
  Lock
} from 'lucide-react';

export const SafetyNumbersView: React.FC = () => {
  const {
    currentUser,
    allPeers,
    isSafetyNumberVerified,
    verifySafetyNumber
  } = useChat();

  const [selectedPeerId, setSelectedPeerId] = useState<string>('bob');
  const [safetyNumber, setSafetyNumber] = useState<string | null>(null);
  const [benchmarkMs, setBenchmarkMs] = useState<number | null>(null);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const calculate = async () => {
      if (!currentUser) return;
      try {
        const peerBundle = await TransportEngine.fetchPreKeyBundle(selectedPeerId);
        const myIK = base64ToUint8Array(currentUser.identityDHKeyPair.publicKey);
        const peerIK = base64ToUint8Array(peerBundle.identityKey);

        const sn = await SafetyNumber.generate(myIK, peerIK);
        setSafetyNumber(sn);

        if (canvasRef.current) {
          await QRCode.toCanvas(canvasRef.current, sn, {
            width: 200,
            margin: 1,
            color: {
              dark: '#285C70',
              light: '#FFFFFF'
            }
          });
        }
      } catch (err) {
        console.warn('Could not compute safety number for peer:', err);
        setSafetyNumber(null);
      }
    };

    calculate();
  }, [currentUser, selectedPeerId]);

  const runBenchmark = async () => {
    if (!currentUser) return;
    setIsBenchmarking(true);
    const start = performance.now();
    try {
      const myIK = base64ToUint8Array(currentUser.identityDHKeyPair.publicKey);
      const testRemoteIK = new Uint8Array(32);
      testRemoteIK.fill(0x42);
      await SafetyNumber.generate(myIK, testRemoteIK);
      const end = performance.now();
      setBenchmarkMs(Math.round(end - start));
    } finally {
      setIsBenchmarking(false);
    }
  };

  const handleCopy = () => {
    if (safetyNumber) {
      navigator.clipboard.writeText(safetyNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const blocks = safetyNumber ? safetyNumber.split(' ') : [];

  return (
    <div className="flex-1 h-full overflow-y-auto px-6 py-8 sm:px-10 sm:py-10 select-none space-y-10 bg-transparent relative z-10 transition-colors">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#285C70]/10 border border-[#285C70]/25 text-xs font-semibold text-[#285C70] backdrop-blur-md bg-white/50 dark:bg-black/30">
            <KeyRound className="w-3.5 h-3.5" />
            <span>OUT-OF-BAND INTEGRITY AUDIT</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-neutral-100 font-sans">
            Safety Numbers & Identity Verification
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-neutral-300 max-w-3xl leading-relaxed">
            Verify identity keys out-of-band to prevent active Man-in-the-Middle (MitM) attacks. WhisperShield sorts both identity keys lexicographically and processes them through <strong>5,200 rounds of SHA-512 proof-of-work</strong> to produce a standardized 60-digit sequence.
          </p>
        </div>

        {/* Peer Selector Bar */}
        <div className="p-4 rounded-2xl bg-white/85 dark:bg-[#0f1219]/85 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.1] shadow-card-studio flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-slate-700 dark:text-neutral-300">
              Select Peer to Verify:
            </span>
            <div className="flex items-center gap-1.5">
              {['bob', 'charlie', ...allPeers.map((p) => p.userId).filter((id) => id !== 'bob' && id !== 'charlie')].slice(0, 4).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedPeerId(id)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                    selectedPeerId === id
                      ? 'bg-[#285C70] text-white font-bold shadow-sm shadow-[#285C70]/20'
                      : 'bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-neutral-300 hover:bg-slate-200'
                  }`}
                >
                  @{id}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-neutral-400">
            <span>Status:</span>
            <span className={`font-semibold ${isSafetyNumberVerified ? 'text-[#285C70]' : 'text-amber-600 dark:text-amber-400'}`}>
              {isSafetyNumberVerified ? '✓ Identity Confirmed' : '! Pending Verification'}
            </span>
          </div>
        </div>

        {/* Main 60-Digit Fingerprint & QR Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* QR Code Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0d0f15] border border-slate-200 dark:border-white/[0.08] shadow-card-light flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-black/60 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm">
              <canvas ref={canvasRef} className="rounded-lg" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-neutral-100 block">
                Deterministic Visual Matrix
              </span>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed font-sans">
                Scan via camera on a trusted device or verify the 12 blocks manually.
              </p>
            </div>
          </div>

          {/* 60-Digit Decimal Matrix Card */}
          <div className="lg:col-span-2 p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0d0f15] border border-slate-200 dark:border-white/[0.08] shadow-card-light flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#285C70]/10 border border-[#285C70]/25 text-[#285C70] flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100 font-sans">
                      12 Blocks of 5 Decimal Digits
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono">
                      Sorted: min(@{currentUser?.userId}, @{selectedPeerId})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] text-xs font-mono text-slate-700 dark:text-neutral-300 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#285C70]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* 12 blocks grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 font-mono">
                {blocks.map((block, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-black/50 border border-slate-200 dark:border-white/[0.06] text-center text-sm font-bold text-slate-900 dark:text-neutral-100 tracking-wider hover:border-[#285C70]/50 transition-colors"
                  >
                    {block}
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Toggle */}
            <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isSafetyNumberVerified ? (
                  <ShieldCheck className="w-5 h-5 text-[#285C70]" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-amber-500" />
                )}
                <div>
                  <span className="text-xs font-bold font-sans text-slate-900 dark:text-neutral-100 block">
                    {isSafetyNumberVerified ? 'Marked as Verified' : 'Unverified Status'}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-sans">
                    Persisted in IndexedDB. Alerts trigger if peer replaces keys.
                  </span>
                </div>
              </div>

              <LiquidButton
                variant={isSafetyNumberVerified ? 'secondary' : 'brand'}
                size="md"
                onClick={() => verifySafetyNumber(!isSafetyNumberVerified)}
                icon={isSafetyNumberVerified ? ShieldAlert : ShieldCheck}
              >
                {isSafetyNumberVerified ? 'Mark as Unverified' : 'Confirm & Mark Verified'}
              </LiquidButton>
            </div>
          </div>
        </div>

        {/* Proof-of-Work Benchmark Sandbox */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0d0f15] border border-slate-200 dark:border-white/[0.08] shadow-card-light space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#285C70]/10 border border-[#285C70]/30 flex items-center justify-center text-[#285C70]">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-neutral-100 font-sans">
                  5,200 Rounds SHA-512 Proof-of-Work Benchmark
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 font-mono">
                  Tests local key stretching duration to prevent adversarial collision attacks
                </p>
              </div>
            </div>

            <LiquidButton
              variant="brand"
              size="md"
              disabled={isBenchmarking}
              onClick={runBenchmark}
              icon={Zap}
            >
              <span>{isBenchmarking ? 'Benchmarking 5,200 Rounds...' : 'Run Benchmark'}</span>
            </LiquidButton>
          </div>

          {benchmarkMs !== null && (
            <div className="p-4 rounded-2xl bg-[#285C70]/10 border border-[#285C70]/30 text-xs font-mono flex items-center justify-between text-slate-900 dark:text-neutral-100">
              <span>Benchmark Completed: 5,200 SHA-512 iterations computed in <strong>{benchmarkMs} ms</strong></span>
              <span className="font-bold text-[#285C70]">Rate: ~{(5200 / (benchmarkMs / 1000)).toFixed(0)} hashes/sec</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
