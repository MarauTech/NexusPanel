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

  const latency = typeof service.health_response_time === 'number' ? service.health_response_time : null;
  const isElevatedLatency = latency !== null && latency >= 80 && latency < 200;
  const isHighLatency = latency !== null && latency >= 200;

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

  // Parse hostname & port from URL for clean, readable display
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
    ? (isHighLatency ? 'Wysokie opóźnienie' : 'Online')
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
      className="group relative flex items-start gap-3.5 p-3.5 sm:p-4 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 dark:bg-[#141b27] dark:hover:bg-[#182232] dark:border-[#1d2635] dark:hover:border-[#2a374d] transition-colors cursor-pointer select-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none min-h-[78px] shadow-sm dark:shadow-none"
      aria-label={`${service.name}, status: ${statusLabel}, adres: ${cleanHost} (Shift+klik: Szczegóły)`}
      title={`${service.name} (${cleanHost})\nKlik: Otwórz, Shift+Klik: Szczegóły`}
    >
      {/* Small, clean authentic brand Icon */}
      <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-[#192231] border border-slate-200 dark:border-[#222d41] flex items-center justify-center flex-shrink-0 mt-0.5">
        <BrandIcon name={service.icon} fallbackText={service.name} className="w-4 h-4" />
      </div>

      {/* Main Information Block */}
      <div className="flex-1 min-w-0 pr-1">
        {/* Row 1: Service Name + Status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span 
              className="font-medium text-sm text-slate-800 group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400 transition-colors line-clamp-2 break-words"
              title={service.name}
            >
              {service.name}
            </span>
            {service.custom_badge && (() => {
              const b = service.custom_badge.trim().toLowerCase();
              const isGeneric = !b || b.length < 2
                || /^port\s*(name|na)?$/i.test(b)
                || /^(online|offline|unknown|degraded|n\/a|none|null|undefined|test|default|badge)$/i.test(b);
              return isGeneric ? null : (
                <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">
                  {service.custom_badge}
                </span>
              );
            })()}
          </div>

          {/* Semantic Status Indicator */}
          <div className="flex items-center gap-1.5 flex-shrink-0 text-xs font-mono">
            {isOnline && !isHighLatency && (
              <span className={`flex items-center gap-1 ${isElevatedLatency ? 'text-emerald-600 dark:text-emerald-400' : 'text-emerald-600 dark:text-emerald-400/60'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isElevatedLatency ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-emerald-500/80 dark:bg-emerald-400/60'}`} />
                Online
              </span>
            )}
            {isOnline && isHighLatency && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                Online
              </span>
            )}
            {isDegraded && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                Problem
              </span>
            )}
            {isOffline && (
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
                Offline
              </span>
            )}
            {!isOnline && !isDegraded && !isOffline && (
              <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                —
              </span>
            )}
          </div>
        </div>

        {/* Row 2: IP/Hostname + Ping/Latency */}
        <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-slate-100 dark:border-[#1c2534] text-xs font-mono text-slate-500 dark:text-slate-400">
          <span 
            className="truncate text-slate-500 dark:text-slate-400 select-all" 
            title={cleanHost}
          >
            {cleanHost}
          </span>
          
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isOffline ? (
              <span className="text-rose-600 dark:text-rose-400 font-medium">OFFLINE</span>
            ) : isDegraded ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">{latency ? `${latency} ms` : 'DEGRADED'}</span>
            ) : isOnline ? (
              <span className={`font-medium ${
                isHighLatency ? 'text-rose-600 dark:text-rose-400' : (isElevatedLatency ? 'text-amber-600 dark:text-amber-300' : 'text-slate-700 dark:text-slate-300')
              }`}>
                {latency ? `${latency} ms` : 'OK'}
              </span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Subtle Hover Actions (Top-right corner overlay) */}
      <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 border-slate-200 dark:bg-[#141b27]/95 dark:border-[#222d41] px-1 py-0.5 rounded border shadow-sm">
        <button 
          onClick={handleFavoriteClick}
          className={`p-1 rounded transition-colors cursor-pointer ${
            isFavorite ? 'text-amber-500 dark:text-amber-400 fill-amber-400' : 'text-slate-400 hover:text-amber-500'
          }`}
          title="Ulubione"
          aria-label={isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
        >
          <Star className={`w-3 h-3 ${isFavorite ? 'fill-amber-400' : ''}`} />
        </button>

        <button
          onClick={handleOpenDrawer}
          className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          title="Szczegóły (Shift+klik)"
          aria-label="Szczegóły usługi"
        >
          <SlidersHorizontal className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
