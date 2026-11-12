import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { MessageBubble } from './MessageBubble';
import { ChatWelcomeHub } from './messenger/ChatWelcomeHub';
import { LiquidButton } from './common/LiquidButton';
import type { MessageAttachment } from '../types/crypto';
import {
  ShieldCheck,
  ShieldAlert,
  Send,
  Sliders,
  AlertTriangle,
  Flame,
  ArrowLeft,
  Plus,
  FileText,
  X
} from 'lucide-react';

interface ChatViewportProps {
  onOpenLabs?: () => void;
  onOpenSafetyNumbers?: () => void;
  onOpenProtocol?: () => void;
  onOpenRelay?: () => void;
  onOpenSwitchUser?: () => void;
}

export const ChatViewport: React.FC<ChatViewportProps> = ({
  onOpenLabs = () => {},
  onOpenSafetyNumbers = () => {},
  onOpenProtocol = () => {},
  onOpenRelay = () => {},
  onOpenSwitchUser = () => {}
}) => {
  const {
    activePeerId,
    activePeerInfo,
    messages,
    activeSession,
    isSafetyNumberVerified,
    setIsInspectorOpen,
    setIsSafetyModalOpen,
    sendMessage,
    resetPeerSession,
    selectPeer
  } = useChat();

  const [inputVal, setInputVal] = useState('');
  const [attachment, setAttachment] = useState<MessageAttachment | null>(null);
  const [simulateTamper, setSimulateTamper] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setSendError('File exceeds 5MB payload limit for AEAD encryption');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const isImg = file.type.startsWith('image/');
      setAttachment({
        name: file.name,
        size: file.size,
        type: isImg ? 'image' : 'file',
        mimeType: file.type || 'application/octet-stream',
        dataUrl: reader.result as string
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputVal.trim() && !attachment) || isSending) return;

    setIsSending(true);
    setSendError(null);
    try {
      await sendMessage(inputVal.trim(), simulateTamper, attachment || undefined);
      setInputVal('');
      setAttachment(null);
      setSimulateTamper(false);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('Send message failed:', err);
      setSendError(errMsg);
      setTimeout(() => setSendError(null), 6000);
    } finally {
      setIsSending(false);
    }
  };

  // If no peer is selected, render the rich SaaS Welcome Hub (Image 2 style)
  if (!activePeerId) {
    return (
      <ChatWelcomeHub
        onOpenLabs={onOpenLabs}
        onOpenSafetyNumbers={onOpenSafetyNumbers}
        onOpenProtocol={onOpenProtocol}
        onOpenRelay={onOpenRelay}
        onOpenSwitchUser={onOpenSwitchUser}
      />
    );
  }

  const counters = activeSession ? activeSession.getCounters() : { nSend: 0, nRecv: 0, pnPrevious: 0 };

  return (
    <div className="flex-1 h-full bg-transparent flex flex-col justify-between overflow-hidden transition-colors relative z-10">
      {/* Top Conversation Header */}
      <header className="h-16 px-6 border-b border-slate-200 dark:border-white/[0.08] bg-white/90 dark:bg-[#07080a]/90 backdrop-blur-md flex items-center justify-between select-none z-10 transition-colors">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => selectPeer('')}
            className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-600 dark:text-neutral-400"
            title="Back to Directory"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-neutral-800 dark:to-neutral-700 border border-slate-300 dark:border-white/[0.08] flex items-center justify-center font-mono font-semibold text-sm text-slate-800 dark:text-neutral-200 shadow-sm">
            {activePeerId.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-slate-900 dark:text-neutral-100">
                @{activePeerId}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  activePeerInfo?.isOnline ? 'bg-[#285C70] shadow-[0_0_8px_#285C70]' : 'bg-slate-400 dark:bg-neutral-600'
                }`}
                title={activePeerInfo?.isOnline ? 'Online via WebSocket' : 'Offline (Queued via Relay)'}
              />
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-neutral-400">
              <span className="font-medium text-[#285C70]">
                {activeSession ? 'Double Ratchet Active' : 'X3DH Initial State'}
              </span>
              <span>•</span>
              <span>
                Ratchet Turns: Tx {counters.nSend} / Rx {counters.nRecv}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls & Safety Status */}
        <div className="flex items-center gap-2.5">
          {/* Safety Number Button */}
          <button
            type="button"
            onClick={() => setIsSafetyModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
              isSafetyNumberVerified
                ? 'bg-[#285C70]/10 border-[#285C70]/30 text-[#285C70] hover:bg-[#285C70]/20'
                : 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
            }`}
            title="Inspect 60-digit deterministic Safety Number"
          >
            {isSafetyNumberVerified ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Identity</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Unverified Identity</span>
              </>
            )}
          </button>

          {/* Session Reset Button */}
          {activeSession && (
            <button
              type="button"
              onClick={() => resetPeerSession(activePeerId)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-neutral-400 text-[11px] font-mono transition-colors cursor-pointer"
              title="Reset Double Ratchet state to force a fresh X3DH handshake"
            >
              <span>Re-key</span>
            </button>
          )}

          {/* Session Inspector Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsInspectorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-neutral-300 text-xs font-mono transition-colors"
            title="Open Live Cryptographic State Inspector"
          >
            <Sliders className="w-3.5 h-3.5 text-[#285C70]" />
            <span className="hidden sm:inline">Inspector</span>
          </button>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <main className="flex-1 overflow-y-auto p-6 space-y-2">
        {messages.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 dark:text-neutral-500 text-xs font-mono select-none">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center mb-2">
              <ShieldCheck className="w-5 h-5 text-[#285C70]" />
            </div>
            <span className="font-semibold text-slate-700 dark:text-neutral-300">
              Session ready with @{activePeerId}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-neutral-500 mt-1 max-w-md">
              {activePeerInfo
                ? 'Send your first message to complete the 4-part Diffie-Hellman handshake.'
                : `@${activePeerId} is not registered on the relay yet. Open another browser or Incognito window and log in as @${activePeerId}.`}
            </span>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Message Input Footer */}
      <footer className="p-4 border-t border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#07080a]/95 backdrop-blur-md transition-colors">
        {/* Protocol Telemetry Pill above input */}
        <div className="flex items-center justify-between text-[11px] font-mono mb-2 px-1 select-none">
          <div className="flex items-center gap-2 text-slate-500 dark:text-neutral-400">
            <span className="flex items-center gap-1 text-[#285C70] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#285C70] animate-pulse" />
              AES-256-GCM
            </span>
            <span className="text-slate-300 dark:text-neutral-600">|</span>
            <span>
              Chain State: Tx #{counters.nSend} (prev pn {counters.pnPrevious})
            </span>
          </div>

          {/* Adversarial Simulation Toggle */}
          <button
            type="button"
            onClick={() => setSimulateTamper(!simulateTamper)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono transition-colors border ${
              simulateTamper
                ? 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/40 animate-pulse font-semibold'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-white/[0.06]'
            }`}
            title="Toggle adversarial bit-flip simulation to prove AEAD auth rejection"
          >
            <Flame className="w-3 h-3 text-rose-500" />
            <span>{simulateTamper ? 'Attacker Bit-Flip Active' : 'Simulate Packet Tampering'}</span>
          </button>
        </div>

        {simulateTamper && (
          <div className="mb-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 text-[11px] font-mono flex items-center gap-2 shadow-sm">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>
              <strong>Attacker Simulation Enabled:</strong> Next message ciphertext byte 0 will be corrupted in transit. The receiver will reject it with an AEAD authentication tag error!
            </span>
          </div>
        )}

        {sendError && (
          <div className="mb-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/40 text-rose-800 dark:text-rose-200 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{sendError}</span>
          </div>
        )}

        {/* Active Attachment Staging Preview */}
        {attachment && (
          <div className="mb-3 p-2.5 rounded-2xl bg-white dark:bg-[#10141c] border border-slate-200 dark:border-white/[0.1] flex items-center justify-between text-xs font-mono shadow-sm">
            <div className="flex items-center gap-3 overflow-hidden">
              {attachment.type === 'image' ? (
                <img
                  src={attachment.dataUrl}
                  alt={attachment.name}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-[#285C70]/10 text-[#285C70] border border-[#285C70]/20 flex items-center justify-center font-bold shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
              )}
              <div className="overflow-hidden">
                <span className="font-semibold text-slate-800 dark:text-neutral-200 truncate block max-w-xs">
                  {attachment.name}
                </span>
                <span className="text-[10px] text-[#285C70] font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#285C70] animate-pulse" />
                  {(attachment.size / 1024).toFixed(1)} KB • E2EE Encrypted Payload
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-colors"
              title="Remove Attachment"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Form with Real Attachment Button */}
        <form onSubmit={handleSend} className="flex items-center gap-2">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,.pdf,.txt,.json,.zip,.doc,.docx"
            className="hidden"
          />

          {/* Real + Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#0b0d12] dark:hover:bg-white/[0.08] text-slate-700 dark:text-neutral-300 hover:text-[#285C70] border border-slate-300 dark:border-white/[0.08] transition-colors cursor-pointer flex items-center justify-center shrink-0 group shadow-xs"
            title="Add File or Photo (E2EE Encrypted with AES-256-GCM)"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform text-slate-600 dark:text-neutral-300 group-hover:text-[#285C70]" />
          </button>

          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={attachment ? 'Add an encrypted caption...' : `Message @${activePeerId} with end-to-end encryption...`}
            className="flex-1 bg-slate-100 dark:bg-[#0b0d12] border border-slate-300 dark:border-white/[0.08] focus:border-[#285C70]/50 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-neutral-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none transition-colors"
            autoFocus
          />
          <LiquidButton
            type="submit"
            variant="brand"
            size="md"
            disabled={(!inputVal.trim() && !attachment) || isSending}
            icon={Send}
            iconPosition="right"
          >
            <span>Send</span>
          </LiquidButton>
        </form>
      </footer>
    </div>
  );
};
