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
    <div className="rounded-lg bg-[#141b27] border border-[#1d2635] p-4 space-y-4 text-xs">
      {/* 1. Stan Usług */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between pb-2 border-b border-[#1c2534]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {t('overview.services_status', 'STAN USŁUG')}
          </h3>

          <button
            onClick={() => {
              fetchStats();
              if (onRefreshServices) onRefreshServices();
            }}
            className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
            title={t('common.refresh', 'Odśwież')}
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-400">Dostępność usług:</span>
          <span className="font-semibold text-slate-200">{online}/{total} ({onlinePercent}%)</span>
        </div>

        {/* Multi-segment thin line */}
        <div className="w-full h-1.5 rounded-sm bg-[#1c2534] overflow-hidden flex">
          {online > 0 && <div style={{ width: `${onlinePercent}%` }} className="h-full bg-emerald-500" />}
          {degraded > 0 && <div style={{ width: `${degradedPercent}%` }} className="h-full bg-amber-500" />}
          {offline > 0 && <div style={{ width: `${offlinePercent}%` }} className="h-full bg-rose-500" />}
          {unknown > 0 && <div style={{ width: `${unknownPercent}%` }} className="h-full bg-slate-600" />}
        </div>

        {/* Clean Monospace Breakdown */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-0.5">
          <span className="text-emerald-400">{online} online</span>
          <span className="text-amber-400">{degraded} problem</span>
          <span className="text-rose-400">{offline} offline</span>
          <span className="text-slate-500">{unknown} inne</span>
        </div>
      </div>

      {/* 2. Host NexusPanel */}
      {stats && (
        <div className="space-y-2.5 pt-3 border-t border-[#1c2534]">
          <div className="flex items-center justify-between pb-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              {t('overview.host_nexuspanel', 'HOST NEXUSPANEL')}
            </h3>

            <span className="text-[11px] font-mono text-slate-400">
              {stats.system?.hostname || 'nexuspanel'} ({stats.system?.platform || 'linux'})
            </span>
          </div>

          <div className="text-[11px] font-mono text-slate-400 flex justify-between">
            <span>Uptime:</span>
            <span className="text-slate-300">{stats.system?.uptimeFormatted || `${Math.floor((stats.system?.uptimeSeconds || 0) / 3600)}h`}</span>
          </div>

          {/* CPU Row */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-400">CPU ({stats.cpu?.cores || 1} rdzeń)</span>
              <span className="text-slate-200 font-semibold">{stats.cpu?.usagePercent || 0}%</span>
            </div>
            <div className="w-full h-1.5 rounded-sm bg-[#1c2534] overflow-hidden">
              <div 
                className="h-full bg-blue-500"
                style={{ width: `${Math.min(100, stats.cpu?.usagePercent || 0)}%` }}
              />
            </div>
          </div>

          {/* RAM Row */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-400">RAM ({stats.memory?.usedGb || '0'}/{stats.memory?.totalGb || '0'} GB)</span>
              <span className="text-slate-200 font-semibold">{stats.memory?.percent || 0}%</span>
            </div>
            <div className="w-full h-1.5 rounded-sm bg-[#1c2534] overflow-hidden">
              <div 
                className="h-full bg-slate-400"
                style={{ width: `${Math.min(100, stats.memory?.percent || 0)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
