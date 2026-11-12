import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { LiquidButton } from '../common/LiquidButton';
import { JellyRadio } from '../reactbits/JellyRadio';
import { TiltCard } from '../common/TiltCard';
import { TextPressure } from '../reactbits/TextPressure';
import {
  ArrowRight,
  Shield,
  Circle
} from 'lucide-react';

interface ChatWelcomeHubProps {
  onOpenLabs: () => void;
  onOpenSafetyNumbers: () => void;
  onOpenProtocol?: () => void;
  onOpenRelay?: () => void;
  onOpenSwitchUser?: () => void;
}

export const ChatWelcomeHub: React.FC<ChatWelcomeHubProps> = ({
  onOpenLabs,
  onOpenSafetyNumbers,
  onOpenProtocol = () => {},
  onOpenRelay = () => {},
  onOpenSwitchUser = () => {}
}) => {
  const { currentUser, selectPeer, allPeers, isConnected } = useChat();
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const handleSelectPeer = async (peerId: string) => {
    await selectPeer(peerId);
  };

  const username = currentUser?.userId || 'guest';
  const primaryPeerId = username === 'bob' ? 'alice' : 'bob';
  const secondaryPeerId = username === 'charlie' ? 'bob' : 'charlie';
  const primaryPeer = allPeers.find((p) => p.userId === primaryPeerId);
  const secondaryPeer = allPeers.find((p) => p.userId === secondaryPeerId);

  // Dynamic real-time greeting based on local clock
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 22) return 'Good Evening';
    return 'Good Night';
  };

  const greeting = getGreeting();

  const filterItems = [
    { value: 'all', label: 'All Workspaces' },
    { value: 'handshake', label: 'X3DH Channels' },
    { value: 'offline', label: 'Offline Vaults' },
    { value: 'invariants', label: 'Security Protocols' }
  ];

  return (
    <div className="flex-1 h-full overflow-y-auto px-6 py-10 sm:px-12 sm:py-12 bg-transparent select-none relative z-10">
      <div className="max-w-7xl mx-auto space-y-16 pb-20">
        
        {/* Top Agentic Header with TextPressure Interactive Typography */}
        <div className="space-y-4 pb-2">
          {/* Status Badge & Identity Switcher */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onOpenSwitchUser}
              className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#285C70]/15 hover:bg-[#285C70]/25 border border-[#285C70]/30 hover:border-[#285C70]/50 text-[#285C70] dark:text-[#6C9BAD] text-xs font-mono font-bold backdrop-blur-md transition-all cursor-pointer group"
              title="Click to Switch Persona Identity"
            >
              <span className="w-2 h-2 rounded-full bg-[#285C70] animate-pulse" />
              <span>ACTIVE PRINCIPAL: @{username.toUpperCase()}</span>
              <span className="text-[#808080] dark:text-[#989898]">•</span>
              <span className="text-[11px] font-mono tracking-wider">{greeting.toUpperCase()} • X3DH & DOUBLE RATCHET READY</span>
              <span className="text-[10px] opacity-70 group-hover:opacity-100 underline ml-1">Switch</span>
            </button>

            <div className="hidden sm:block text-[11px] font-mono text-[#517380] dark:text-[#989898]">
              {currentUser ? 'Curve25519 Identity Key Active' : 'Select Persona to Connect'}
            </div>
          </div>

          {/* Interactive TextPressure Hero Typography */}
          <div className="w-full py-4 select-none border-b border-[#E2DDDA] dark:border-white/[0.08] pb-12">
            <TextPressure
              text="Hello!"
              flex
              alpha={false}
              stroke={true}
              width
              weight
              italic
              radius={0.5}
              smoothing={0.5}
              idle="wave"
              idleSpeed={1}
              clickRipple
              strokeColor="#60899B"
              strokeWidth={2}
              minFontSize={56}
              scale={false}
              className="text-[#16303D] dark:text-[#FFFAF8] tracking-tighter"
            />
          </div>
        </div>

        {/* 6-Card Tangible Premium Showcase Grid with REAL IMAGERY */}
        <div className="space-y-8 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight font-sans">
                Cryptographic Workspaces & Channels
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400 font-normal leading-relaxed">
                Select an isolated persona channel or audit mathematical security invariants
              </p>
            </div>

            {/* Tactile JellyRadio Category Selector */}
            <JellyRadio
              items={filterItems}
              value={filterCategory}
              onChange={(val) => setFilterCategory(val)}
              size="sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Card 1: Primary Peer Identity Card (Initial Key Agreement) */}
            {(filterCategory === 'all' || filterCategory === 'handshake') && (
              <TiltCard
                onClick={() => handleSelectPeer(primaryPeerId)}
                maxTilt={12}
                scale={1.03}
                className="p-6 sm:p-7 rounded-3xl bg-white/95 dark:bg-[#0f1117]/90 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-card-studio hover:shadow-card-hover cursor-pointer group flex flex-col justify-between min-h-[420px] overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Real 3D Render Image Banner */}
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/[0.08] shadow-inner bg-slate-900">
                    <img
                      src="/images/bob_identity_card.jpg"
                      alt="Peer Cryptographic Identity Card"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold text-[#285C70] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#285C70] animate-pulse" />
                      <span>X3DH Handshake</span>
                    </div>
                    <div className="absolute bottom-2.5 right-3 text-[10px] font-mono text-white/80 bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
                      IK: 25519
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight group-hover:text-[#285C70] transition-colors font-sans">
                        @{primaryPeerId} · Identity Card
                      </h3>
                      <span
                        className={`text-[11px] font-mono font-semibold flex items-center gap-1 ${
                          primaryPeer?.isOnline ? 'text-[#285C70]' : 'text-slate-400 dark:text-neutral-500'
                        }`}
                      >
                        <Circle className="w-2 h-2 fill-current" />
                        {primaryPeer?.isOnline ? 'Online' : primaryPeer ? 'Offline' : 'Not Joined'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed font-normal">
                      Establish an asynchronous channel via 4-part Diffie-Hellman by consuming @{primaryPeerId}&apos;s published One-Time PreKeys.
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] mt-4">
                  <LiquidButton
                    variant="brand"
                    size="sm"
                    icon={ArrowRight}
                    iconPosition="right"
                    className="w-full justify-between"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPeer(primaryPeerId);
                    }}
                  >
                    <span>Start Handshake Session</span>
                  </LiquidButton>
                </div>
              </TiltCard>
            )}

            {/* Card 2: Secondary Peer / Sealed Envelope (Offline Queue) */}
            {(filterCategory === 'all' || filterCategory === 'offline') && (
              <TiltCard
                onClick={() => handleSelectPeer(secondaryPeerId)}
                maxTilt={12}
                scale={1.03}
                className="p-6 sm:p-7 rounded-3xl bg-white/95 dark:bg-[#0f1117]/90 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-card-studio hover:shadow-card-hover cursor-pointer group flex flex-col justify-between min-h-[420px] overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Real 3D Render Image Banner */}
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/[0.08] shadow-inner bg-slate-900">
                    <img
                      src="/images/charlie_sealed_envelope.jpg"
                      alt="Sealed Envelope"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>Double Ratchet Vault</span>
                    </div>
                    <div className="absolute bottom-2.5 right-3 text-[10px] font-mono text-white/80 bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
                      {secondaryPeer?.isOnline ? 'Live Socket' : 'Offline Queue'}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight group-hover:text-[#285C70] transition-colors font-sans">
                        @{secondaryPeerId} · Sealed Parcel
                      </h3>
                      <span
                        className={`text-[11px] font-mono font-semibold ${
                          secondaryPeer?.isOnline ? 'text-[#285C70]' : 'text-slate-400 dark:text-neutral-500'
                        }`}
                      >
                        {secondaryPeer?.isOnline ? 'Online' : secondaryPeer ? 'SQLite Stored' : 'Not Joined'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed font-normal">
                      Deliver sealed envelopes through the blind relay router with continuous ratchet advancement upon arrival.
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] mt-4">
                  <LiquidButton
                    variant="secondary"
                    size="sm"
                    icon={ArrowRight}
                    iconPosition="right"
                    className="w-full justify-between"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPeer(secondaryPeerId);
                    }}
                  >
                    <span>Queue Sealed Message</span>
                  </LiquidButton>
                </div>
              </TiltCard>
            )}

            {/* Card 3: Safety Numbers Biometric Scanner (MitM Resistance) */}
            {(filterCategory === 'all' || filterCategory === 'invariants') && (
              <TiltCard
                onClick={onOpenSafetyNumbers}
                maxTilt={12}
                scale={1.03}
                className="p-6 sm:p-7 rounded-3xl bg-white/95 dark:bg-[#0f1117]/90 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-card-studio hover:shadow-card-hover cursor-pointer group flex flex-col justify-between min-h-[420px] overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Real 3D Render Image Banner */}
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/[0.08] shadow-inner bg-slate-900">
                    <img
                      src="/images/safety_number_biometric.jpg"
                      alt="Safety Number Biometric Scanner"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold text-[#285C70] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#285C70]" />
                      <span>Out-of-Band Audit</span>
                    </div>
                    <div className="absolute bottom-2.5 right-3 text-[10px] font-mono text-white/80 bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
                      5,200x SHA-512
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight group-hover:text-[#285C70] transition-colors font-sans">
                        Safety Numbers Matrix
                      </h3>
                      <span className="text-[11px] font-mono text-[#285C70] font-semibold">
                        MitM Shield
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed font-normal">
                      Audit long-term identity keys via 5,200 rounds of proof-of-work key stretching into 12 decimal blocks or QR code.
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] mt-4">
                  <LiquidButton
                    variant="brand"
                    size="sm"
                    icon={ArrowRight}
                    iconPosition="right"
                    className="w-full justify-between"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenSafetyNumbers();
                    }}
                  >
                    <span>Compare Fingerprints</span>
                  </LiquidButton>
                </div>
              </TiltCard>
            )}

            {/* Card 4: Zero-Knowledge Blind Relay Server Cluster */}
            {(filterCategory === 'all' || filterCategory === 'invariants') && (
              <TiltCard
                onClick={onOpenRelay}
                maxTilt={12}
                scale={1.03}
                className="p-6 sm:p-7 rounded-3xl bg-white/95 dark:bg-[#0f1117]/90 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-card-studio hover:shadow-card-hover cursor-pointer group flex flex-col justify-between min-h-[420px] overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Real 3D Render Image Banner */}
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/[0.08] shadow-inner bg-slate-900">
                    <img
                      src="/images/blind_relay_server.jpg"
                      alt="Blind Relay Server Cluster"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#285C70]" />
                      <span>Blind Infrastructure</span>
                    </div>
                    <div className="absolute bottom-2.5 right-3 text-[10px] font-mono text-white/80 bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
                      SQLite WAL
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight group-hover:text-[#285C70] transition-colors font-sans">
                        Zero-Knowledge Relay
                      </h3>
                      <span className={`text-[11px] font-mono font-semibold ${isConnected ? 'text-[#285C70]' : 'text-rose-500'}`}>
                        {isConnected ? 'Relay Live' : 'Disconnected'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed font-normal">
                      Audit server memory isolation: stores zero private keys, zero master secrets, and zero plaintext data.
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] mt-4">
                  <LiquidButton
                    variant="secondary"
                    size="sm"
                    icon={ArrowRight}
                    iconPosition="right"
                    className="w-full justify-between"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenRelay();
                    }}
                  >
                    <span>Inspect Server Memory</span>
                  </LiquidButton>
                </div>
              </TiltCard>
            )}

            {/* Card 5: Cryptographic Labs Silicon Accelerator (ASIC) */}
            {(filterCategory === 'all' || filterCategory === 'invariants') && (
              <TiltCard
                onClick={onOpenLabs}
                maxTilt={12}
                scale={1.03}
                className="p-6 sm:p-7 rounded-3xl bg-white/95 dark:bg-[#0f1117]/90 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-card-studio hover:shadow-card-hover cursor-pointer group flex flex-col justify-between min-h-[420px] overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Real 3D Render Image Banner */}
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/[0.08] shadow-inner bg-slate-900">
                    <img
                      src="/images/crypto_labs_chipset.jpg"
                      alt="Crypto Labs ASIC Chipset"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold text-[#285C70] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#285C70]" />
                      <span>Silicon Simulator</span>
                    </div>
                    <div className="absolute bottom-2.5 right-3 text-[10px] font-mono text-white/80 bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
                      Interactive
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight group-hover:text-[#285C70] transition-colors font-sans">
                        Crypto Lab Accelerator
                      </h3>
                      <span className="text-[11px] font-mono text-[#285C70] font-semibold">
                        Live Harness
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed font-normal">
                      Step through 4-DH mathematical handshakes, simulate Double Ratchet turns, and trigger live bit-flip AEAD errors.
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] mt-4">
                  <LiquidButton
                    variant="brand"
                    size="sm"
                    icon={ArrowRight}
                    iconPosition="right"
                    className="w-full justify-between"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenLabs();
                    }}
                  >
                    <span>Launch Test Harness</span>
                  </LiquidButton>
                </div>
              </TiltCard>
            )}

            {/* Card 6: Titanium Blast Vault (Forward Secrecy & PCS) */}
            {(filterCategory === 'all' || filterCategory === 'invariants') && (
              <TiltCard
                onClick={onOpenProtocol}
                maxTilt={12}
                scale={1.03}
                className="p-6 sm:p-7 rounded-3xl bg-white/95 dark:bg-[#0f1117]/90 backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-card-studio hover:shadow-card-hover cursor-pointer group flex flex-col justify-between min-h-[420px] overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Real 3D Render Image Banner */}
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/[0.08] shadow-inner bg-slate-900">
                    <img
                      src="/images/forward_secrecy_vault.jpg"
                      alt="Forward Secrecy Titanium Vault"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#285C70]" />
                      <span>RFC 5869 & AEAD</span>
                    </div>
                    <div className="absolute bottom-2.5 right-3 text-[10px] font-mono text-white/80 bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">
                      Self-Healing
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-extrabold text-slate-900 dark:text-neutral-100 tracking-tight group-hover:text-[#285C70] transition-colors font-sans">
                        Forward Secrecy Vault
                      </h3>
                      <span className="text-[11px] font-mono text-[#285C70] font-semibold">
                        Post-Compromise
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 leading-relaxed font-normal">
                      Single-use message keys are wiped immediately upon use. Subsequent turns self-heal past device compromises.
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] mt-4">
                  <LiquidButton
                    variant="secondary"
                    size="sm"
                    icon={ArrowRight}
                    iconPosition="right"
                    className="w-full justify-between"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenProtocol();
                    }}
                  >
                    <span>Protocol Invariants</span>
                  </LiquidButton>
                </div>
              </TiltCard>
            )}

          </div>
        </div>

        {/* Clean Enterprise Trust Footer Strip */}
        <div className="pt-6 border-t border-slate-200/80 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 dark:text-neutral-400 gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold text-slate-800 dark:text-neutral-200">
              WhisperShield Enterprise Specification
            </span>
            <span>• Signal Protocol Invariant Architecture</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400 dark:text-neutral-500">
            <span>RFC 5869 HKDF-SHA256</span>
            <span>•</span>
            <span>AES-256-GCM + AAD Binding</span>
            <span>•</span>
            <span>5,200x SHA-512 PoW</span>
          </div>
        </div>

      </div>
    </div>
  );
};
