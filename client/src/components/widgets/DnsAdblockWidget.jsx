import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Pause, Play, CheckCircle2 } from 'lucide-react';
import WidgetCard from './WidgetCard';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

export default function DnsAdblockWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paused, setPaused] = useState(false);
  const { addToast } = useToast();

  const fetchDns = async () => {
    setLoading(true);
    try {
      const res = await api.widgets.getDnsAdblock();
      setData(res.data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDns();
    const interval = setInterval(fetchDns, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTogglePause = async (seconds) => {
    try {
      await api.widgets.toggleDnsAdblock(seconds);
      setPaused(seconds > 0);
      if (seconds > 0) {
        addToast(`Filtrowanie DNS wstrzymane na ${seconds / 60} minut`, 'info');
      } else {
        addToast('Filtrowanie DNS wznowione!', 'success');
      }
    } catch (e) {
      addToast('Nie udało się przełączyć stanu filtrowania', 'error');
    }
  };

  const blockedPercent = data?.blockedPercentage ?? 22.5;
  const queries = data?.dnsQueries24h ? data.dnsQueries24h.toLocaleString('pl-PL') : '84 210';
  const blocked = data?.blockedQueries24h ? data.blockedQueries24h.toLocaleString('pl-PL') : '18 940';

  return (
    <WidgetCard
      title="AdGuard / Pi-hole DNS"
      icon={Shield}
      badge={paused ? "Wstrzymano" : "Aktywne (24h)"}
      badgeColor={paused ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"}
      onRefresh={fetchDns}
      loading={loading}
    >
      <div className="space-y-3">
        {/* Big Percentage Stats */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-border/50">
          <div>
            <span className="text-[10px] text-text-secondary uppercase font-mono tracking-wider block">
              Zablokowane reklamy:
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black font-mono text-emerald-400">{blockedPercent}%</span>
              <span className="text-xs text-text-secondary font-mono">({blocked})</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-text-secondary uppercase font-mono tracking-wider block">
              Wszystkie zapytania:
            </span>
            <span className="text-base font-bold font-mono text-text-primary block mt-0.5">{queries}</span>
          </div>
        </div>

        {/* Quick Actions (Pause 5m / 15m) */}
        <div className="flex items-center gap-2">
          {paused ? (
            <button
              type="button"
              onClick={() => handleTogglePause(0)}
              className="flex-1 py-1.5 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Play className="w-3 h-3" /> Wznów ochronę
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleTogglePause(300)}
                className="flex-1 py-1.5 px-2 bg-black/[0.03] dark:bg-white/[0.03] hover:bg-black/5 dark:hover:bg-white/5 border border-border text-text-secondary hover:text-text-primary text-[11px] font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <Pause className="w-3 h-3" /> Pauza 5 min
              </button>
              <button
                type="button"
                onClick={() => handleTogglePause(900)}
                className="flex-1 py-1.5 px-2 bg-black/[0.03] dark:bg-white/[0.03] hover:bg-black/5 dark:hover:bg-white/5 border border-border text-text-secondary hover:text-text-primary text-[11px] font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <Pause className="w-3 h-3" /> Pauza 15 min
              </button>
            </>
          )}
        </div>
      </div>
    </WidgetCard>
  );
}
