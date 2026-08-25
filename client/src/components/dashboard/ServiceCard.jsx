import React, { useState } from 'react';
import { Star, SlidersHorizontal } from 'lucide-react';
import BrandIcon from '../common/BrandIcon';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

export default function ServiceCard({ service, onFavoriteToggle, onSelectService }) {
  const { addToast } = useToast();
  const openInNewTab = service.open_new_tab === 1 || service.open_new_tab === true || service.openInNewTab !== false;
  
  const [isFavorite, setIsFavorite] = useState(service.favorite === 1 || service.favorite === true);

  const healthStatus = service.health_status || service.status || 'unknown';
  const isOnline = healthStatus === 'online';
  const isDegraded = healthStatus === 'degraded';
  const isOffline = healthStatus === 'offline';

  // Handle Card Click:
  // - Shift + Click: Open Service Details Drawer
  // - Regular Click: Open service directly
  const handleCardClick = (e) => {
    e.preventDefault();
    if (e.shiftKey && onSelectService) {
      onSelectService(service);
    } else {
      handleDirectOpen(e);
    }
  };

  const handleOpenDrawer = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onSelectService) {
      onSelectService(service);
    }
  };

  const handleDirectOpen = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (openInNewTab) {
      window.open(service.url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = service.url;
    }
  };

  // Parse hostname & port from URL for clean display
  let cleanHost = '';
  try {
    const parsed = new URL(service.url);
    cleanHost = parsed.host;
  } catch {
    cleanHost = service.url.replace(/^https?:\/\//, '').split('/')[0];
  }

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newFav = isFavorite ? 0 : 1;
    setIsFavorite(Boolean(newFav));
    
    try {
      if (api.services.toggleFavorite) {
        await api.services.toggleFavorite(service.id, newFav);
      } else {
        await api.services.updateService(service.id, {
          ...service,
          favorite: newFav,
          open_new_tab: service.open_new_tab ? 1 : 0,
          enabled: service.enabled ? 1 : 0
        });
      }
      if (onFavoriteToggle) onFavoriteToggle(service.id, newFav);
      addToast(newFav ? `Przypięto ${service.name} do Ulubionych` : `Usunięto ${service.name} z Ulubionych`, 'success');
    } catch {
      setIsFavorite(!newFav);
      addToast('Nie udało się zaktualizować statusu', 'error');
    }
  };

  // Accessible status label
  const statusLabel = isOnline 
    ? 'Online' 
    : (isDegraded ? 'Problem' : (isOffline ? 'Offline' : 'Nieznany'));

  // Keyboard accessibility
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick(e);
    }
  };

  return (
    <div 
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className="group relative flex items-start gap-3 p-3 rounded-lg bg-[#141b27] hover:bg-[#182232] border border-[#1d2635] hover:border-[#2a374d] transition-colors cursor-pointer select-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none"
      aria-label={`${service.name}, status: ${statusLabel}, adres: ${cleanHost} (Shift+klik: Szczegóły)`}
      title={`${service.name} (Klik: Otwórz, Shift+Klik: Szczegóły)`}
    >
      {/* Small, subtle, non-dominating Icon */}
      <div className="w-8 h-8 rounded-md bg-[#192231] border border-[#222d41] flex items-center justify-center flex-shrink-0 text-slate-300 group-hover:text-white transition-colors">
        <BrandIcon name={service.icon} color="#94a3b8" className="w-4 h-4" fallbackText={service.name} />
      </div>

      {/* Main Content Info */}
      <div className="flex-1 min-w-0">
        {/* Row 1: Name + Custom Badge + Semantic Status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-xs sm:text-sm text-slate-200 group-hover:text-white transition-colors truncate">
              {service.name}
            </span>
            {service.custom_badge && (
              <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                [{service.custom_badge}]
              </span>
            )}
          </div>

          {/* Semantic Status Indicator */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isOnline && (
              <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Online
              </span>
            )}
            {isDegraded && (
              <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Problem
              </span>
            )}
            {isOffline && (
              <span className="flex items-center gap-1 text-[11px] font-mono text-rose-400">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                Offline
              </span>
            )}
            {!isOnline && !isDegraded && !isOffline && (
              <span className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                —
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Host:Port + Latency */}
        <div className="flex items-center justify-between gap-2 mt-1.5 pt-1.5 border-t border-[#1c2534] text-[11px] font-mono text-slate-400">
          <span className="truncate">{cleanHost}</span>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {isOffline ? (
              <span className="text-rose-400 font-medium">OFFLINE</span>
            ) : isDegraded ? (
              <span className="text-amber-400 font-medium">{service.health_response_time ? `${service.health_response_time} ms` : 'DEGRADED'}</span>
            ) : isOnline ? (
              <span className="text-slate-300 font-medium">{service.health_response_time ? `${service.health_response_time} ms` : 'OK'}</span>
            ) : (
              <span className="text-slate-500">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Discrete Hover Actions (Top-right corner overlay) */}
      <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-[#141b27]/90 px-1 py-0.5 rounded border border-[#222d41] shadow-sm">
        <button 
          onClick={handleFavoriteClick}
          className={`p-1 rounded transition-colors ${
            isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-400 hover:text-amber-400'
          }`}
          title="Ulubione"
          aria-label={isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
        >
          <Star className={`w-3 h-3 ${isFavorite ? 'fill-amber-400' : ''}`} />
        </button>

        <button
          onClick={handleOpenDrawer}
          className="p-1 rounded text-slate-400 hover:text-blue-400 transition-colors"
          title="Szczegóły (Shift+klik)"
          aria-label="Szczegóły usługi"
        >
          <SlidersHorizontal className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
