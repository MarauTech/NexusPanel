import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function GlobalStatusStrip({ services = [] }) {
  const { t } = useLanguage();

  const enabledServices = services.filter(s => s.enabled !== 0 && s.enabled !== false);
  const total = enabledServices.length;

  if (total === 0) return null;

  const online = enabledServices.filter(s => s.health_status === 'online').length;
  const degraded = enabledServices.filter(s => s.health_status === 'degraded').length;
  const offline = enabledServices.filter(s => s.health_status === 'offline').length;
  const unknown = enabledServices.filter(s => !s.health_status || s.health_status === 'unknown').length;

  // Calculate average latency among reachable services
  const latencyItems = enabledServices.filter(s => typeof s.health_response_time === 'number' && s.health_response_time > 0);
  const avgLatency = latencyItems.length > 0
    ? Math.round(latencyItems.reduce((acc, s) => acc + s.health_response_time, 0) / latencyItems.length)
    : null;

  // Calculate overall uptime percentage
  const uptimeItems = enabledServices.filter(s => s.uptime_percentage !== undefined && s.uptime_percentage !== null);
  const overallUptime = uptimeItems.length > 0
    ? (uptimeItems.reduce((acc, s) => acc + parseFloat(s.uptime_percentage || 100), 0) / uptimeItems.length).toFixed(1)
    : '100.0';

  const hasOffline = offline > 0;
  const hasDegraded = degraded > 0;

  return (
    <div 
      className="w-full rounded-lg bg-white dark:bg-[#141b27] border border-slate-300 dark:border-[#1d2635] px-3.5 sm:px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 text-xs shadow-xs transition-colors"
      role="region"
      aria-label="Podsumowanie stanu systemu"
    >
      {/* Overall Health State */}
      <div className="flex items-center gap-2 min-w-0 flex-wrap">
        <span 
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            hasOffline ? 'bg-rose-600' : (hasDegraded ? 'bg-amber-500' : 'bg-emerald-600 dark:bg-emerald-400')
          }`} 
        />
        <div className="flex items-center gap-1.5 flex-wrap">
          {hasOffline ? (
            <span className="font-bold text-rose-700 dark:text-rose-400">
              {offline} {offline === 1 ? 'usługa offline' : (offline < 5 ? 'usługi offline' : 'usług offline')}
            </span>
          ) : hasDegraded ? (
            <span className="font-bold text-amber-700 dark:text-amber-400">
              {degraded} {degraded === 1 ? 'usługa z problemami' : 'usługi z problemami'}
            </span>
          ) : (
            <span className="font-bold text-slate-900 dark:text-slate-200">
              {t('status.all_systems_operational', 'Wszystkie systemy sprawne')}
            </span>
          )}

          <span className="text-slate-700 dark:text-slate-300 font-mono text-[11px] sm:text-xs">
            ({online}/{total} {t('status.services_online', 'usług online')}{unknown > 0 && `, ${unknown} niezweryfikowanych`})
          </span>
        </div>
      </div>

      {/* Technical Monospace Metrics */}
      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 text-[11px] sm:text-xs font-mono text-slate-600 dark:text-slate-400 border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-200 dark:border-[#1c2534]">
        {avgLatency !== null && (
          <div>
            <span className="text-slate-600 dark:text-slate-400">śr. ping: </span>
            <span className={`font-bold ${avgLatency >= 200 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-slate-200'}`}>
              {avgLatency} ms
            </span>
          </div>
        )}

        <div className="border-l border-slate-300 dark:border-[#1d2635] pl-3">
          <span className="text-slate-600 dark:text-slate-400">uptime: </span>
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">{overallUptime}% · 24h</span>
        </div>
      </div>
    </div>
  );
}
