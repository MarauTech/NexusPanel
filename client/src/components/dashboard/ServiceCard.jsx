import React, { useState } from 'react';
import { Star, SlidersHorizontal, AlertTriangle, ArrowUpRight } from 'lucide-react';
import BrandIcon from '../common/BrandIcon';
import { useSettings } from '../../hooks/useSettings';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

export default function ServiceCard({ service, onFavoriteToggle, onSelectService, overrideSettings }) {
  const { settings: globalSettings } = useSettings();
  const settings = overrideSettings ? { ...globalSettings, ...overrideSettings } : globalSettings;
  const { addToast } = useToast();
  
  const style = settings?.tile_style || 'default';
  const openInNewTab = service.open_new_tab === 1 || service.open_new_tab === true || service.openInNewTab !== false;
  
  const [isFavorite, setIsFavorite] = useState(service.favorite === 1 || service.favorite === true);

  const healthStatus = service.health_status || service.status || 'unknown';
  const showStatus = settings?.show_status_indicators !== 'false';
  const serviceColor = service.color || '#6366f1';
  const borderRadius = `${settings?.tile_border_radius || '18'}px`;

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
    : (isDegraded ? 'Spadek wydajności (Degraded)' : (isOffline ? 'Offline' : 'Niezweryfikowany'));

  // Keyboard accessibility
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick(e);
    }
  };

  // ============================================
  // COMPACT STYLE
  // ============================================
  if (style === 'compact') {
    return (
      <div 
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        className="group relative flex items-center justify-between gap-3 p-3 transition-all duration-200 hover:scale-[1.015] active:scale-[0.98] glass-card border border-black/[0.08] dark:border-white/[0.08] shadow-sm hover:shadow-md focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none cursor-pointer select-none"
        style={{ borderRadius }}
        aria-label={`${service.name}, status: ${statusLabel}, adres: ${cleanHost} (Shift+klik: Szczegóły)`}
        title={`${service.name} (Klik: Otwórz, Shift+Klik: Szczegóły)`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden shadow-sm group-hover:scale-105 transition-transform"
            style={{ backgroundColor: serviceColor }}
          >
            <BrandIcon name={service.icon} color="#ffffff" className="w-4 h-4 relative z-10" fallbackText={service.name} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {showStatus && (
                isDegraded ? (
                  <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                ) : (
                  <span 
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isOnline ? 'bg-emerald-500' : (isOffline ? 'bg-rose-500' : 'bg-slate-400')
                    }`}
                  />
                )
              )}
              <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-accent transition-colors whitespace-normal break-words">
                {service.name}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              <span className="truncate">{cleanHost}</span>
              {showStatus && (
                isOffline ? (
                  <span className="text-rose-500 font-bold text-[10px] uppercase">OFFLINE</span>
                ) : isDegraded ? (
                  <span className="text-amber-500 font-bold">{service.health_response_time ? `${service.health_response_time}ms` : 'DEGRADED'}</span>
                ) : isOnline ? (
                  <span className="text-emerald-500 font-bold">{service.health_response_time ? `${service.health_response_time}ms` : 'ONLINE'}</span>
                ) : null
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button 
            onClick={handleFavoriteClick}
            className={`p-1.5 rounded-lg transition-all hover:scale-110 flex-shrink-0 ${
              isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-400 hover:text-amber-400'
            }`}
            title="Ulubione"
            aria-label={isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            onClick={handleOpenDrawer}
            className="p-1.5 rounded-lg text-slate-400 hover:text-accent hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all"
            title="Szczegóły usługi (lub Shift+klik)"
            aria-label="Szczegóły usługi"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // DETAILED STYLE
  // ============================================
  if (style === 'detailed') {
    return (
      <div 
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        className="group relative flex flex-col justify-between p-4 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] glass-card border border-black/[0.08] dark:border-white/[0.08] shadow-md hover:shadow-xl focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none cursor-pointer select-none"
        style={{ borderRadius }}
        aria-label={`${service.name}, status: ${statusLabel}, adres: ${cleanHost} (Shift+klik: Szczegóły)`}
        title={`${service.name} (Klik: Otwórz, Shift+Klik: Szczegóły)`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md relative overflow-hidden group-hover:scale-105 transition-transform"
              style={{ backgroundColor: serviceColor }}
            >
              <BrandIcon name={service.icon} color="#ffffff" className="w-5 h-5 relative z-10" fallbackText={service.name} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {showStatus && (
                  isDegraded ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  ) : (
                    <span 
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isOnline ? 'bg-emerald-500' : (isOffline ? 'bg-rose-500' : 'bg-slate-400')
                      }`}
                    />
                  )
                )}
                <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-accent transition-colors whitespace-normal break-words">
                  {service.name}
                </span>
                {service.custom_badge && (
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-accent/15 text-accent border border-accent/20 flex-shrink-0">
                    {service.custom_badge}
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 block break-all">{cleanHost}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button 
              onClick={handleFavoriteClick}
              className={`p-1.5 rounded-xl transition-all hover:scale-110 ${
                isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-400 hover:text-amber-400'
              }`}
              aria-label={isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>

            <button
              onClick={handleOpenDrawer}
              className="p-1.5 rounded-xl text-slate-400 hover:text-accent hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all"
              title="Szczegóły usługi (lub Shift+klik)"
              aria-label="Szczegóły usługi"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {service.description && (
          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 my-2.5 leading-relaxed">
            {service.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-2.5 border-t border-black/[0.05] dark:border-white/[0.06] text-xs font-mono">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300">
            <span className="capitalize">{statusLabel}</span>
            {service.health_response_time && <span>· {service.health_response_time}ms</span>}
            {service.uptime_percentage && <span>· {service.uptime_percentage}% up</span>}
          </div>
          <div 
            onClick={handleDirectOpen}
            className="p-1 text-slate-400 group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all cursor-pointer"
            title="Otwórz bezpośrednio"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // DEFAULT MINIMAL COMPACT STYLE
  // ============================================
  return (
    <div 
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className="group relative flex items-center justify-between gap-3 p-3.5 transition-all duration-200 hover:scale-[1.015] active:scale-[0.98] glass-card border border-black/[0.08] dark:border-white/[0.08] shadow-sm hover:shadow-lg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none cursor-pointer select-none"
      style={{ borderRadius }}
      aria-label={`${service.name}, status: ${statusLabel}, adres: ${cleanHost} (Shift+klik: Szczegóły)`}
      title={`${service.name} (Klik: Otwórz, Shift+Klik: Szczegóły)`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Squircle Brand Icon */}
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md relative overflow-hidden group-hover:scale-105 transition-transform" 
          style={{ 
            background: `linear-gradient(135deg, ${serviceColor} 0%, ${serviceColor}dd 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/15 pointer-events-none" />
          <BrandIcon name={service.icon} color="#ffffff" className="w-4.5 h-4.5 relative z-10" fallbackText={service.name} />
        </div>

        {/* Info Block */}
        <div className="flex-1 min-w-0">
          {/* Row 1: Status dot/icon + Name + Badge */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {showStatus && (
              isDegraded ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" title={`Status: ${statusLabel}`} />
              ) : (
                <span 
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isOnline ? 'bg-emerald-500' : (isOffline ? 'bg-rose-500' : 'bg-slate-400')
                  }`}
                  title={`Status: ${statusLabel}`}
                />
              )
            )}
            <span className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-accent transition-colors tracking-tight whitespace-normal break-words">
              {service.name}
            </span>
            {service.custom_badge && (
              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-accent/15 text-accent border border-accent/25 flex-shrink-0 tracking-wider">
                {service.custom_badge}
              </span>
            )}
          </div>
          
          {/* Row 2: Clean Host:Port + Latency / Status */}
          <div className="flex items-center justify-between gap-2 mt-0.5 text-[11px] font-mono">
            <span className="text-slate-500 dark:text-slate-400 truncate">
              {cleanHost}
            </span>
            {showStatus && (
              isOffline ? (
                <span className="text-rose-500 font-bold text-[10px] uppercase flex-shrink-0">
                  OFFLINE
                </span>
              ) : isDegraded ? (
                <span className="text-amber-500 font-bold flex-shrink-0">
                  {service.health_response_time ? `${service.health_response_time}ms` : 'DEGRADED'}
                </span>
              ) : isOnline ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">
                  {service.health_response_time ? `${service.health_response_time}ms` : 'ONLINE'}
                </span>
              ) : (
                <span className="text-slate-400 text-[10px] flex-shrink-0">N/A</span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button 
          onClick={handleFavoriteClick}
          className={`p-1.5 rounded-lg transition-all hover:scale-110 ${
            isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
          }`}
          title="Ulubione"
          aria-label={isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
        >
          <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
        </button>

        <button
          onClick={handleOpenDrawer}
          className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-accent hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all"
          title="Szczegóły usługi (lub Shift+klik)"
          aria-label="Szczegóły usługi"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
