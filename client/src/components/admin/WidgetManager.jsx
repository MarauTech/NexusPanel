import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, Server, Activity, Box, Shield, Globe, 
  HeartPulse, ShieldCheck, Film, DownloadCloud, Home, 
  Sun, Terminal, Save, Check, ArrowUp, ArrowDown, RefreshCw 
} from 'lucide-react';
import api from '../../services/api';
import Button from '../common/Button';
import { useToast } from '../../contexts/ToastContext';

const WIDGET_META = {
  proxmox: { title: 'Proxmox VE (Węzeł & Kontenery)', desc: 'Obciążenie CPU/RAM węzła, stan kontenerów LXC i maszyn VM', icon: Server },
  system_resources: { title: 'Zasoby Systemu (Host)', desc: 'Obciążenie procesora, zużycie pamięci RAM, dyski twarde i uptime', icon: Activity },
  docker: { title: 'Docker Containers', desc: 'Liczba kontenerów uruchomionych/zatrzymanych i stan demona', icon: Box },
  dns_adblock: { title: 'AdGuard / Pi-hole DNS', desc: 'Statystyki zapytań 24h, zablokowane reklamy oraz przycisk pauzy', icon: Shield },
  network_status: { title: 'Sieć & WAN IP / Speedtest', desc: 'Publiczny adres IP, ping do bramy oraz wyniki testu prędkości', icon: Globe },
  service_health: { title: 'Dostępność Usług Panelu', desc: 'Wskaźnik dostępności (%), średni czas odpowiedzi i alerty offline', icon: HeartPulse },
  uptime_kuma: { title: 'Uptime Kuma Sync', desc: 'Paski dostępności 24h z monitorów Uptime Kuma', icon: ShieldCheck },
  media_streams: { title: 'Strumienie Media (Jellyfin/Plex)', desc: 'Aktywne sesje odtwarzania filmów i seriali, postęp i transkodowanie', icon: Film },
  downloads: { title: 'Pobieranie (qBittorrent)', desc: 'Prędkości pobierania/wysyłania oraz lista aktywnych torrentów', icon: DownloadCloud },
  home_assistant: { title: 'Home Assistant (IoT)', desc: 'Odczyty czujników temperatur, poboru mocy i szybkie przełączniki', icon: Home },
  weather_clock: { title: 'Zegar & Pogoda Homelab', desc: 'Cyfrowy zegar czasu rzeczywistego oraz lokalne warunki pogodowe', icon: Sun },
  scratchpad: { title: 'Podręczny Notatnik & SSH', desc: 'Szybkie notatki techniczne oraz komendy SSH kopiowane 1 kliknięciem', icon: Terminal },
};

export default function WidgetManager() {
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await api.widgets.getConfig();
      setWidgets(res.data);
    } catch (e) {
      addToast('Błąd pobierania konfiguracji widżetów', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleToggle = (type) => {
    setWidgets(prev => prev.map(w => w.type === type ? { ...w, enabled: !w.enabled } : w));
  };

  const moveWidget = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= widgets.length) return;

    setWidgets(prev => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIdx];
      updated[targetIdx] = temp;
      return updated.map((w, idx) => ({ ...w, sort_order: idx + 1 }));
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.widgets.updateConfig(widgets);
      addToast('Konfiguracja widżetów została zapisana!', 'success');
    } catch (e) {
      addToast('Nie udało się zapisać widżetów', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h2 className="text-lg font-black text-text-primary tracking-tight flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-accent" />
            Zarządzanie Widżetami Dashboardu
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Włączaj, wyłączaj i dostosuj kolejność 12 widżetów monitoringu homelaba.
          </p>
        </div>

        <Button
          onClick={handleSave}
          isLoading={saving}
          className="py-2 px-4 text-xs font-bold shadow-lg shadow-accent/25 flex items-center gap-2"
        >
          <Save className="w-3.5 h-3.5" />
          Zapisz zmiany
        </Button>
      </div>

      {/* Widget List */}
      <div className="space-y-2.5">
        {widgets.map((w, idx) => {
          const meta = WIDGET_META[w.type] || { title: w.type, desc: 'Widżet homelab', icon: LayoutGrid };
          const Icon = meta.icon;

          return (
            <div
              key={w.type}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                w.enabled 
                  ? 'bg-bg-card border-border shadow-sm' 
                  : 'bg-black/[0.02] dark:bg-white/[0.02] border-border/50 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  w.enabled 
                    ? 'bg-accent/15 border border-accent/30 text-accent' 
                    : 'bg-black/5 dark:bg-white/5 border border-border text-text-secondary'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-text-primary truncate">
                      {meta.title}
                    </span>
                    <span className="text-[10px] font-mono text-text-secondary">#{idx + 1}</span>
                  </div>
                  <p className="text-[11px] text-text-secondary truncate mt-0.5 max-w-md">
                    {meta.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Reorder Buttons */}
                <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-0.5 rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => moveWidget(idx, -1)}
                    disabled={idx === 0}
                    className="p-1 rounded text-text-secondary hover:text-text-primary disabled:opacity-30 cursor-pointer"
                    title="Przesuń wyżej"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveWidget(idx, 1)}
                    disabled={idx === widgets.length - 1}
                    className="p-1 rounded text-text-secondary hover:text-text-primary disabled:opacity-30 cursor-pointer"
                    title="Przesuń niżej"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Enable/Disable Toggle */}
                <button
                  type="button"
                  onClick={() => handleToggle(w.type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    w.enabled 
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-xs' 
                      : 'bg-black/5 dark:bg-white/5 border-border text-text-secondary'
                  }`}
                >
                  {w.enabled ? 'Włączony' : 'Wyłączony'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
