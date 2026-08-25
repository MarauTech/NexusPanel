import React, { useState, useEffect } from 'react';
import { Globe, Wifi, ArrowDown, ArrowUp, Eye, EyeOff, Gauge } from 'lucide-react';
import WidgetCard from './WidgetCard';
import api from '../../services/api';

export default function NetworkStatusWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showIp, setShowIp] = useState(false);

  const fetchNetwork = async () => {
    setLoading(true);
    try {
      const res = await api.widgets.getNetwork();
      setData(res.data);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetwork();
  }, []);

  const wanIp = data?.wanIp || '188.146.72.19';
  const speed = data?.speedtest || { downloadMbps: 842.5, uploadMbps: 295.1, pingMs: 8.2 };

  return (
    <WidgetCard
      title="Sieć & WAN IP"
      icon={Globe}
      badge={`Ping: ${speed.pingMs} ms`}
      badgeColor="bg-sky-500/10 text-sky-400 border-sky-500/30"
      onRefresh={fetchNetwork}
      loading={loading}
    >
      <div className="space-y-3">
        {/* WAN IP & Gateway row */}
        <div className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-border/50 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-text-secondary uppercase font-mono tracking-wider block">
              Publiczny adres IP:
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono font-bold text-xs sm:text-sm text-text-primary">
                {showIp ? wanIp : wanIp.replace(/\d+\.\d+$/, '***.***')}
              </span>
              <button
                type="button"
                onClick={() => setShowIp(!showIp)}
                className="text-text-secondary hover:text-text-primary cursor-pointer p-0.5"
                title={showIp ? "Ukryj IP" : "Pokaż pełne IP"}
              >
                {showIp ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-text-secondary uppercase font-mono tracking-wider block">
              Brama LAN:
            </span>
            <span className="font-mono text-xs font-semibold text-text-primary block mt-0.5">
              {data?.gateway || '192.168.10.1'}
            </span>
          </div>
        </div>

        {/* Speedtest pill results */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-400 font-semibold uppercase">
              <ArrowDown className="w-3 h-3" /> Pobieranie
            </div>
            <span className="text-sm font-extrabold font-mono text-emerald-400 block mt-0.5">
              {speed.downloadMbps} <span className="text-[10px]">Mbps</span>
            </span>
          </div>

          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center justify-center gap-1 text-[10px] text-purple-400 font-semibold uppercase">
              <ArrowUp className="w-3 h-3" /> Wysyłanie
            </div>
            <span className="text-sm font-extrabold font-mono text-purple-400 block mt-0.5">
              {speed.uploadMbps} <span className="text-[10px]">Mbps</span>
            </span>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}
