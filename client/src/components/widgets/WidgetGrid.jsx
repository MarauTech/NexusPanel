import React, { useState, useEffect } from 'react';
import { LayoutGrid, ChevronDown, ChevronUp, Settings, Sliders } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

import ProxmoxWidget from './ProxmoxWidget';
import SystemResourcesWidget from './SystemResourcesWidget';
import DockerWidget from './DockerWidget';
import DnsAdblockWidget from './DnsAdblockWidget';
import NetworkStatusWidget from './NetworkStatusWidget';
import ServiceHealthWidget from './ServiceHealthWidget';
import UptimeKumaWidget from './UptimeKumaWidget';
import MediaStreamsWidget from './MediaStreamsWidget';
import DownloadManagerWidget from './DownloadManagerWidget';
import HomeAssistantWidget from './HomeAssistantWidget';
import WeatherClockWidget from './WeatherClockWidget';
import ScratchpadWidget from './ScratchpadWidget';

const WIDGET_COMPONENTS = {
  proxmox: ProxmoxWidget,
  system_resources: SystemResourcesWidget,
  docker: DockerWidget,
  dns_adblock: DnsAdblockWidget,
  network_status: NetworkStatusWidget,
  service_health: ServiceHealthWidget,
  uptime_kuma: UptimeKumaWidget,
  media_streams: MediaStreamsWidget,
  downloads: DownloadManagerWidget,
  home_assistant: HomeAssistantWidget,
  weather_clock: WeatherClockWidget,
  scratchpad: ScratchpadWidget,
};

export default function WidgetGrid() {
  const [widgets, setWidgets] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const res = await api.widgets.getConfig();
      setWidgets(res.data);
    } catch (e) {
      // fallback default list
      setWidgets([
        { type: 'proxmox', enabled: true },
        { type: 'system_resources', enabled: true },
        { type: 'docker', enabled: true },
        { type: 'dns_adblock', enabled: true },
        { type: 'network_status', enabled: true },
        { type: 'service_health', enabled: true },
        { type: 'uptime_kuma', enabled: true },
        { type: 'media_streams', enabled: true },
        { type: 'downloads', enabled: true },
        { type: 'home_assistant', enabled: true },
        { type: 'weather_clock', enabled: true },
        { type: 'scratchpad', enabled: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const enabledWidgets = widgets.filter(w => w.enabled);

  if (enabledWidgets.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="mb-8 space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <LayoutGrid className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-sm sm:text-base font-extrabold text-text-primary tracking-tight">
            Centrum Monitoringu Homelab
          </h2>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 border border-border text-text-secondary">
            {enabledWidgets.length} Widżetów
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin"
            className="text-[11px] font-medium text-text-secondary hover:text-accent flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5"
            title="Dostosuj widżety w ustawieniach"
          >
            <Sliders className="w-3 h-3" />
            <span className="hidden sm:inline">Dostosuj</span>
          </Link>

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="text-text-secondary hover:text-text-primary p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title={collapsed ? "Rozwiń widżety" : "Zwiń widżety"}
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Grid of Active Widgets */}
      {!collapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in duration-300">
          {enabledWidgets.map((w) => {
            const Component = WIDGET_COMPONENTS[w.type];
            if (!Component) return null;
            return <Component key={w.type || w.id} />;
          })}
        </div>
      )}
    </div>
  );
}
