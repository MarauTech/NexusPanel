import React, { useState } from 'react';
import { Star, ArrowUpRight } from 'lucide-react';
import BrandIcon from '../common/BrandIcon';
import { getStatusColor } from '../../utils/helpers';
import { useSettings } from '../../hooks/useSettings';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

export default function ServiceCard({ service, onFavoriteToggle, overrideSettings }) {
  const { settings: globalSettings } = useSettings();
  const settings = overrideSettings ? { ...globalSettings, ...overrideSettings } : globalSettings;
  const { addToast } = useToast();
  
  const style = settings?.tile_style || 'default';
  const openInNewTab = service.open_new_tab === 1 || service.open_new_tab === true || service.openInNewTab !== false;
  
  // Local state for instant optimistic UI reaction
  const [isFavorite, setIsFavorite] = useState(service.favorite === 1 || service.favorite === true);

  const healthStatus = service.health_status || service.status || 'unknown';
  const statusColor = getStatusColor(healthStatus);
  const showStatus = settings?.show_status_indicators !== 'false';
  const serviceColor = service.color || '#6366f1';
  const borderRadius = `${settings?.tile_border_radius || '18'}px`;

  // Parse hostname & port from URL for clean display
  let cleanHost = '';
  try {
    const parsed = new URL(service.url);
    cleanHost = parsed.host;
  } catch (e) {
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
    } catch (err) {
      setIsFavorite(!newFav);
      addToast('Nie udało się zaktualizować statusu', 'error');
    }
  };

  const handleClick = (e) => {
    e.preventDefault();
    if (openInNewTab) {
      window.open(service.url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = service.url;
    }
  };

  // ============================================
  // COMPACT STYLE (Speed-Dial Mini Pill)
  // ============================================
  if (style === 'compact') {
    return (
      <a 
        href={service.url} 
        onClick={handleClick}
        className="group relative flex items-center justify-between gap-3 p-3 transition-all duration-200 hover:scale-[1.015] active:scale-[0.98] glass-card border border-black/[0.08] dark:border-white/[0.08] shadow-sm hover:shadow-md"
        style={{ borderRadius }}
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
              <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-accent transition-colors whitespace-normal break-words">
                {service.name}
              </span>
              {showStatus && (
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusColor }} />
              )}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block break-all">{cleanHost}</span>
          </div>
        </div>

        <button 
          onClick={handleFavoriteClick}
          className={`p-1.5 rounded-lg transition-all hover:scale-110 flex-shrink-0 ${
            isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-400 hover:text-amber-400'
          }`}
          title="Ulubione"
        >
          <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
        </button>
      </a>
    );
  }

  // ============================================
  // DETAILED STYLE
  // ============================================
  if (style === 'detailed') {
    return (
      <a 
        href={service.url} 
        onClick={handleClick}
        className="group relative flex flex-col justify-between p-4.5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] glass-card border border-black/[0.08] dark:border-white/[0.08] shadow-md hover:shadow-xl"
        style={{ borderRadius }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md relative overflow-hidden group-hover:scale-105 transition-transform"
              style={{ backgroundColor: serviceColor }}
            >
              <BrandIcon name={service.icon} color="#ffffff" className="w-6 h-6 relative z-10" fallbackText={service.name} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-accent transition-colors whitespace-normal break-words">
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

          <button 
            onClick={handleFavoriteClick}
            className={`p-1.5 rounded-xl transition-all hover:scale-110 ${
              isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
          </button>
        </div>

        {service.description && (
          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 my-3 leading-relaxed">
            {service.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-black/[0.05] dark:border-white/[0.06] text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 capitalize">{healthStatus}</span>
            {service.health_response_time && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">({service.health_response_time}ms)</span>
            )}
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </div>
      </a>
    );
  }

  // ============================================
  // DEFAULT STYLE (Balanced Homelab Card)
  // ============================================
  return (
    <a 
      href={service.url} 
      onClick={handleClick}
      className="group relative flex items-center justify-between gap-3.5 p-3.5 sm:p-4 transition-all duration-200 hover:scale-[1.015] active:scale-[0.98] glass-card border border-black/[0.08] dark:border-white/[0.08] shadow-sm hover:shadow-lg"
      style={{ borderRadius }}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Squircle Brand Icon */}
        <div 
          className="w-11 h-11 rounded-[14px] flex items-center justify-center flex-shrink-0 shadow-md relative overflow-hidden group-hover:scale-105 transition-transform" 
          style={{ 
            background: `linear-gradient(135deg, ${serviceColor} 0%, ${serviceColor}cc 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-transparent to-black/15 pointer-events-none" />
          <BrandIcon name={service.icon} color="#ffffff" className="w-5 h-5 relative z-10" fallbackText={service.name} />
        </div>

        {/* Info Column */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-accent transition-colors tracking-tight whitespace-normal break-words">
              {service.name}
            </span>
            {service.custom_badge && (
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-accent/15 text-accent border border-accent/25 flex-shrink-0 tracking-wider">
                {service.custom_badge}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono block opacity-90 break-all">
              {cleanHost}
            </span>
            {showStatus && service.health_response_time && (
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-mono flex-shrink-0">
                {service.health_response_time}ms
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button 
          onClick={handleFavoriteClick}
          className={`p-1.5 rounded-lg transition-all hover:scale-110 ${
            isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
          }`}
          title="Ulubione"
        >
          <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
        </button>

        <div className="p-1 text-slate-400 dark:text-slate-500 group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all">
          <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </a>
  );
}
