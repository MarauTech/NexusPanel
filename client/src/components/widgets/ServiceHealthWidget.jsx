import React, { useState, useEffect } from 'react';
import { HeartPulse, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import WidgetCard from './WidgetCard';
import api from '../../services/api';

export default function ServiceHealthWidget() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await api.widgets.getServiceHealth();
      setHealth(res.data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const total = health?.total || 0;
  const online = health?.online || 0;
  const offline = health?.offline || 0;
  const degraded = health?.degraded || 0;
  const availability = health?.availability ?? 100;
  const avgLatency = health?.avgLatency || 0;

  return (
    <WidgetCard
      title="Dostępność Usług Panelu"
      icon={HeartPulse}
      badge={`${availability}% Dostępności`}
      badgeColor={offline > 0 ? "bg-rose-500/10 text-rose-400 border-rose-500/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"}
      onRefresh={fetchHealth}
      loading={loading}
    >
      <div className="space-y-3">
        {/* Availability Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-text-secondary font-medium">Stan infrastruktury</span>
            <span className="font-mono font-bold text-text-primary">Śr. ping: {avgLatency} ms</span>
          </div>
          <div className="w-full bg-black/10 dark:bg-white/10 h-2 rounded-full overflow-hidden flex">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500" 
              style={{ width: `${(online / (total || 1)) * 100}%` }} 
            />
            <div 
              className="bg-amber-500 h-full transition-all duration-500" 
              style={{ width: `${(degraded / (total || 1)) * 100}%` }} 
            />
            <div 
              className="bg-rose-500 h-full transition-all duration-500" 
              style={{ width: `${(offline / (total || 1)) * 100}%` }} 
            />
          </div>
        </div>

        {/* Counter Pills */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] text-emerald-400 block font-semibold">Online</span>
            <span className="text-sm font-bold text-emerald-400">{online}</span>
          </div>

          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-[10px] text-amber-400 block font-semibold">Zwolnione</span>
            <span className="text-sm font-bold text-amber-400">{degraded}</span>
          </div>

          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
            <span className="text-[10px] text-rose-400 block font-semibold">Offline</span>
            <span className="text-sm font-bold text-rose-400">{offline}</span>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}
