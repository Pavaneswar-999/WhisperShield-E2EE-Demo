import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { TransportEngine, PeerUserInfo } from '../../network/transport';
import { LiquidButton } from '../common/LiquidButton';
import {
  Server,
  Radio,
  Database,
  RefreshCw,
  ShieldCheck,
  Lock,
  Circle
} from 'lucide-react';

export const RelayMonitorView: React.FC = () => {
  const { currentUser, opkRemainingCount, refillOPKs, isConnected } = useChat();
  const [users, setUsers] = useState<PeerUserInfo[]>([]);
  const [healthData, setHealthData] = useState<{ status: string; uptime: number } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRelayState = async () => {
    setIsRefreshing(true);
    try {
      const userList = await TransportEngine.fetchRegisteredUsers();
      setUsers(userList);

      const healthRes = await fetch('http://localhost:8080/api/health').catch(() => null);
      if (healthRes && healthRes.ok) {
        const json = await healthRes.json();
        setHealthData(json);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRelayState();
    const interval = setInterval(fetchRelayState, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 h-full overflow-y-auto px-6 py-8 sm:px-10 sm:py-10 select-none space-y-10 bg-transparent relative z-10 transition-colors">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#285C70]/10 border border-[#285C70]/25 text-xs font-semibold text-[#285C70] backdrop-blur-md bg-white/50 dark:bg-black/30">
              <Server className="w-3.5 h-3.5" />
              <span>UNTRUSTED RELAY TELEMETRY</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-neutral-100 font-sans">
              Zero-Knowledge Relay Server Inspector
            </h1>
            <p className="text-sm md:text-base text-slate-600 dark:text-neutral-300 max-w-3xl leading-relaxed">
              Audit the blind store-and-forward relay server. The server acts as an untrusted public prekey registry and blind packet forwarder, maintaining zero knowledge of message payloads or private keys.
            </p>
          </div>

          <LiquidButton
            variant="brand"
            size="md"
            onClick={fetchRelayState}
            disabled={isRefreshing}
            icon={RefreshCw}
          >
            <span>Refresh State</span>
          </LiquidButton>
        </div>

        {/* Relay Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0d0f15] border border-slate-200 dark:border-white/[0.08] shadow-card-light space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs">
              <span>Relay Status</span>
              <Radio className="w-4 h-4 text-[#285C70] animate-pulse" />
            </div>
            <div className="text-xl font-bold text-[#285C70]">
              {isConnected ? 'ONLINE (200 OK)' : 'DISCONNECTED'}
            </div>
            <span className="text-[10px] text-slate-400 block font-sans">
              WebSocket ws://localhost:8080
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#0d0f15] border border-slate-200 dark:border-white/[0.08] shadow-card-light space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs">
              <span>Database Engine</span>
              <Database className="w-4 h-4 text-[#285C70]" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-neutral-100">
              SQLite WAL
            </div>
            <span className="text-[10px] text-slate-400 block font-sans">
              Zero-knowledge tables with foreign keys
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#0d0f15] border border-slate-200 dark:border-white/[0.08] shadow-card-light space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs">
              <span>Server Uptime</span>
              <RefreshCw className="w-4 h-4 text-[#285C70]" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-neutral-100">
              {healthData?.uptime ? `${Math.floor(healthData.uptime)}s` : 'Active'}
            </div>
            <span className="text-[10px] text-slate-400 block font-sans">
              Continuous daemon process
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#0d0f15] border border-slate-200 dark:border-white/[0.08] shadow-card-light space-y-2">
            <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 text-xs">
              <span>My OPK Pool</span>
              <ShieldCheck className="w-4 h-4 text-[#285C70]" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-neutral-100">
              {opkRemainingCount} Available
            </div>
            <button
              type="button"
              onClick={() => refillOPKs(50)}
              className="text-[10px] text-[#285C70] hover:underline block font-sans"
            >
              + Refill 50 OPKs now
            </button>
          </div>
        </div>

        {/* Public PreKey Directory Table */}
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-[#0d0f15] border border-slate-200 dark:border-white/[0.08] shadow-card-light space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-neutral-100 font-sans">
                Registered Identity Key Directory (Public PreKeys)
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 font-mono">
                Notice: The server holds ONLY public identity keys and opaque prekey bundles.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">
              {users.length} Users Registered
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-neutral-400 text-[11px]">
                  <th className="pb-3 font-semibold">User Identity</th>
                  <th className="pb-3 font-semibold">Connection</th>
                  <th className="pb-3 font-semibold">Public Curve25519 IK</th>
                  <th className="pb-3 font-semibold text-right">Remaining OPKs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {users.map((u) => (
                  <tr key={u.userId} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-neutral-800 flex items-center justify-center text-[10px]">
                        {u.userId.charAt(0).toUpperCase()}
                      </div>
                      <span>@{u.userId}</span>
                      {u.userId === currentUser?.userId && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#285C70]/15 text-[#285C70] font-bold">
                          YOU
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <Circle
                          className={`w-2 h-2 fill-current ${
                            u.isOnline ? 'text-[#285C70]' : 'text-slate-400 dark:text-neutral-600'
                          }`}
                        />
                        <span className={u.isOnline ? 'text-[#285C70]' : 'text-slate-500'}>
                          {u.isOnline ? 'Live Socket' : 'Offline (Queued)'}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 text-[11px] text-slate-600 dark:text-neutral-400">
                      {u.identityKey.substring(0, 18)}...
                    </td>
                    <td className="py-3 text-right">
                      <span className="font-bold text-slate-900 dark:text-neutral-100">
                        {u.remainingOPKs}
                      </span>
                      <span className="text-slate-400 text-[10px]"> / 60</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Zero-Knowledge Guarantee Explainer */}
        <div className="p-6 rounded-3xl bg-slate-50 dark:bg-[#0c0e14] border border-slate-200 dark:border-white/[0.06] space-y-3">
          <div className="flex items-center gap-2 text-[#285C70] font-bold font-mono text-xs">
            <Lock className="w-4 h-4" />
            <span>ZERO-KNOWLEDGE SERVER SECURITY BOUNDARY</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed font-sans">
            Even if a state-sponsored adversary obtains full root access to the relay server or dumps the SQLite database, <strong>conversation content cannot be recovered</strong>. The server holds zero private keys, zero Diffie-Hellman secrets, and zero plaintext envelopes. In addition, atomic database transactions guarantee that One-Time PreKeys are consumed strictly once, preventing session reuse attacks.
          </p>
        </div>
      </div>
    </div>
  );
};
