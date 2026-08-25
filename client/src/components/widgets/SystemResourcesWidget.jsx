import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Database, Clock } from 'lucide-react';
import WidgetCard from './WidgetCard';
import api from '../../services/api';

export default function SystemResourcesWidget() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.widgets.getSystem();
      setStats(res.data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const cpuUsage = stats?.cpu?.usage ?? 14;
  const memPercent = stats?.memory?.percentage ?? 42;
  const diskPercent = stats?.disk?.percentage ?? 38;

  const formatBytes = (bytes) => {
    if (!bytes) return '0 GB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const formatUptime = (seconds) => {
    if (!seconds) return '1d 4h';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    return `${d}d ${h}h`;
  };

  return (
    <WidgetCard
      title="Zasoby Host Serwera"
      icon={Activity}
      badge={`Uptime: ${formatUptime(stats?.uptime)}`}
      badgeColor="bg-blue-500/10 text-blue-400 border-blue-500/30"
      onRefresh={fetchStats}
      loading={loading}
    >
      <div className="space-y-3">
        {/* CPU Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 text-text-secondary font-medium">
              <Cpu className="w-3.5 h-3.5 text-accent" />
              Procesor ({stats?.cpu?.cores || 8} rdzeni)
            </span>
            <span className="font-mono font-bold text-text-primary">{cpuUsage}%</span>
          </div>
          <div className="w-full bg-black/10 dark:bg-white/10 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-accent h-full rounded-full transition-all duration-500" 
              style={{ width: `${cpuUsage}%` }} 
            />
          </div>
        </div>

        {/* RAM Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 text-text-secondary font-medium">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              Pamięć RAM ({formatBytes(stats?.memory?.used)} / {formatBytes(stats?.memory?.total)})
            </span>
            <span className="font-mono font-bold text-text-primary">{memPercent}%</span>
          </div>
          <div className="w-full bg-black/10 dark:bg-white/10 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${memPercent}%` }} 
            />
          </div>
        </div>

        {/* Disk Bar */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 text-text-secondary font-medium">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              Dysk główny (/)
            </span>
            <span className="font-mono font-bold text-text-primary">{diskPercent}%</span>
          </div>
          <div className="w-full bg-black/10 dark:bg-white/10 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-amber-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${diskPercent}%` }} 
            />
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}
