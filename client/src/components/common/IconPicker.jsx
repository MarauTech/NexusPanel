import React, { useState, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { Search, Sparkles, Grid } from 'lucide-react';
import Modal from './Modal';
import BrandIcon from './BrandIcon';
import { useLanguage } from '../../contexts/LanguageContext';

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
  { id: 'router', label: 'Router / Gateway' },
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
  { id: 'server', label: 'Server / Bare Metal' },
  { id: 'database', label: 'Database' },
  { id: 'hard-drive', label: 'Storage / Disk' },
  { id: 'cpu', label: 'Processor / CPU' },
  { id: 'network', label: 'Network Switch' },
  { id: 'wifi', label: 'Wi-Fi / AP' },
  { id: 'shield', label: 'Firewall / Security' },
  { id: 'terminal', label: 'SSH / Terminal' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'activity', label: 'Monitoring' },
  { id: 'camera', label: 'CCTV Camera' },
  { id: 'tv', label: 'Multimedia / TV' },
  { id: 'home', label: 'Smart Home' },
  { id: 'lock', label: 'Password Manager' },
  { id: 'globe', label: 'Website / WWW' },
  { id: 'folder', label: 'Directory / Folder' }
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
  const { t } = useLanguage();

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
    <div className="flex flex-col space-y-3.5">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-3.5 w-3.5 text-slate-400" />
        </div>
        <input
          type="text"
          className="w-full bg-[#18202d] border border-[#222d41] text-slate-200 text-xs rounded-md pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500 placeholder:text-slate-500 font-mono"
          placeholder={t('common.search', 'Szukaj ikony...')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[#1c2534] pb-2">
        <button
          type="button"
          onClick={() => setTab('homelab')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            tab === 'homelab' 
              ? 'bg-[#1c2534] text-white border border-[#2b394f]' 
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Sparkles className="w-3 h-3 text-blue-400" />
          <span>Homelab ({HOMELAB_ICONS.length})</span>
        </button>
        
        <button
          type="button"
          onClick={() => setTab('all')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            tab === 'all' 
              ? 'bg-[#1c2534] text-white border border-[#2b394f]' 
              : 'text-slate-400 hover:text-slate-200 border border-transparent'
          }`}
        >
          <Grid className="w-3 h-3 text-slate-400" />
          <span>Lucide ({LUCIDE_NAMES.length})</span>
        </button>
      </div>

      {/* Icon Grid Area */}
      <div className="max-h-[50vh] overflow-y-auto custom-scrollbar p-1">
        {tab === 'homelab' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {filteredHomelab.map(item => {
              const isSelected = selectedIcon === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`flex items-center gap-2.5 p-2 rounded-md text-left transition-colors border cursor-pointer ${
                    isSelected
                      ? 'bg-[#1c2534] border-blue-500 ring-1 ring-blue-500'
                      : 'bg-[#18202d] border-[#202c3e] hover:border-[#2f3d56]'
                  }`}
                >
                  <div className="w-7 h-7 rounded bg-[#141b27] border border-[#222d41] flex items-center justify-center flex-shrink-0">
                    <BrandIcon name={item.id} className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-xs text-slate-200 truncate">{item.label}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{item.id}</div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
            {filteredLucide.map(name => {
              const Icon = LucideIcons[name];
              const isSelected = selectedIcon === name;
              if (!Icon) return null;

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelect(name)}
                  className={`flex flex-col items-center justify-center p-2 rounded-md border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#1c2534] border-blue-500 ring-1 ring-blue-500 text-blue-400'
                      : 'bg-[#18202d] border-[#202c3e] hover:border-[#2f3d56] text-slate-400 hover:text-slate-200'
                  }`}
                  title={name}
                >
                  <Icon className="w-4 h-4 mb-1 flex-shrink-0" />
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
            {t('common.error', 'Brak wyników')}
          </div>
        )}
      </div>
    </div>
  );

  // If onClose is passed, wrap in Modal popup dialog
  if (onClose) {
    return (
      <Modal title={t('categories.icon_btn', 'Wybierz ikonę z biblioteki')} onClose={onClose} maxWidth="max-w-3xl">
        {content}
      </Modal>
    );
  }

  return content;
}
