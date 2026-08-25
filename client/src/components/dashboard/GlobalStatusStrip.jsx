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
      className="w-full rounded-lg bg-white dark:bg-[#141b27] border border-slate-200 dark:border-[#1d2635] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-sm transition-colors"
      role="region"
      aria-label="Podsumowanie stanu systemu"
    >
      {/* Left: Overall Health State with precise semantic coloring */}
      <div className="flex items-center gap-2.5">
        <span 
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            hasOffline ? 'bg-rose-500' : (hasDegraded ? 'bg-amber-400' : 'bg-emerald-500 dark:bg-emerald-400')
          }`} 
        />
        <div className="flex items-center gap-2">
          {hasOffline ? (
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              {offline} {offline === 1 ? 'usługa offline' : (offline < 5 ? 'usługi offline' : 'usług offline')}
            </span>
          ) : hasDegraded ? (
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              {degraded} {degraded === 1 ? 'usługa z problemami' : 'usługi z problemami'}
            </span>
          ) : (
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {t('status.all_systems_operational', 'Wszystkie systemy sprawne')}
            </span>
          )}

          <span className="text-slate-500 dark:text-slate-400 font-mono text-xs">
            ({online}/{total} {t('status.services_online', 'usług online')}{unknown > 0 && `, ${unknown} niezweryfikowanych`})
          </span>
        </div>
      </div>

      {/* Right: Technical Monospace Metrics */}
      <div className="flex items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400">
        {avgLatency !== null && (
          <div>
            <span className="text-slate-400 dark:text-slate-500">śr. ping: </span>
            <span className={`font-medium ${avgLatency >= 200 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-300'}`}>
              {avgLatency} ms
            </span>
          </div>
        )}

        <div className="border-l border-slate-200 dark:border-[#1d2635] pl-4">
          <span className="text-slate-400 dark:text-slate-500">uptime: </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">{overallUptime}% · 24h</span>
        </div>
      </div>
    </div>
  );
}
