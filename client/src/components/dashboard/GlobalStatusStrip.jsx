import React from 'react';
import { CheckCircle2, AlertTriangle, Activity, Zap, ShieldCheck } from 'lucide-react';
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

  const hasIssues = offline > 0 || degraded > 0;

  return (
    <div 
      className="w-full rounded-2xl glass-card border border-black/[0.06] dark:border-white/[0.08] p-3 sm:p-3.5 flex flex-wrap items-center justify-between gap-3 sm:gap-4 transition-all"
      role="region"
      aria-label="Podsumowanie stanu systemu"
    >
      {/* Left: Overall Health Badge */}
      <div className="flex items-center gap-2.5">
        <div 
          className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform ${
            hasIssues 
              ? 'bg-amber-500/15 text-amber-500 border border-amber-500/25' 
              : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25'
          }`}
          aria-hidden="true"
        >
          {hasIssues ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
              {hasIssues 
                ? (offline > 0 ? `${offline} ${t('status.services_offline', 'usług offline')}` : `${degraded} ${t('status.services_degraded', 'usług ze spadkiem wydajności')}`)
                : t('status.all_systems_operational', 'Wszystkie systemy działają')}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {online}/{total} {t('status.services_online', 'usług online')}
            {unknown > 0 && ` · ${unknown} ${t('status.unchecked', 'niezweryfikowanych')}`}
          </p>
        </div>
      </div>

      {/* Right: Key Metrics Strip */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {/* Active Ratio Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/[0.06] text-[11px]">
          <Activity className="w-3.5 h-3.5 text-accent" />
          <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
            {online}/{total}
          </span>
          <span className="text-slate-500 dark:text-slate-400 text-[10px]">online</span>
        </div>

        {/* Avg Latency Pill */}
        {avgLatency !== null && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/[0.06] text-[11px]">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
              {avgLatency} ms
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-[10px]">śr. ping</span>
          </div>
        )}

        {/* Overall Fleet Uptime with Measurement Period */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/[0.06] text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {overallUptime}% · 24h
          </span>
          <span className="text-slate-500 dark:text-slate-400 text-[10px]">uptime</span>
        </div>
      </div>
    </div>
  );
}
