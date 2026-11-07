import React, { useState, useEffect } from 'react';
import { ChatProvider, useChat } from './context/ChatContext';
import { Navbar, ActiveTab } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ChatViewport } from './components/ChatViewport';
import { ProtocolSuiteView } from './components/views/ProtocolSuiteView';
import { CryptoLabView } from './components/views/CryptoLabView';
import { SafetyNumbersView } from './components/views/SafetyNumbersView';
import { RelayMonitorView } from './components/views/RelayMonitorView';
import { SessionInspectorModal } from './components/SessionInspectorModal';
import { SafetyNumberModal } from './components/SafetyNumberModal';
import { PatternWaves } from './components/reactbits/PatternWaves';
import { Shield, User, ArrowRight, X } from 'lucide-react';

const SwitchUserModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  const { loginAs, currentUser } = useChat();
  const [customUsername, setCustomUsername] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSelectUser = async (id: string) => {
    setLoading(true);
    try {
      await loginAs(id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUsername.trim()) {
      handleSelectUser(customUsername.trim().toLowerCase());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-md bg-white dark:bg-[#0a0c10] border border-slate-200 dark:border-white/[0.12] rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#285C70] dark:text-[#6C9BAD]">
            <Shield className="w-5 h-5" />
            <h2 className="text-base font-bold text-slate-900 dark:text-neutral-100 font-sans">
              Identity & Persona Switcher
            </h2>
          </div>
          {currentUser && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed font-sans">
          Select or initialize a cryptographic identity. Each identity manages its own Curve25519 prekey pool, Double Ratchet state machine, and partitioned IndexedDB key store.
        </p>

        {/* Quick Switch Profiles */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500 uppercase tracking-wider block">
            1-Click Preset Personas
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSelectUser('alice')}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                currentUser?.userId === 'alice'
                  ? 'bg-[#285C70]/15 border-[#285C70]/40 text-[#285C70] dark:text-[#6C9BAD] shadow-sm'
                  : 'bg-slate-50 dark:bg-[#16191c] border-slate-200 dark:border-white/[0.06] text-[#16303D] dark:text-neutral-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#285C70]/20 text-[#285C70] dark:text-[#6C9BAD] font-mono text-xs font-bold flex items-center justify-center">
                  A
                </div>
                <div>
                  <span className="font-mono text-xs font-bold block">@alice</span>
                  <span className="text-[10px] text-slate-500 dark:text-neutral-500">Initiator</span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleSelectUser('bob')}
              className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                currentUser?.userId === 'bob'
                  ? 'bg-[#285C70]/15 border-[#285C70]/40 text-[#285C70] dark:text-[#6C9BAD] shadow-sm'
                  : 'bg-slate-50 dark:bg-[#16191c] border-slate-200 dark:border-white/[0.06] text-[#16303D] dark:text-neutral-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#285C70]/20 text-[#285C70] dark:text-[#6C9BAD] font-mono text-xs font-bold flex items-center justify-center">
                  B
                </div>
                <div>
                  <span className="font-mono text-xs font-bold block">@bob</span>
                  <span className="text-[10px] text-slate-500 dark:text-neutral-500">Responder</span>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Custom Username Input */}
        <form onSubmit={handleCustomSubmit} className="pt-2 border-t border-slate-100 dark:border-white/[0.06] space-y-2">
          <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500 uppercase tracking-wider block">
            Or create custom identity
          </span>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={customUsername}
                onChange={(e) => setCustomUsername(e.target.value)}
                placeholder="e.g. charlie, david"
                className="w-full bg-slate-50 dark:bg-[#111111] border border-slate-200 dark:border-white/[0.08] focus:border-[#285C70]/50 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-[#16303D] dark:text-neutral-200 placeholder-slate-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={!customUsername.trim() || loading}
              className="px-4 py-2 bg-[#285C70] hover:bg-[#1C3E4E] text-white rounded-xl text-xs font-mono transition-colors disabled:opacity-40"
            >
              Log In
            </button>
          </div>
        </form>

        <div className="text-[10px] text-slate-500 dark:text-neutral-500 font-mono pt-1 text-center">
          💡 Open two browser windows (@alice & @bob) to test live ratcheting!
        </div>
      </div>
    </div>
  );
};

const MainLayout: React.FC = () => {
  const { currentUser, loginAs } = useChat();
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const tab = p.get('tab');
      if (tab === 'protocol' || tab === 'labs' || tab === 'safety' || tab === 'relay') {
        return tab as ActiveTab;
      }
    }
    return 'messenger';
  });
  const [isSwitchUserOpen, setIsSwitchUserOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('switchUser') === 'true';
    }
    return false;
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('theme') === 'dark') return true;
      if (p.get('theme') === 'light') return false;
      const stored = localStorage.getItem('whispershield_theme');
      return stored === 'dark';
    }
    return false;
  });

  // Keep DOM class and body styles perfectly in sync with state
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.body.style.backgroundColor = '#090909';
      document.body.style.color = '#F2EDEA';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '#FFFAF8';
      document.body.style.color = '#16303D';
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('whispershield_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  useEffect(() => {
    // Default initial auto-login as 'alice' if no active session
    if (!currentUser) {
      loginAs('alice').catch((err) => {
        console.warn('Initial auto-login error:', err);
        setIsSwitchUserOpen(true);
      });
    }
  }, [currentUser, loginAs]);

  return (
    <div className="relative flex flex-col h-screen w-screen overflow-hidden bg-[#FFFAF8] dark:bg-[#090909] text-[#16303D] dark:text-[#F2EDEA] transition-colors">
      {/* Dedicated Single ReactBits Background Per Page */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        {/* 1. Messenger View: Silk Halftone Wave (Japanese Indigo / Steel Teal) */}
        {activeTab === 'messenger' && (
          <PatternWaves
            preset="silk"
            color={isDarkMode ? '#60899B' : '#285C70'}
            backgroundColor={isDarkMode ? '#090909' : '#FFFAF8'}
            fade="edges"
            interactive={true}
            cursorSize={50}
            cursorStrength={0.5}
            pattern="dot"
            wave="silk"
            spacing={10}
            markSize={0.88}
            depth={0.9}
            shine={isDarkMode ? 0.65 : 0.3}
            contrast={1.15}
            speed={0.3}
            scale={1}
            direction={20}
            opacity={isDarkMode ? 0.35 : 0.15}
            fadeSize={0.5}
            characters=".:-=+*#%@"
            intro={true}
            paused={false}
          />
        )}

        {/* 2. Protocol Suite View: Architectural Coordinate Cross Grid */}
        {activeTab === 'protocol' && (
          <PatternWaves
            preset="technical"
            color={isDarkMode ? '#60899B' : '#285C70'}
            backgroundColor={isDarkMode ? '#090909' : '#FFFAF8'}
            fade="edges"
            interactive={true}
            cursorSize={60}
            cursorStrength={0.6}
            pattern="cross"
            wave="sine"
            spacing={16}
            markSize={0.85}
            depth={0.8}
            shine={isDarkMode ? 0.6 : 0.3}
            contrast={1.2}
            speed={0.25}
            scale={1}
            direction={45}
            opacity={isDarkMode ? 0.25 : 0.12}
            fadeSize={0.6}
            intro={true}
            paused={false}
          />
        )}

        {/* 3. Cryptographic Labs View: Minimal Clean Architectural Dot Waves (No text character clutter) */}
        {activeTab === 'labs' && (
          <PatternWaves
            preset="silk"
            color={isDarkMode ? '#60899B' : '#285C70'}
            backgroundColor={isDarkMode ? '#090909' : '#FFFAF8'}
            fade="edges"
            interactive={true}
            cursorSize={50}
            cursorStrength={0.4}
            pattern="dot"
            spacing={14}
            markSize={0.75}
            depth={0.8}
            shine={isDarkMode ? 0.45 : 0.2}
            contrast={1.1}
            speed={0.2}
            scale={1}
            direction={25}
            opacity={isDarkMode ? 0.18 : 0.08}
            fadeSize={0.6}
            intro={true}
            paused={false}
          />
        )}

        {/* 4. Safety Numbers View: Biometric Fluid Waves */}
        {activeTab === 'safety' && (
          <PatternWaves
            preset="biometric"
            color={isDarkMode ? '#60899B' : '#285C70'}
            backgroundColor={isDarkMode ? '#090909' : '#FFFAF8'}
            fade="edges"
            interactive={true}
            cursorSize={65}
            cursorStrength={0.7}
            pattern="dot"
            wave="fluid"
            spacing={13}
            markSize={1.05}
            depth={1.1}
            shine={isDarkMode ? 0.6 : 0.3}
            contrast={1.25}
            speed={0.35}
            scale={1}
            direction={30}
            opacity={isDarkMode ? 0.25 : 0.12}
            fadeSize={0.5}
            intro={true}
            paused={false}
          />
        )}

        {/* 5. Relay Monitor View: Hexadecimal Telemetry Stream */}
        {activeTab === 'relay' && (
          <PatternWaves
            preset="telemetry"
            color={isDarkMode ? '#60899B' : '#285C70'}
            backgroundColor={isDarkMode ? '#090909' : '#FFFAF8'}
            fade="edges"
            interactive={true}
            cursorSize={50}
            cursorStrength={0.5}
            pattern="char"
            characters="0123456789ABCDEF"
            wave="sine"
            spacing={20}
            markSize={0.9}
            depth={0.85}
            shine={isDarkMode ? 0.5 : 0.25}
            contrast={1.1}
            speed={0.25}
            scale={1}
            direction={15}
            opacity={isDarkMode ? 0.2 : 0.1}
            fadeSize={0.5}
            intro={true}
            paused={false}
          />
        )}
      </div>

      {/* Top Global Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenSwitchUser={() => setIsSwitchUserOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main View Area */}
      <div className="relative z-10 flex-1 overflow-hidden flex">
        {activeTab === 'messenger' && (
          <div className="flex w-full h-full overflow-hidden">
            <Sidebar onOpenSwitchUser={() => setIsSwitchUserOpen(true)} />
            <ChatViewport
              onOpenLabs={() => setActiveTab('labs')}
              onOpenSafetyNumbers={() => setActiveTab('safety')}
              onOpenProtocol={() => setActiveTab('protocol')}
              onOpenRelay={() => setActiveTab('relay')}
              onOpenSwitchUser={() => setIsSwitchUserOpen(true)}
            />
          </div>
        )}

        {activeTab === 'protocol' && (
          <ProtocolSuiteView
            onOpenLabs={() => setActiveTab('labs')}
            onOpenMessenger={() => setActiveTab('messenger')}
          />
        )}

        {activeTab === 'labs' && <CryptoLabView />}

        {activeTab === 'safety' && <SafetyNumbersView />}

        {activeTab === 'relay' && <RelayMonitorView />}
      </div>

      {/* Modals & Drawers */}
      <SessionInspectorModal />
      <SafetyNumberModal />
      <SwitchUserModal
        isOpen={isSwitchUserOpen}
        onClose={() => setIsSwitchUserOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ChatProvider>
      <MainLayout />
    </ChatProvider>
  );
};

export default App;
