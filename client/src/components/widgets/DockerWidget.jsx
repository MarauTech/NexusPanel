import React, { useState, useEffect } from 'react';
import { Box, Play, Square, RefreshCw, Layers } from 'lucide-react';
import WidgetCard from './WidgetCard';
import api from '../../services/api';

export default function DockerWidget() {
  const [docker, setDocker] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDocker = async () => {
    setLoading(true);
    try {
      const res = await api.widgets.getDocker();
      setDocker(res.data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocker();
    const interval = setInterval(fetchDocker, 20000);
    return () => clearInterval(interval);
  }, []);

  const containers = docker?.containers || { total: 18, running: 16, stopped: 2, restarting: 0 };
  const topList = docker?.topContainers || [];

  return (
    <WidgetCard
      title="Docker Engine"
      icon={Box}
      badge={`v${docker?.version || '27.3.1'}`}
      badgeColor="bg-sky-500/10 text-sky-400 border-sky-500/30"
      onRefresh={fetchDocker}
      loading={loading}
    >
      <div className="space-y-3">
        {/* Status Counters */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">Działające</span>
            <span className="text-base font-extrabold font-mono text-emerald-400">{containers.running}</span>
          </div>

          <div className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-border/50">
            <span className="text-[10px] text-text-secondary font-bold block uppercase tracking-wider">Zatrzymane</span>
            <span className="text-base font-extrabold font-mono text-text-secondary">{containers.stopped}</span>
          </div>

          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20">
            <span className="text-[10px] text-sky-400 font-bold block uppercase tracking-wider">Wszystkie</span>
            <span className="text-base font-extrabold font-mono text-sky-400">{containers.total}</span>
          </div>
        </div>

        {/* Top Active Containers */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary block">
            Aktywne kontenery:
          </span>
          <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
            {topList.slice(0, 4).map((c) => (
              <div 
                key={c.name}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-border/40 text-xs font-mono"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 shadow-xs" />
                  <span className="font-semibold text-text-primary truncate">{c.name}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-text-secondary">
                  <span>{c.memory}</span>
                  <span className="text-accent">{c.cpu}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}
