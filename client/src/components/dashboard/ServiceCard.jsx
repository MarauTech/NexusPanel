import React from 'react';
import { Star, ArrowUpRight, Activity, ShieldCheck, Zap } from 'lucide-react';
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
  const isFavorite = service.favorite === 1 || service.favorite === true;
  const healthStatus = service.health_status || service.status || 'unknown';
  const statusColor = getStatusColor(healthStatus);
  const showStatus = settings?.show_status_indicators !== 'false';
  const serviceColor = service.color || '#6366f1';
  const borderRadius = `${settings?.tile_border_radius || '18'}px`;

  // History & SLA Uptime calculation
  const history = Array.isArray(service.history) ? service.history : [];
  const uptimeSla = service.uptime_percentage || (healthStatus === 'online' ? '100.0' : healthStatus === 'offline' ? '0.0' : '99.9');

  // Parse hostname from URL for clean display
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
    try {
      const newFav = isFavorite ? 0 : 1;
      await api.services.updateService(service.id, {
        ...service,
        favorite: newFav,
        open_new_tab: service.open_new_tab ? 1 : 0,
        enabled: service.enabled ? 1 : 0
      });
      if (onFavoriteToggle) onFavoriteToggle(service.id, newFav);
      addToast(newFav ? `Przypięto ${service.name} do Ulubionych` : `Usunięto ${service.name} z Ulubionych`, 'success');
    } catch (err) {
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
        className="group relative flex items-center justify-between gap-3 p-3 transition-all duration-200 hover:scale-[1.015] active:scale-[0.98] bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.18] shadow-sm"
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
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white truncate group-hover:text-accent transition-colors">
                {service.name}
              </span>
              {showStatus && (
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: statusColor }} />
              )}
            </div>
            <span className="text-[11px] text-slate-400 font-mono truncate block">{cleanHost}</span>
          </div>
        </div>

        <button 
          onClick={handleFavoriteClick}
          className={`p-1.5 rounded-lg transition-all hover:scale-110 flex-shrink-0 ${
            isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-500 hover:text-amber-400'
          }`}
          title="Ulubione"
        >
          <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </a>
    );
  }

  // ============================================
  // DETAILED STYLE (Startpage Card with History & Stats)
  // ============================================
  if (style === 'detailed') {
    return (
      <a
        href={service.url}
        onClick={handleClick}
        className="group relative flex flex-col justify-between p-5 transition-all duration-200 hover:scale-[1.015] active:scale-[0.98] bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/[0.2] shadow-md"
        style={{ borderRadius }}
      >
        {/* Top bar with Icon & Badges */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md relative overflow-hidden group-hover:scale-105 transition-transform"
            style={{ 
              background: `linear-gradient(135deg, ${serviceColor} 0%, ${serviceColor}cc 100%)`,
            }}
          >
            <BrandIcon name={service.icon} color="#ffffff" className="w-6 h-6 relative z-10" fallbackText={service.name} />
          </div>

          <div className="flex items-center gap-1.5">
            {service.custom_badge && (
              <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-white/[0.08] text-slate-300 border border-white/[0.08]">
                {service.custom_badge}
              </span>
            )}
            <button 
              onClick={handleFavoriteClick}
              className={`p-1.5 rounded-lg transition-all hover:scale-110 ${
                isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-500 hover:text-amber-400'
              }`}
              title="Ulubione"
            >
              <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Full Name & Host */}
        <div className="space-y-1 mb-4 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-base text-white tracking-tight group-hover:text-accent transition-colors leading-tight truncate">
              {service.name}
            </h3>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0" />
          </div>
          <span className="text-xs text-slate-400 font-mono block">{cleanHost}</span>
          {service.description && (
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed pt-1">{service.description}</p>
          )}
        </div>

        {/* Uptime SLA & 20-Pill History */}
        {showStatus && service.health_check_enabled !== 0 && (
          <div className="pt-3 border-t border-white/[0.08] space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold">
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
                {healthStatus.toUpperCase()} {service.health_response_time ? `(${service.health_response_time}ms)` : ''}
              </span>
              <span className="text-emerald-400 font-mono font-bold">{uptimeSla}% Uptime</span>
            </div>

            <div className="flex items-center gap-[3px] h-1.5">
              {history.length > 0 ? (
                history.slice(-20).map((h, i) => (
                  <span
                    key={i}
                    className={`flex-1 h-full rounded-sm transition-all ${
                      h.status === 'online' ? 'bg-emerald-400' : h.status === 'degraded' ? 'bg-amber-400' : 'bg-rose-500'
                    }`}
                    title={`${h.status} · ${h.responseTime || 0}ms`}
                  />
                ))
              ) : (
                [...Array(16)].map((_, i) => (
                  <span
                    key={i}
                    className={`flex-1 h-full rounded-sm ${
                      healthStatus === 'online' ? 'bg-emerald-400/80' : healthStatus === 'degraded' ? 'bg-amber-400' : 'bg-rose-500/80'
                    }`}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </a>
    );
  }

  // ============================================
  // DEFAULT STYLE (Minimalist Speed-Dial Tile)
  // ============================================
  return (
    <a
      href={service.url}
      onClick={handleClick}
      className="group relative flex items-center justify-between p-3.5 transition-all duration-200 hover:scale-[1.015] active:scale-[0.98] bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.18] shadow-sm hover:shadow-md"
      style={{ borderRadius }}
    >
      {/* Left: App Logo + Info */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
        {/* Squircle App Logo */}
        <div 
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm relative overflow-hidden group-hover:scale-105 transition-transform"
          style={{ 
            background: `linear-gradient(135deg, ${serviceColor} 0%, ${serviceColor}dd 100%)`,
          }}
        >
          <BrandIcon name={service.icon} color="#ffffff" className="w-5 h-5 relative z-10" fallbackText={service.name} />
        </div>

        {/* Text Details */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="font-bold text-[14.5px] text-white tracking-tight group-hover:text-accent transition-colors truncate">
            {service.name}
          </div>
          
          <div className="flex items-center gap-2 text-[11.5px] text-slate-400 font-mono truncate">
            {service.custom_badge && (
              <span className="px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase tracking-wider bg-white/[0.08] text-slate-300 flex-shrink-0">
                {service.custom_badge}
              </span>
            )}
            <span className="truncate opacity-80">{cleanHost}</span>
          </div>
        </div>
      </div>

      {/* Right: Live Status Pill & Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {showStatus && healthStatus !== 'unknown' && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold font-mono text-emerald-400">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            <span>{service.health_response_time ? `${service.health_response_time}ms` : 'UP'}</span>
          </span>
        )}

        <button 
          onClick={handleFavoriteClick}
          className={`p-1.5 rounded-lg transition-all hover:scale-110 opacity-70 group-hover:opacity-100 ${
            isFavorite ? 'text-amber-400 fill-amber-400 opacity-100' : 'text-slate-500 hover:text-amber-400'
          }`}
          title="Ulubione"
        >
          <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        <div className="p-1.5 rounded-lg text-slate-500 group-hover:text-slate-200 transition-colors opacity-70 group-hover:opacity-100">
          <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </a>
  );
}
