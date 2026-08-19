import React, { useState, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { Search, Sparkles, Grid } from 'lucide-react';
import Modal from './Modal';
import BrandIcon from './BrandIcon';

const HOMELAB_ICONS = [
  { id: 'proxmox', label: 'Proxmox VE' },
  { id: 'docker', label: 'Docker' },
  { id: 'home-assistant', label: 'Home Assistant' },
  { id: 'portainer', label: 'Portainer' },
  { id: 'grafana', label: 'Grafana' },
  { id: 'pihole', label: 'Pi-hole' },
  { id: 'jellyfin', label: 'Jellyfin' },
  { id: 'plex', label: 'Plex Media' },
  { id: 'nextcloud', label: 'Nextcloud' },
  { id: 'wireguard', label: 'WireGuard' },
  { id: 'asustor', label: 'ASUSTOR NAS' },
  { id: 'synology', label: 'Synology DSM' },
  { id: 'router', label: 'Router / Brama' },
  { id: 'uptime-kuma', label: 'Uptime Kuma' },
  { id: 'sonarr', label: 'Sonarr' },
  { id: 'radarr', label: 'Radarr' },
  { id: 'prowlarr', label: 'Prowlarr' },
  { id: 'qbittorrent', label: 'qBittorrent' },
  { id: 'transmission', label: 'Transmission' },
  { id: 'nginx', label: 'Nginx Proxy' },
  { id: 'syncthing', label: 'Syncthing' },
  { id: 'netdata', label: 'Netdata' },
  { id: 'prometheus', label: 'Prometheus' },
  { id: 'server', label: 'Serwer / Bare Metal' },
  { id: 'database', label: 'Baza Danych' },
  { id: 'hard-drive', label: 'Dysk / Magazyn' },
  { id: 'cpu', label: 'Procesor / CPU' },
  { id: 'network', label: 'Przełącznik sieciowy' },
  { id: 'wifi', label: 'Wi-Fi / AP' },
  { id: 'shield', label: 'Firewall / Bezpieczeństwo' },
  { id: 'terminal', label: 'SSH / Konsola' },
  { id: 'cloud', label: 'Chmura' },
  { id: 'activity', label: 'Monitoring' },
  { id: 'camera', label: 'Kamera CCTV' },
  { id: 'tv', label: 'Multimedia / TV' },
  { id: 'home', label: 'Smart Home' },
  { id: 'lock', label: 'Menedżer haseł' },
  { id: 'globe', label: 'Strona WWW' },
  { id: 'folder', label: 'Katalog / Folder' }
];

const LUCIDE_NAMES = Object.keys(LucideIcons).filter(name => 
  (typeof LucideIcons[name] === 'object' || typeof LucideIcons[name] === 'function') && 
  name !== 'createLucideIcon' && 
  name !== 'default' &&
  !name.endsWith('Icon')
);

export default function IconPicker({ selectedIcon = '', onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('homelab'); // 'homelab' | 'all'

  const filteredHomelab = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return HOMELAB_ICONS;
    return HOMELAB_ICONS.filter(i => i.id.toLowerCase().includes(q) || i.label.toLowerCase().includes(q));
  }, [search]);

  const filteredLucide = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return LUCIDE_NAMES.slice(0, 150);
    return LUCIDE_NAMES.filter(name => name.toLowerCase().includes(q)).slice(0, 150);
  }, [search]);

  const handleSelect = (iconId) => {
    onSelect(iconId);
    if (onClose) onClose();
  };

  const content = (
    <div className="flex flex-col space-y-4">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          className="w-full bg-black/[0.04] dark:bg-black/40 border border-black/[0.1] dark:border-white/15 text-slate-900 dark:text-white text-xs sm:text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-accent shadow-sm placeholder:text-slate-400"
          placeholder="Szukaj ikony (np. proxmox, docker, tv, home, server, nas)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-black/[0.06] dark:border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setTab('homelab')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'homelab' 
              ? 'bg-accent text-white shadow-md shadow-accent/25' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Aplikacje i Homelab ({HOMELAB_ICONS.length})</span>
        </button>
        
        <button
          type="button"
          onClick={() => setTab('all')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'all' 
              ? 'bg-accent text-white shadow-md shadow-accent/25' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/5'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Wszystkie ikony Lucide ({LUCIDE_NAMES.length})</span>
        </button>
      </div>

      {/* Icon Grid Area */}
      <div className="max-h-[50vh] overflow-y-auto custom-scrollbar p-1">
        {tab === 'homelab' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {filteredHomelab.map(item => {
              const isSelected = selectedIcon === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-accent/15 border-accent shadow-sm ring-2 ring-accent/30'
                      : 'glass-card border-black/[0.08] dark:border-white/10 hover:border-accent/40 hover:scale-[1.02]'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center text-accent flex-shrink-0 shadow-sm">
                    <BrandIcon name={item.id} color="currentColor" className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">{item.label}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">{item.id}</div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {filteredLucide.map(name => {
              const Icon = LucideIcons[name];
              const isSelected = selectedIcon === name;
              if (!Icon) return null;

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelect(name)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-accent/20 border-accent shadow-sm ring-2 ring-accent/30 text-accent'
                      : 'glass-card border-black/[0.08] dark:border-white/10 hover:border-accent/40 hover:scale-105 text-slate-600 dark:text-slate-300 hover:text-accent'
                  }`}
                  title={name}
                >
                  <Icon className="w-5 h-5 mb-1 flex-shrink-0" />
                  <span className="text-[9px] truncate w-full text-center font-mono opacity-80">
                    {name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {((tab === 'homelab' && filteredHomelab.length === 0) || (tab === 'all' && filteredLucide.length === 0)) && (
          <div className="text-center py-12 text-slate-400 text-xs">
            Nie znaleziono pasujących ikon dla zapytania „{search}”.
          </div>
        )}
      </div>
    </div>
  );

  // If onClose is passed, wrap in Modal popup dialog
  if (onClose) {
    return (
      <Modal title="Wybierz ikonę z biblioteki" onClose={onClose} maxWidth="max-w-3xl">
        {content}
      </Modal>
    );
  }

  return content;
}
