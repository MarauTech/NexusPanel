import React, { useState, useEffect } from 'react';
import { DownloadCloud, ArrowDown, ArrowUp, CheckCircle } from 'lucide-react';
import WidgetCard from './WidgetCard';
import api from '../../services/api';

export default function DownloadManagerWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDownloads = async () => {
    setLoading(true);
    try {
      const res = await api.widgets.getDownloads();
      setData(res.data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
    const interval = setInterval(fetchDownloads, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatSpeed = (bytes) => {
    if (!bytes) return '0 MB/s';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB/s';
  };

  const tasks = data?.tasks || [];

  return (
    <WidgetCard
      title={`Pobieranie (${data?.client || 'qBittorrent'})`}
      icon={DownloadCloud}
      badge={`${tasks.length} Zadań`}
      badgeColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
      onRefresh={fetchDownloads}
      loading={loading}
    >
      <div className="space-y-3">
        {/* Speed summary row */}
        <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center gap-1.5">
            <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold text-emerald-400">{formatSpeed(data?.downloadSpeed)}</span>
          </div>

          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center gap-1.5">
            <ArrowUp className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-bold text-sky-400">{formatSpeed(data?.uploadSpeed)}</span>
          </div>
        </div>

        {/* Task list */}
        <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
          {tasks.map((t, idx) => (
            <div key={idx} className="p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-border/40 space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-text-primary truncate max-w-[170px]">{t.name}</span>
                <span className="text-[10px] text-text-secondary">{t.progress}%</span>
              </div>

              <div className="w-full bg-black/10 dark:bg-white/10 h-1 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${t.progress === 100 ? 'bg-emerald-400' : 'bg-accent'}`} 
                  style={{ width: `${t.progress}%` }} 
                />
              </div>

              <div className="flex items-center justify-between text-[9px] text-text-secondary font-mono">
                <span>{t.size} · ETA: {t.eta}</span>
                <span className="text-emerald-400">{t.speed}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
}
