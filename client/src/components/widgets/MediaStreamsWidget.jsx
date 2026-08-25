import React, { useState, useEffect } from 'react';
import { Film, Play, Tv, User } from 'lucide-react';
import WidgetCard from './WidgetCard';
import api from '../../services/api';

export default function MediaStreamsWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await api.widgets.getMediaStreams();
      setData(res.data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
    const interval = setInterval(fetchMedia, 20000);
    return () => clearInterval(interval);
  }, []);

  const sessions = data?.sessions || [];
  const activeCount = data?.activeStreams || sessions.length;

  return (
    <WidgetCard
      title={`Media Server (${data?.serverType || 'Jellyfin'})`}
      icon={Film}
      badge={`${activeCount} Strumienie`}
      badgeColor="bg-purple-500/10 text-purple-400 border-purple-500/30"
      onRefresh={fetchMedia}
      loading={loading}
    >
      <div className="space-y-2.5">
        {sessions.length === 0 ? (
          <div className="py-4 text-center text-xs text-text-secondary">
            Brak aktywnych odtworzeń w tej chwili.
          </div>
        ) : (
          sessions.map((s) => (
            <div 
              key={s.id}
              className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-border/50 space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <Play className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                  <span className="font-bold text-text-primary truncate">{s.title}</span>
                </div>
                <span className="text-[10px] font-mono text-text-secondary">{s.bitrate}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-purple-500 h-full rounded-full" 
                  style={{ width: `${s.progressPercent}%` }} 
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-text-secondary font-mono">
                <span>{s.user} · {s.client}</span>
                <span className="text-accent font-semibold">{s.playbackMethod}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </WidgetCard>
  );
}
