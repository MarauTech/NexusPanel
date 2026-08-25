import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { Cpu, HardDrive, Clock, Server, RefreshCw, Activity, ShieldCheck } from 'lucide-react';

export default function SystemOverviewWidget({ services = [], onRefreshServices }) {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.system.getStats();
      if (res.data) setStats(res.data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const timer = setInterval(fetchStats, 30000);
    return () => clearInterval(timer);
  }, []);

  const enabled = services.filter(s => s.enabled !== 0 && s.enabled !== false);
  const total = enabled.length;
  const online = enabled.filter(s => s.health_status === 'online').length;
  const degraded = enabled.filter(s => s.health_status === 'degraded').length;
  const offline = enabled.filter(s => s.health_status === 'offline').length;
  const unknown = total - (online + degraded + offline);

  const onlinePercent = total > 0 ? Math.round((online / total) * 100) : 0;
  const degradedPercent = total > 0 ? Math.round((degraded / total) * 100) : 0;
  const offlinePercent = total > 0 ? Math.round((offline / total) * 100) : 0;
  const unknownPercent = total > 0 ? Math.round((unknown / total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* 1. Stan Usług Card */}
      <div className="rounded-2xl glass-card border border-black/[0.08] dark:border-white/[0.08] p-4 sm:p-5 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between pb-2.5 border-b border-black/[0.05] dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {t('overview.services_status', 'STAN USŁUG')}
            </h3>
          </div>

          <button
            onClick={() => {
              fetchStats();
              if (onRefreshServices) onRefreshServices();
            }}
            className="p-1 rounded-lg hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all"
            title={t('common.refresh', 'Odśwież')}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent' : ''}`} />
          </button>
        </div>

        {/* Services Health Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              {t('overview.services_fleet', 'Dostępność usług')}
            </span>
            <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
              {online}/{total} ({onlinePercent}%)
            </span>
          </div>

          {/* Multi-segment visual bar */}
          <div className="w-full h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden flex">
            {online > 0 && (
              <div 
                style={{ width: `${onlinePercent}%` }} 
                className="h-full bg-emerald-500 transition-all duration-500" 
                title={`${online} online`}
              />
            )}
            {degraded > 0 && (
              <div 
                style={{ width: `${degradedPercent}%` }} 
                className="h-full bg-amber-500 transition-all duration-500" 
                title={`${degraded} degraded`}
              />
            )}
            {offline > 0 && (
              <div 
                style={{ width: `${offlinePercent}%` }} 
                className="h-full bg-rose-500 transition-all duration-500" 
                title={`${offline} offline`}
              />
            )}
            {unknown > 0 && (
              <div 
                style={{ width: `${unknownPercent}%` }} 
                className="h-full bg-slate-400/40 transition-all duration-500" 
                title={`${unknown} nieznany`}
              />
            )}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-4 gap-1.5 pt-1 text-[10px] text-center font-mono">
            <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
              {online} <span className="font-normal opacity-80">online</span>
            </div>
            <div className="p-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
              {degraded} <span className="font-normal opacity-80">ping &gt;1s</span>
            </div>
            <div className="p-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold">
              {offline} <span className="font-normal opacity-80">offline</span>
            </div>
            <div className="p-1 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400 font-bold">
              {unknown} <span className="font-normal opacity-80">inne</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Host NexusPanel Resources Card */}
      {stats && (
        <div className="rounded-2xl glass-card border border-black/[0.08] dark:border-white/[0.08] p-4 sm:p-5 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between pb-2.5 border-b border-black/[0.05] dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
                <Server className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                {t('overview.host_nexuspanel', 'HOST NEXUSPANEL')}
              </h3>
            </div>

            <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
              <Clock className="w-3 h-3 text-slate-400" />
              {stats.system?.uptimeFormatted || `${Math.floor((stats.system?.uptimeSeconds || 0) / 3600)}h`}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
              <span className="font-mono">{stats.system?.hostname || 'nexuspanel'}</span>
              <span className="font-mono">{stats.system?.platform || 'linux'}</span>
            </div>

            {/* CPU Gauge */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-indigo-400" /> CPU ({stats.cpu?.cores || 1} rdzeń)
                </span>
                <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                  {stats.cpu?.usagePercent || 0}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, stats.cpu?.usagePercent || 0)}%` }}
                />
              </div>
            </div>

            {/* RAM Gauge */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-purple-400" /> Pamięć RAM
                </span>
                <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                  {stats.memory?.usedGb || '0'} / {stats.memory?.totalGb || '0'} GB ({stats.memory?.percent || 0}%)
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, stats.memory?.percent || 0)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
