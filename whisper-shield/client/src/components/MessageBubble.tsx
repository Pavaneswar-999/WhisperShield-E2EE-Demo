import React, { useState } from 'react';
import type { ChatMessage } from '../types/crypto';
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  ChevronDown,
  ChevronUp,
  Download,
  FileText
} from 'lucide-react';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const [showTelemetry, setShowTelemetry] = useState(false);
  const isOutgoing = message.direction === 'outgoing';

  const timeString = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className={`flex flex-col mb-4 ${isOutgoing ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 border transition-all ${
          message.status === 'failed'
            ? 'bg-rose-50 text-rose-800 border-rose-300 shadow-sm dark:bg-rose-950/30 dark:border-rose-500/40 dark:text-rose-200'
            : isOutgoing
            ? 'bg-[#285C70] text-white border-[#285C70] shadow-sm dark:bg-[#16303D] dark:border-[#285C70]/40 dark:text-[#FFFAF8]'
            : 'bg-white text-[#16303D] border-[#E2DDDA] shadow-sm dark:bg-[#111111] dark:border-white/[0.08] dark:text-[#F2EDEA]'
        }`}
      >
        {/* Encrypted Attachment Display (Image / Document) */}
        {message.attachment && message.attachment.dataUrl?.startsWith('data:') && (
          <div className="mb-2">
            {message.attachment.type === 'image' &&
            message.attachment.dataUrl.startsWith('data:image/') &&
            !message.attachment.dataUrl.startsWith('data:image/svg+xml') ? (
              <div className="relative group rounded-xl overflow-hidden border border-black/10 dark:border-white/10 max-w-sm bg-black/20">
                <img
                  src={message.attachment.dataUrl}
                  alt={message.attachment.name}
                  className="w-full max-h-72 object-cover"
                />
                <a
                  href={message.attachment.dataUrl}
                  download={message.attachment.name}
                  rel="noopener noreferrer"
                  className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-mono shadow-sm"
                  title="Download Decrypted Image"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            ) : (
              <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                isOutgoing
                  ? 'bg-[#1C3E4E]/40 border-[#285C70]/30 text-white'
                  : 'bg-[#F2EDEA] dark:bg-white/[0.04] border-[#D8D3D1] dark:border-white/[0.08] text-[#16303D] dark:text-[#F2EDEA]'
              }`}>
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="p-2 rounded-lg bg-[#285C70]/20 text-[#285C70] dark:text-[#6C9BAD]">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="font-mono text-xs font-semibold truncate block max-w-[180px]">
                      {message.attachment.name}
                    </span>
                    <span className="text-[10px] opacity-75 font-mono">
                      {(message.attachment.size / 1024).toFixed(1)} KB • AES-256 Encrypted
                    </span>
                  </div>
                </div>
                <a
                  href={message.attachment.dataUrl}
                  download={message.attachment.name}
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors shrink-0 text-current"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Message Content */}
        {message.content && (
          <p className="text-[14px] leading-relaxed break-words select-text font-sans">{message.content}</p>
        )}

        {/* Bubble Footer & Metadata */}
        <div
          className={`flex items-center justify-between gap-4 mt-2 pt-1 border-t text-[11px] ${
            isOutgoing
              ? 'border-white/20 text-white/80 dark:border-white/[0.04] dark:text-[#989898]'
              : 'border-[#E2DDDA] text-[#757575] dark:border-white/[0.04] dark:text-[#989898]'
          }`}
        >
          <span className="font-mono">{timeString}</span>

          <div className="flex items-center gap-1.5">
            {message.telemetry && (
              <button
                type="button"
                onClick={() => setShowTelemetry(!showTelemetry)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] transition-colors ${
                  isOutgoing
                    ? 'bg-black/20 hover:bg-black/30 text-white dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-[#6C9BAD]'
                    : 'bg-[#F2EDEA] hover:bg-[#E2DDDA] text-[#16303D] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-[#6C9BAD]'
                }`}
                title="View Cryptographic Header & AEAD Tag"
              >
                <Key className="w-2.5 h-2.5" />
                <span>
                  n:{message.telemetry.n} pn:{message.telemetry.pn}
                </span>
                {showTelemetry ? (
                  <ChevronUp className="w-2.5 h-2.5" />
                ) : (
                  <ChevronDown className="w-2.5 h-2.5" />
                )}
              </button>
            )}

            {message.status === 'delivered' ? (
              <span
                className={`flex items-center gap-1 font-mono text-[10px] ${
                  isOutgoing ? 'text-white/90 dark:text-[#6C9BAD]' : 'text-[#285C70] dark:text-[#6C9BAD]'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>AEAD</span>
              </span>
            ) : message.status === 'sent' ? (
              <span
                className={`flex items-center gap-1 font-mono text-[10px] ${
                  isOutgoing ? 'text-white/80 dark:text-amber-300' : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Queued</span>
              </span>
            ) : message.status === 'failed' ? (
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-mono text-[10px] font-bold">
                <ShieldAlert className="w-3 h-3" />
                <span>FAILED</span>
              </span>
            ) : (
              <span className="text-slate-400 font-mono text-[10px]">...</span>
            )}
          </div>
        </div>

        {/* Expandable Cryptographic Telemetry Drawer */}
        {showTelemetry && message.telemetry && (
          <div
            className={`mt-2.5 pt-2.5 border-t rounded-xl p-2.5 font-mono text-[10px] space-y-1.5 select-text ${
              isOutgoing
                ? 'border-white/20 bg-black/20 text-white dark:bg-black/50 dark:border-white/[0.08] dark:text-neutral-300'
                : 'border-slate-200 bg-slate-50 text-slate-700 dark:bg-black/50 dark:border-white/[0.08] dark:text-neutral-300'
            }`}
          >
            <div className="flex justify-between items-center font-semibold border-b border-white/[0.1] pb-1">
              <span>CRYPTOGRAPHIC TELEMETRY</span>
              <span>{message.telemetry.cipher}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Ratchet PubKey:</span>
              <span className="font-semibold">{message.telemetry.ratchetKeySnippet}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Chain Counter (n):</span>
              <span className="font-semibold">{message.telemetry.n}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Prev Chain Len (pn):</span>
              <span className="font-semibold">{message.telemetry.pn}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">AES-GCM IV (96-bit):</span>
              <span className="font-semibold">{message.telemetry.iv.substring(0, 12)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-70">Auth Tag (128-bit):</span>
              <span className="font-semibold text-[#285C70] dark:text-[#6C9BAD]">{message.telemetry.tag.substring(0, 16)}...</span>
            </div>
            <div className="text-[9px] opacity-75 pt-1 border-t border-white/[0.06]">
              ✓ Canonical JSON header bound into Authenticated Additional Data (AAD).
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
