import React, { useState, useEffect } from 'react';
import { Server, Cpu, HardDrive, Play, Square } from 'lucide-react';
import WidgetCard from './WidgetCard';
import api from '../../services/api';

export default function ProxmoxWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.widgets.getProxmox();
      setData(res.data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const node = data?.node || { name: 'pve', cpu: 18.5, maxcpu: 16, mem: 14.2 * 1024 * 1024 * 1024, maxmem: 32 * 1024 * 1024 * 1024 };
  const lxc = data?.lxc || [];
  const runningLxc = lxc.filter(c => c.status === 'running').length;
  const totalLxc = lxc.length;

  const memPercent = Math.round((node.mem / (node.maxmem || 1)) * 100);
  const cpuPercent = typeof node.cpu === 'number' ? node.cpu.toFixed(1) : '18.5';

  return (
    <WidgetCard
      title={`Proxmox VE (${node.name || 'PVE'})`}
      icon={Server}
      badge={`${runningLxc}/${totalLxc} Aktywne`}
      badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
      onRefresh={fetchStats}
      loading={loading}
    >
      <div className="space-y-3">
        {/* Node Gauges */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-border/50">
            <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
              <span className="flex items-center gap-1 font-semibold">
                <Cpu className="w-3 h-3 text-accent" /> CPU
              </span>
              <span className="font-mono font-bold text-text-primary">{cpuPercent}%</span>
            </div>
            <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-accent h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, parseFloat(cpuPercent)))}%` }} 
              />
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-border/50">
            <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
              <span className="flex items-center gap-1 font-semibold">
                <HardDrive className="w-3 h-3 text-purple-400" /> RAM
              </span>
              <span className="font-mono font-bold text-text-primary">{memPercent}%</span>
            </div>
            <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-purple-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, memPercent))}%` }} 
              />
            </div>
          </div>
        </div>

        {/* LXC / VM List preview */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-secondary block">
            Maszyny i Kontenery:
          </span>
          <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
            {lxc.slice(0, 4).map((c) => (
              <div 
                key={c.vmid}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-border/40 text-xs font-mono"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.status === 'running' ? 'bg-emerald-400 shadow-xs' : 'bg-slate-500'}`} />
                  <span className="text-[11px] text-text-secondary">#{c.vmid}</span>
                  <span className="text-xs font-semibold text-text-primary truncate">{c.name}</span>
                </div>
                <span className="text-[10px] text-text-secondary uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5">
                  {c.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}
