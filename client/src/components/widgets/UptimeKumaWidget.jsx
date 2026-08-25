import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle, AlertTriangle } from 'lucide-react';
import WidgetCard from './WidgetCard';
import api from '../../services/api';

export default function UptimeKumaWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchKuma = async () => {
    setLoading(true);
    try {
      const res = await api.widgets.getUptimeKuma();
      setData(res.data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKuma();
  }, []);

  const monitors = data?.monitors || [];

  return (
    <WidgetCard
      title="Uptime Kuma Sync"
      icon={ShieldCheck}
      badge="24h Status"
      badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
      onRefresh={fetchKuma}
      loading={loading}
    >
      <div className="space-y-2">
        {monitors.slice(0, 4).map((m, idx) => (
          <div 
            key={idx}
            className="p-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-border/40 flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2 truncate">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${m.status === 'up' ? 'bg-emerald-400 shadow-xs' : 'bg-rose-500'}`} />
              <span className="font-semibold text-text-primary truncate">{m.name}</span>
            </div>

            <div className="flex items-center gap-2 font-mono text-[10px] text-text-secondary">
              <span>{m.ping} ms</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                {m.uptime24h}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
