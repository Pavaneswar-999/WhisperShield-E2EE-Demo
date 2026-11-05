import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import {
  RefreshCw,
  KeyRound,
  UserCheck,
  Circle,
  ExternalLink,
  Users,
  ArrowRight
} from 'lucide-react';

interface SidebarProps {
  onOpenSwitchUser: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSwitchUser }) => {
  const {
    currentUser,
    activePeerId,
    allPeers,
    selectPeer,
    opkRemainingCount,
    refillOPKs
  } = useChat();

  const [newPeerInput, setNewPeerInput] = useState('');
  const [isRefilling, setIsRefilling] = useState(false);

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = newPeerInput.trim().toLowerCase() || 'bob';
    if (target !== currentUser?.userId) {
      await selectPeer(target);
      setNewPeerInput('');
    }
  };

  const handleRefill = async () => {
    setIsRefilling(true);
    try {
      await refillOPKs(50);
    } finally {
      setIsRefilling(false);
    }
  };

  const idFingerprint = currentUser?.identityDHKeyPair.publicKey
    ? currentUser.identityDHKeyPair.publicKey.substring(0, 10) + '...'
    : 'Generating...';

  return (
    <aside className="w-80 h-full bg-white/90 dark:bg-[#07080a]/90 backdrop-blur-xl border-r border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between select-none transition-colors relative z-20">
      {/* Top Header & Identity Card */}
      <div className="p-3.5 space-y-3.5">
        {/* Current User Identity Panel */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0d0f14] border border-slate-200 dark:border-white/[0.08] space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#285C70] to-[#60899B] flex items-center justify-center text-xs font-bold text-white shadow-sm font-mono">
                {currentUser?.userId ? currentUser.userId.charAt(0).toUpperCase() : '?'}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-neutral-100 font-mono block">
                  @{currentUser?.userId || 'anonymous'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-neutral-500 font-mono">Active Principal</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenSwitchUser}
              className="text-[11px] font-mono px-2 py-1 rounded-lg bg-white dark:bg-white/[0.06] hover:bg-slate-100 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-white/[0.08] transition-colors flex items-center gap-1 shadow-xs"
              title="Switch between Alice / Bob or create identity"
            >
              <span>Switch</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Identity Fingerprint */}
          <div className="pt-2 border-t border-slate-200/70 dark:border-white/[0.04] flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500 dark:text-neutral-500 flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-slate-400 dark:text-neutral-400" />
              IK PubKey:
            </span>
            <span className="text-slate-700 dark:text-neutral-300 text-[10px] bg-slate-200/60 dark:bg-black/40 px-1.5 py-0.5 rounded font-mono">
              {idFingerprint}
            </span>
          </div>

          {/* One-Time PreKey Pool Health */}
          <div className="pt-1 flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-neutral-500">OPK Pool:</span>
              <span
                className={`font-semibold ${
                  opkRemainingCount > 15 ? 'text-[#285C70]' : 'text-amber-500'
                }`}
              >
                {opkRemainingCount} remaining
              </span>
            </div>

            <button
              type="button"
              onClick={handleRefill}
              disabled={isRefilling}
              className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-white/[0.06] hover:bg-slate-100 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-white/[0.06] transition-colors"
              title="Refill 50 fresh Curve25519 One-Time PreKeys"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isRefilling ? 'animate-spin' : ''}`} />
              <span>Refill</span>
            </button>
          </div>
        </div>

        {/* Start New Handshake Input */}
        <form onSubmit={handleStartChat} className="space-y-1.5">
          <div className="relative">
            <input
              type="text"
              value={newPeerInput}
              onChange={(e) => setNewPeerInput(e.target.value)}
              placeholder="Chat with @username (e.g. bob)..."
              className="w-full bg-slate-100 dark:bg-[#0a0c10] border border-slate-200 dark:border-white/[0.08] focus:border-[#285C70]/50 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-neutral-200 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none transition-colors pr-8"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-lg bg-white dark:bg-white/[0.06] hover:bg-[#285C70]/20 text-slate-500 hover:text-[#285C70] transition-colors cursor-pointer"
              title="Open Encrypted Channel"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-0.5">
            <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">Quick:</span>
            <button
              type="button"
              onClick={() => selectPeer('bob')}
              className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#285C70]/10 text-[#285C70] border border-[#285C70]/20 hover:bg-[#285C70]/25 transition-colors cursor-pointer"
            >
              @bob (Online)
            </button>
            <button
              type="button"
              onClick={() => selectPeer('charlie')}
              className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 transition-colors cursor-pointer"
            >
              @charlie (Offline)
            </button>
          </div>
        </form>

        {/* Registered Contacts / Peers List */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-neutral-500 px-1 mb-2">
            <span className="flex items-center gap-1 font-semibold">
              <Users className="w-3 h-3" />
              PEER DIRECTORY
            </span>
            <span>{allPeers.length} Registered</span>
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-320px)] pr-0.5">
            {allPeers.length === 0 ? (
              <div className="p-4 text-center rounded-xl border border-dashed border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-neutral-500 text-xs">
                No peers registered yet.
                <div className="mt-1 text-[10px] text-slate-400 dark:text-neutral-600">
                  Switch to Bob or Charlie in the top bar to initialize their keys.
                </div>
              </div>
            ) : (
              allPeers.map((peer) => {
                const isSelected = activePeerId === peer.userId;
                return (
                  <button
                    key={peer.userId}
                    type="button"
                    onClick={() => selectPeer(peer.userId)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#285C70]/10 border-[#285C70]/40 text-[#285C70] shadow-sm'
                        : 'bg-white hover:bg-slate-50 dark:bg-[#090b0e] dark:hover:bg-[#0e1117] border-slate-200/80 dark:border-white/[0.04] text-slate-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="relative">
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-neutral-800 border border-slate-300 dark:border-white/[0.08] flex items-center justify-center text-xs font-mono font-medium text-slate-800 dark:text-neutral-200">
                          {peer.userId.charAt(0).toUpperCase()}
                        </div>
                        <Circle
                          className={`w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 fill-current ${
                            peer.isOnline ? 'text-[#285C70]' : 'text-slate-400 dark:text-neutral-600'
                          }`}
                        />
                      </div>
                      <div className="truncate">
                        <span className="block text-xs font-semibold font-mono truncate">
                          @{peer.userId}
                        </span>
                        <span className="block text-[10px] text-slate-500 dark:text-neutral-500 font-mono truncate">
                          OPKs: {peer.remainingOPKs} left
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="text-[10px] font-mono text-[#285C70] flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Footer / Zero-Knowledge Protocol Notice */}
      <div className="p-3 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#050608] text-[10px] font-mono text-slate-500 dark:text-neutral-500 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-slate-600 dark:text-neutral-400">Relay Trust Model</span>
          <span className="text-[#285C70] font-bold">Zero-Knowledge</span>
        </div>
        <p className="text-[9px] text-slate-400 dark:text-neutral-600 leading-tight">
          Blind packet forwarding with SQLite. Holds no master secrets or plaintext.
        </p>
      </div>
    </aside>
  );
};
