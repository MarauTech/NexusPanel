import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { RefreshCw } from 'lucide-react';

export default function SystemOverviewWidget({ services = [], onRefreshServices }) {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.system.getStats();
      if (res.data) setStats(res.data);
    } catch {
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
    <div className="rounded-lg bg-white dark:bg-[#141b27] border border-slate-300 dark:border-[#1d2635] p-4 space-y-4 text-xs shadow-xs dark:shadow-none transition-colors">
      {/* 1. Stan Usług */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#1c2534]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
            {t('overview.services_status', 'STAN USŁUG')}
          </h3>

          <button
            onClick={() => {
              fetchStats();
              if (onRefreshServices) onRefreshServices();
            }}
            className="p-1 rounded text-slate-500 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-300 transition-colors cursor-pointer"
            title={t('common.refresh', 'Odśwież')}
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-700 dark:text-slate-400 font-medium">Dostępność usług:</span>
          <span className="font-bold text-slate-900 dark:text-slate-100">{online}/{total} ({onlinePercent}%)</span>
        </div>

        {/* Multi-segment thin line */}
        <div className="w-full h-2 rounded-sm bg-slate-200 dark:bg-[#1c2534] overflow-hidden flex">
          {online > 0 && <div style={{ width: `${onlinePercent}%` }} className="h-full bg-emerald-600 dark:bg-emerald-500" />}
          {degraded > 0 && <div style={{ width: `${degradedPercent}%` }} className="h-full bg-amber-500" />}
          {offline > 0 && <div style={{ width: `${offlinePercent}%` }} className="h-full bg-rose-600 dark:bg-rose-500" />}
          {unknown > 0 && <div style={{ width: `${unknownPercent}%` }} className="h-full bg-slate-400 dark:bg-slate-600" />}
        </div>

        {/* Clean Monospace Breakdown */}
        <div className="flex items-center justify-between text-[11px] font-mono font-medium pt-0.5">
          <span className="text-emerald-700 dark:text-emerald-400">{online} online</span>
          <span className="text-amber-700 dark:text-amber-400">{degraded} problem</span>
          <span className="text-rose-700 dark:text-rose-400">{offline} offline</span>
          <span className="text-slate-600 dark:text-slate-500">{unknown} inne</span>
        </div>
      </div>

      {/* 2. Host NexusPanel */}
      {stats && (
        <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-[#1c2534]">
          <div className="flex items-center justify-between pb-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              {t('overview.host_nexuspanel', 'HOST NEXUSPANEL')}
            </h3>

            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 font-medium">
              {stats.system?.hostname || 'nexuspanel'} ({stats.system?.platform || 'linux'})
            </span>
          </div>

          <div className="text-[11px] font-mono flex justify-between">
            <span className="text-slate-700 dark:text-slate-400 font-medium">Uptime:</span>
            <span className="text-slate-900 dark:text-slate-200 font-bold">{stats.system?.uptimeFormatted || `${Math.floor((stats.system?.uptimeSeconds || 0) / 3600)}h`}</span>
          </div>

          {/* CPU Row */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-700 dark:text-slate-400 font-medium">CPU ({stats.cpu?.cores || 1} rdzeń)</span>
              <span className="text-slate-900 dark:text-slate-100 font-bold">{stats.cpu?.usagePercent || 0}%</span>
            </div>
            <div className="w-full h-1.5 rounded-sm bg-slate-200 dark:bg-[#1c2534] overflow-hidden">
              <div 
                className="h-full bg-blue-600 dark:bg-blue-500"
                style={{ width: `${Math.min(100, stats.cpu?.usagePercent || 0)}%` }}
              />
            </div>
          </div>

          {/* RAM Row */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-700 dark:text-slate-400 font-medium">RAM ({stats.memory?.usedGb || '0'}/{stats.memory?.totalGb || '0'} GB)</span>
              <span className="text-slate-900 dark:text-slate-100 font-bold">{stats.memory?.percent || 0}%</span>
            </div>
            <div className="w-full h-1.5 rounded-sm bg-slate-200 dark:bg-[#1c2534] overflow-hidden">
              <div 
                className="h-full bg-indigo-600 dark:bg-indigo-400"
                style={{ width: `${Math.min(100, stats.memory?.percent || 0)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
