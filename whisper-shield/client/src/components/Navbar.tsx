import React from 'react';
import { useChat } from '../context/ChatContext';
import { WhisperShieldLogo } from './common/WhisperShieldLogo';
import {
  MessageSquare,
  Cpu,
  Layers,
  KeyRound,
  Server,
  Radio,
  Sun,
  Moon,
  Users
} from 'lucide-react';

export type ActiveTab = 'messenger' | 'protocol' | 'labs' | 'safety' | 'relay';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenSwitchUser: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onOpenSwitchUser,
  isDarkMode,
  onToggleDarkMode
}) => {
  const { currentUser, isConnected, opkRemainingCount } = useChat();

  const navItems: Array<{ id: ActiveTab; label: string; icon: React.ElementType; badge?: string }> = [
    { id: 'messenger', label: 'Secure Messenger', icon: MessageSquare },
    { id: 'protocol', label: 'Protocol Suite', icon: Layers },
    { id: 'labs', label: 'Cryptographic Labs', icon: Cpu, badge: 'Interactive' },
    { id: 'safety', label: 'Safety Numbers', icon: KeyRound },
    { id: 'relay', label: 'Relay Monitor', icon: Server }
  ];

  return (
    <header className="h-16 px-6 border-b border-[#E2DDDA] dark:border-white/[0.08] bg-[#FFFAF8]/95 dark:bg-[#090909]/95 backdrop-blur-xl flex items-center justify-between sticky top-0 z-40 select-none transition-colors">
      {/* Brand & Technical Emblem */}
      <div className="flex items-center gap-6">
        <div onClick={() => onTabChange('protocol')} className="cursor-pointer">
          <WhisperShieldLogo size={34} showWordmark={true} />
        </div>

        {/* Floating Pill Nav Bar (ReactBits PillNav style) */}
        <nav className="hidden lg:flex items-center gap-1 p-1 rounded-2xl bg-[#F2EDEA] dark:bg-white/[0.05] border border-[#E2DDDA] dark:border-white/[0.06] shadow-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 active:scale-95 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-white/[0.14] text-[#16303D] dark:text-white shadow-sm'
                    : 'text-[#517380] dark:text-[#989898] hover:text-[#16303D] dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/[0.05]'
                }`}
              >
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#285C70] shadow-[0_0_8px_#60899B] animate-pulse" />
                )}
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#285C70]' : 'text-[#757575] dark:text-[#808080]'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[#285C70]/15 text-[#285C70] dark:text-[#6C9BAD] font-semibold border border-[#285C70]/25">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Connection Status Pill */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border transition-colors ${
            isConnected
              ? 'bg-[#285C70]/15 text-[#285C70] dark:text-[#6C9BAD] border-[#285C70]/30'
              : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-500/30'
          }`}
          title={isConnected ? 'Connected to WebSocket Zero-Knowledge Relay' : 'Disconnected from Relay'}
        >
          <Radio className="w-3 h-3 animate-pulse" />
          <span className="hidden sm:inline">{isConnected ? 'Relay Live' : 'Offline'}</span>
        </div>

        {/* OPK Remaining Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F2EDEA] dark:bg-white/[0.04] border border-[#E2DDDA] dark:border-white/[0.06] text-[11px] font-mono">
          <span className="text-[#517380] dark:text-[#989898]">OPKs:</span>
          <span className={`font-semibold ${opkRemainingCount > 15 ? 'text-[#285C70] dark:text-[#6C9BAD]' : 'text-amber-600 dark:text-amber-400'}`}>
            {opkRemainingCount}
          </span>
        </div>

        {/* Active Persona Pill / Switcher */}
        <button
          type="button"
          onClick={onOpenSwitchUser}
          className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-[#F2EDEA] hover:bg-[#E2DDDA] dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-[#E2DDDA] dark:border-white/[0.08] transition-colors cursor-pointer"
          title="Switch Active Cryptographic Persona"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#285C70] to-[#60899B] flex items-center justify-center text-[11px] font-bold text-white font-mono shadow-sm">
            {currentUser?.userId ? currentUser.userId.charAt(0).toUpperCase() : '?'}
          </div>
          <span className="text-xs font-mono font-semibold text-[#16303D] dark:text-[#F2EDEA]">
            @{currentUser?.userId || 'guest'}
          </span>
          <Users className="w-3 h-3 text-[#757575] dark:text-[#989898]" />
        </button>

        {/* Light / Dark Mode Toggle Pill */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 shadow-sm border border-[#E2DDDA] dark:border-white/[0.12] bg-[#FFFAF8]/90 dark:bg-white/[0.08] hover:bg-[#F2EDEA] dark:hover:bg-white/[0.14] text-[#16303D] dark:text-[#F2EDEA] active:scale-95"
          title={isDarkMode ? 'Switch to Star Dust White Theme' : 'Switch to Charcoal Midnight Theme'}
        >
          {isDarkMode ? (
            <>
              <Sun className="w-3.5 h-3.5 text-[#6C9BAD]" />
              <span className="font-semibold text-[11px]">Dark Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-[#285C70]" />
              <span className="font-semibold text-[11px]">Light Mode</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};


