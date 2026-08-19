import React, { useState, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { Search } from 'lucide-react';
import BrandIcon from './BrandIcon';

const HOMELAB_ICONS = [
  { id: 'proxmox', label: 'Proxmox VE' },
  { id: 'docker', label: 'Docker' },
  { id: 'home-assistant', label: 'Home Assistant' },
  { id: 'portainer', label: 'Portainer' },
  { id: 'grafana', label: 'Grafana' },
  { id: 'pihole', label: 'Pi-hole' },
  { id: 'jellyfin', label: 'Jellyfin' },
  { id: 'nextcloud', label: 'Nextcloud' },
  { id: 'wireguard', label: 'WireGuard' },
  { id: 'asustor', label: 'ASUSTOR NAS' },
  { id: 'router', label: 'Router / Gateway' },
  { id: 'uptime-kuma', label: 'Uptime Kuma' },
  { id: 'server', label: 'Bare Metal Server' },
  { id: 'database', label: 'Database' },
  { id: 'hard-drive', label: 'Storage / Disk' },
  { id: 'cpu', label: 'CPU / Processing' },
  { id: 'network', label: 'Network Switch' },
  { id: 'wifi', label: 'Wi-Fi AP' },
  { id: 'shield', label: 'Firewall / Security' },
  { id: 'terminal', label: 'SSH / Terminal' },
  { id: 'cloud', label: 'Cloud Service' },
  { id: 'activity', label: 'Metrics / Monitor' },
  { id: 'camera', label: 'CCTV / Surveillance' },
  { id: 'tv', label: 'Media Player' },
  { id: 'home', label: 'Smart Home' },
  { id: 'lock', label: 'Vault / Bitwarden' },
];

const LUCIDE_NAMES = Object.keys(LucideIcons).filter(name => 
  (typeof LucideIcons[name] === 'object' || typeof LucideIcons[name] === 'function') && name !== 'createLucideIcon'
);

export default function IconPicker({ onSelect }) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('homelab'); // 'homelab' or 'all'

  const filteredHomelab = useMemo(() => {
    const q = search.toLowerCase();
    return HOMELAB_ICONS.filter(i => i.id.toLowerCase().includes(q) || i.label.toLowerCase().includes(q));
  }, [search]);

  const filteredLucide = useMemo(() => {
    const q = search.toLowerCase();
    return LUCIDE_NAMES.filter(name => name.toLowerCase().includes(q)).slice(0, 120);
  }, [search]);

  return (
    <div className="flex flex-col h-[65vh]">
      {/* Search Input */}
      <div className="relative mb-3">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-text-secondary" />
        </div>
        <input
          type="text"
          className="w-full bg-bg-secondary border border-border text-text-primary text-sm rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-accent shadow-sm"
          placeholder="Search icons (e.g. proxmox, server, docker)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-3 border-b border-border pb-2">
        <button
          onClick={() => setTab('homelab')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            tab === 'homelab' 
              ? 'bg-accent text-white shadow-sm' 
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
          }`}
        >
          Homelab & Apps ({HOMELAB_ICONS.length})
        </button>
        <button
          onClick={() => setTab('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            tab === 'all' 
              ? 'bg-accent text-white shadow-sm' 
              : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
          }`}
        >
          All Generic Icons
        </button>
      </div>

      {/* Icon Grid */}
      <div className="flex-1 overflow-y-auto min-h-0 border border-border rounded-xl bg-bg-secondary/40 p-4">
        {tab === 'homelab' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {filteredHomelab.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-bg-card hover:bg-bg-secondary border border-border/80 hover:border-accent text-left transition-all hover:scale-[1.02] shadow-sm group"
              >
                <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent flex-shrink-0 group-hover:bg-accent group-hover:text-white transition-colors">
                  <BrandIcon name={item.id} color="currentColor" className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs text-text-primary truncate">{item.label}</div>
                  <div className="text-[10px] text-text-secondary truncate">{item.id}</div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {filteredLucide.map(name => {
              const Icon = LucideIcons[name];
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onSelect(name)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-bg-card hover:bg-bg-secondary border border-border/70 hover:border-accent hover:text-accent transition-all group"
                  title={name}
                >
                  <Icon className="w-5 h-5 text-text-secondary group-hover:text-accent mb-1 transition-colors" />
                  <span className="text-[9px] text-text-secondary truncate w-full text-center group-hover:text-text-primary">
                    {name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {(tab === 'homelab' && filteredHomelab.length === 0) || (tab === 'all' && filteredLucide.length === 0) ? (
          <div className="text-center py-12 text-text-secondary text-sm">
            No matching icons found.
          </div>
        ) : null}
      </div>
    </div>
  );
}
