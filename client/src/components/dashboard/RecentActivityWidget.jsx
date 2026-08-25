import React, { useMemo } from 'react';
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
            status: h.status || 'online',
            responseTime: h.responseTime,
            timestamp: h.checkedAt || new Date().toISOString()
          });
        });
      } else if (svc.health_last_checked) {
        events.push({
          serviceId: svc.id,
          serviceName: svc.name,
          status: svc.health_status || 'online',
          responseTime: svc.health_response_time,
          timestamp: svc.health_last_checked
        });
      }
    });

    // Sort descending by timestamp and take latest 6
    return events
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 6);
  }, [services]);

  function formatTimeAgo(dateString) {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffSecs = Math.floor((now - date) / 1000);

      if (diffSecs < 60) return 'przed chwilą';
      if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)} min temu`;
      if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h temu`;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  return (
    <div className="rounded-lg bg-[#141b27] border border-[#1d2635] p-4 space-y-3 text-xs">
      {/* Header */}
      <div className="pb-2 border-b border-[#1c2534] flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          {t('overview.recent_checks', 'OSTATNIE SPRAWDZENIA')}
        </h3>
        <span className="text-[10px] font-mono text-slate-500">Live Log</span>
      </div>

      {/* Log Table Rows */}
      {recentEvents.length > 0 ? (
        <div className="space-y-1.5 font-mono text-[11px]">
          {recentEvents.map((evt, idx) => {
            const isOnline = evt.status === 'online';
            const isDegraded = evt.status === 'degraded';

            return (
              <div 
                key={`${evt.serviceId}-${idx}`} 
                className="flex items-center justify-between gap-2 py-0.5 border-b border-[#18202d] last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span 
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      isOnline ? 'bg-emerald-400' : (isDegraded ? 'bg-amber-400' : 'bg-rose-400')
                    }`}
                  />
                  <span className="text-slate-300 font-medium truncate">
                    {evt.serviceName}
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 text-slate-400">
                  <span>{evt.responseTime ? `${evt.responseTime} ms` : evt.status}</span>
                  <span className="text-slate-500 text-[10px]">{formatTimeAgo(evt.timestamp)}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-2 text-center text-slate-500 text-[11px] font-mono">
          {t('overview.no_activity', 'Brak zarejestrowanych sprawdzeń')}
        </div>
      )}
    </div>
  );
}
