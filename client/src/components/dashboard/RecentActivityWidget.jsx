import React, { useMemo } from 'react';
import { Clock, CheckCircle2, AlertTriangle, XCircle, History } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function RecentActivityWidget({ services = [] }) {
  const { t } = useLanguage();

  // Aggregate real events from all services' history or last checked fields
  const recentEvents = useMemo(() => {
    const events = [];

    services.forEach(svc => {
      if (Array.isArray(svc.history) && svc.history.length > 0) {
        svc.history.forEach(h => {
          events.push({
            serviceId: svc.id,
            serviceName: svc.name,
            serviceIcon: svc.icon,
            serviceColor: svc.color || '#6366f1',
            status: h.status || 'online',
            responseTime: h.responseTime,
            timestamp: h.checkedAt || new Date().toISOString()
          });
        });
      } else if (svc.health_last_checked) {
        events.push({
          serviceId: svc.id,
          serviceName: svc.name,
          serviceIcon: svc.icon,
          serviceColor: svc.color || '#6366f1',
          status: svc.health_status || 'online',
          responseTime: svc.health_response_time,
          timestamp: svc.health_last_checked
        });
      }
    });

    // Sort descending by timestamp and take latest 5
    return events
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);
  }, [services]);

  function formatTimeAgo(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffSecs = Math.floor((now - date) / 1000);

      if (diffSecs < 60) return 'przed chwilą';
      if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)} min temu`;
      if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)} godz. temu`;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  return (
    <div className="rounded-2xl glass-card border border-black/[0.08] dark:border-white/[0.08] p-4 sm:p-5 space-y-3.5 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2.5 border-b border-black/[0.05] dark:border-white/[0.06]">
        <div className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-500 flex items-center justify-center">
          <History className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
          {t('overview.recent_checks', 'OSTATNIE SPRAWDZENIA')}
        </h3>
      </div>

      {/* Events List */}
      {recentEvents.length > 0 ? (
        <div className="space-y-2.5">
          {recentEvents.map((evt, idx) => {
            const isOnline = evt.status === 'online';
            const isDegraded = evt.status === 'degraded';
            const isOffline = evt.status === 'offline';

            return (
              <div 
                key={`${evt.serviceId}-${idx}`} 
                className="flex items-center justify-between gap-2.5 text-xs py-1"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: isOnline ? '#10b981' : (isDegraded ? '#f59e0b' : '#ef4444')
                    }}
                    title={evt.status}
                  />

                  <div className="min-w-0">
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate block text-[11px]">
                      {evt.serviceName}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                      {evt.status} {evt.responseTime ? `(${evt.responseTime}ms)` : ''}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                  {formatTimeAgo(evt.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-4 px-2 space-y-1">
          <Clock className="w-6 h-6 text-slate-400 dark:text-slate-500 mx-auto stroke-1" />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {t('overview.no_activity', 'Brak zarejestrowanych zdarzeń')}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            {t('overview.no_activity_sub', 'Wyniki sprawdzania dostępności pojawią się tutaj.')}
          </p>
        </div>
      )}
    </div>
  );
}
