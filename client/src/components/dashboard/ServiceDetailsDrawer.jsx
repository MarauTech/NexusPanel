import React, { useState, useEffect } from 'react';
import { 
  X, ExternalLink, RefreshCw, Edit3, Trash2, Star, CheckCircle2, 
  AlertTriangle, XCircle, Clock, Globe, Tag, Folder, Copy, Check
} from 'lucide-react';
import BrandIcon from '../common/BrandIcon';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../services/api';

export default function ServiceDetailsDrawer({ 
  service, 
  isOpen, 
  onClose, 
  onRefresh, 
  onEdit, 
  onDelete, 
  onFavoriteToggle 
}) {
  const { isAuthenticated, user } = useAuth();
  const { addToast } = useToast();
  const { t } = useLanguage();

  const [isProbing, setIsProbing] = useState(false);
  const [probeResult, setProbeResult] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  const isAdmin = isAuthenticated && (!user?.role || user.role === 'admin');

  useEffect(() => {
    if (service) {
      setIsFavorite(service.favorite === 1 || service.favorite === true);
      setProbeResult(null);
    }
  }, [service]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !service) return null;

  // Extract Host and Port cleanly from URL
  let host = 'N/A';
  let port = 'N/A';

  try {
    const parsed = new URL(service.url);
    host = parsed.hostname || 'N/A';
    if (parsed.port) {
      port = parsed.port;
    } else {
      port = parsed.protocol === 'https:' ? '443' : '80';
    }
  } catch {
    const clean = service.url.replace(/^https?:\/\//, '').split('/')[0];
    const parts = clean.split(':');
    host = parts[0] || 'N/A';
    port = parts[1] || '80';
  }

  // Active status (live probe result takes precedence if triggered)
  const currentStatus = probeResult?.status || service.health_status || service.status || 'unknown';
  const currentLatency = typeof probeResult?.responseTime === 'number' 
    ? probeResult.responseTime 
    : (typeof service.health_response_time === 'number' ? service.health_response_time : null);
  const lastChecked = probeResult?.checkedAt || service.health_last_checked;

  const uptimePeriod = service.uptime_period || '24h';
  const uptimeStr = service.uptime_percentage !== undefined && service.uptime_percentage !== null
    ? `${service.uptime_percentage}% · ${uptimePeriod}`
    : 'N/A';

  const openInNewTab = service.open_new_tab === 1 || service.open_new_tab === true || service.openInNewTab !== false;

  // Copy URL action
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(service.url);
      setCopiedUrl(true);
      addToast(t('common.copied', 'Skopiowano adres URL do schowka'), 'success');
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      addToast('Nie udało się skopiować adresu', 'error');
    }
  };

  // Live Check Action
  const handleCheckNow = async () => {
    setIsProbing(true);
    try {
      const res = await api.services.probeService(service.id);
      if (res.data) {
        setProbeResult(res.data);
        addToast(
          res.data.status === 'online' 
            ? `Połączenie nawiązane (${res.data.responseTime} ms)` 
            : `Status: ${res.data.status}`,
          res.data.status === 'online' ? 'success' : 'warning'
        );
        if (onRefresh) onRefresh();
      }
    } catch {
      addToast('Nie udało się wykonać testu połączenia', 'error');
    } finally {
      setIsProbing(false);
    }
  };

  // Direct Launch Action
  const handleOpenService = () => {
    if (openInNewTab) {
      window.open(service.url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = service.url;
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async () => {
    const nextFav = isFavorite ? 0 : 1;
    setIsFavorite(Boolean(nextFav));
    try {
      if (api.services.toggleFavorite) {
        await api.services.toggleFavorite(service.id, nextFav);
      } else {
        await api.services.updateService(service.id, {
          ...service,
          favorite: nextFav
        });
      }
      if (onFavoriteToggle) onFavoriteToggle(service.id, nextFav);
      addToast(nextFav ? 'Przypięto do ulubionych' : 'Usunięto z ulubionych', 'success');
    } catch {
      setIsFavorite(!nextFav);
      addToast('Nie udało się zaktualizować statusu', 'error');
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString([], {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        {/* Drawer Panel */}
        <div 
          className="w-screen max-w-full sm:max-w-md md:max-w-lg bg-[#111622] text-slate-200 border-l border-[#1d2635] shadow-2xl flex flex-col justify-between"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1c2534]">
            <h2 id="drawer-title" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t('drawer.service_details', 'SZCZEGÓŁY USŁUGI')}
            </h2>

            <div className="flex items-center gap-1">
              <button
                onClick={handleToggleFavorite}
                className={`p-1.5 rounded transition-colors ${
                  isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-400 hover:text-amber-400'
                }`}
                title={isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
                aria-label={isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                aria-label={t('common.close', 'Zamknij')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 text-xs">
            
            {/* 1. Hero Service Profile */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-lg bg-[#141b27] border border-[#1d2635]">
              <div className="w-10 h-10 rounded-md bg-[#192231] border border-[#222d41] flex items-center justify-center flex-shrink-0 text-slate-300">
                <BrandIcon name={service.icon} className="w-5 h-5" fallbackText={service.name} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-sm font-semibold text-slate-100 break-words">
                    {service.name}
                  </h1>
                  {service.custom_badge && (() => {
                    const b = service.custom_badge.trim().toLowerCase();
                    const isGeneric = !b || b.length < 2
                      || /^port\s*(name|na)?$/i.test(b)
                      || /^(online|offline|unknown|degraded|n\/a|none|null|undefined|test|default|badge)$/i.test(b);
                    return isGeneric ? null : (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {service.custom_badge}
                      </span>
                    );
                  })()}
                </div>

                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {host}:{port}
                </p>

                {service.description && (
                  <p className="text-slate-400 mt-1.5 leading-relaxed text-[11px]">
                    {service.description}
                  </p>
                )}
              </div>
            </div>

            {/* 2. Launch Button (secondary, not SaaS-style CTA) */}
            <Button
              variant="secondary"
              onClick={handleOpenService}
              icon={ExternalLink}
              className="w-full justify-center py-2 text-xs font-medium"
            >
              {t('drawer.open_service', 'Otwórz usługę')}
            </Button>

            {/* 3. Live Health & Availability Card */}
            <div className="p-3.5 rounded-lg bg-[#141b27] border border-[#1d2635] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#1c2534]">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t('drawer.monitoring_status', 'Status i Dostępność')}
                </span>

                <button
                  onClick={handleCheckNow}
                  disabled={isProbing}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#18202d] hover:bg-[#202b3d] text-slate-300 text-[11px] font-mono border border-[#222d41] transition-colors disabled:opacity-50"
                  title={t('drawer.check_now', 'Przetestuj połączenie')}
                >
                  <RefreshCw className={`w-3 h-3 ${isProbing ? 'animate-spin text-blue-400' : ''}`} />
                  <span>{isProbing ? t('drawer.checking', 'Sprawdzanie...') : t('drawer.check_now', 'Sprawdź teraz')}</span>
                </button>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {/* Status */}
                <div className="p-2 rounded bg-[#18202d] border border-[#202c3e] space-y-0.5">
                  <span className="text-[10px] text-slate-500 block">
                    {t('drawer.status_label', 'Stan połączenia')}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    {currentStatus === 'online' && (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Online</span>
                      </>
                    )}
                    {currentStatus === 'degraded' && (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-amber-400">Problem</span>
                      </>
                    )}
                    {currentStatus === 'offline' && (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-rose-400">Offline</span>
                      </>
                    )}
                    {currentStatus === 'unknown' && (
                      <>
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-500">Nieznany</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Latency */}
                <div className="p-2 rounded bg-[#18202d] border border-[#202c3e] space-y-0.5">
                  <span className="text-[10px] text-slate-500 block">
                    {t('drawer.latency', 'Aktualne opóźnienie')}
                  </span>
                  <span className="text-slate-200 text-xs font-semibold">
                    {currentLatency !== null ? `${currentLatency} ms` : 'N/A'}
                  </span>
                </div>

                {/* Last Health Check */}
                <div className="p-2 rounded bg-[#18202d] border border-[#202c3e] space-y-0.5">
                  <span className="text-[10px] text-slate-500 block">
                    {t('drawer.last_check', 'Ostatnie sprawdzenie')}
                  </span>
                  <span className="text-slate-300 text-[11px] block truncate">
                    {formatDateTime(lastChecked)}
                  </span>
                </div>

                {/* Uptime */}
                <div className="p-2 rounded bg-[#18202d] border border-[#202c3e] space-y-0.5">
                  <span className="text-[10px] text-slate-500 block">
                    {t('drawer.uptime', 'Dostępność (Uptime)')}
                  </span>
                  <span className="text-emerald-400 text-xs font-semibold">
                    {uptimeStr}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Network & Technical Details */}
            <div className="p-3.5 rounded-lg bg-[#141b27] border border-[#1d2635] space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block pb-1 border-b border-[#1c2534]">
                {t('drawer.network_details', 'DANE SIECIOWE')}
              </span>

              {/* Service URL with copy button */}
              <div className="space-y-1">
                <span className="text-[11px] text-slate-500">
                  {t('drawer.target_url', 'Pełny adres URL')}
                </span>
                <div className="flex items-center gap-2 p-2 rounded bg-[#18202d] border border-[#202c3e]">
                  <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="text-xs font-mono text-slate-200 truncate flex-1 select-all">
                    {service.url}
                  </span>
                  <button
                    onClick={handleCopyUrl}
                    className="p-1 text-slate-400 hover:text-white transition-colors flex-shrink-0"
                    title={t('common.copy', 'Kopiuj')}
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Host and Port Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-[#18202d] border border-[#202c3e]">
                  <span className="text-[10px] text-slate-500 block">Host / IP</span>
                  <span className="text-slate-200 text-xs truncate block mt-0.5 select-all">
                    {host}
                  </span>
                </div>

                <div className="p-2 rounded bg-[#18202d] border border-[#202c3e]">
                  <span className="text-[10px] text-slate-500 block">Port</span>
                  <span className="text-slate-200 text-xs truncate block mt-0.5">
                    {port}
                  </span>
                </div>
              </div>

              {/* Category */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-slate-500" /> {t('drawer.category', 'Kategoria')}
                </span>
                <span className="text-slate-300 font-medium">
                  {service.category_name || service.category?.name || t('dashboard.other_services', 'Inne')}
                </span>
              </div>

              {/* Tags */}
              <div className="space-y-1 text-xs pt-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-500" /> {t('drawer.tags', 'Tagi')}
                </span>
                <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                  {Array.isArray(service.tags) && service.tags.length > 0 ? (
                    service.tags.map((tag, idx) => {
                      const tagName = typeof tag === 'string' ? tag : tag.name;
                      return (
                        <span 
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-[#18202d] border border-[#222d41] text-slate-400"
                        >
                          #{tagName}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-slate-500 italic text-[11px]">
                      {t('drawer.no_tags', 'Brak przypisanych tagów')}
                    </span>
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Actions Footer (Admin Actions: Edit, Delete) */}
          {isAdmin && (
            <div className="p-4 border-t border-[#1c2534] bg-[#0e131d] flex items-center justify-between gap-2.5">
              <Button
                variant="danger"
                icon={Trash2}
                onClick={() => setIsDeleteOpen(true)}
                className="flex-1 justify-center text-xs"
              >
                {t('common.delete', 'Usuń')}
              </Button>

              <Button
                variant="secondary"
                icon={Edit3}
                onClick={() => {
                  onClose();
                  if (onEdit) onEdit(service);
                }}
                className="flex-1 justify-center text-xs"
              >
                {t('common.edit', 'Edytuj')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {isDeleteOpen && (
        <ConfirmDialog
          title={t('drawer.delete_title', 'Usuwanie usługi')}
          message={t('drawer.delete_confirm', `Czy na pewno chcesz usunąć usługę "${service.name}"? Tej operacji nie można cofnąć.`)}
          confirmText={t('common.delete', 'Usuń usługę')}
          confirmVariant="danger"
          onConfirm={async () => {
            setIsDeleteOpen(false);
            try {
              await api.services.deleteService(service.id);
              addToast(`Usunięto usługę ${service.name}`, 'success');
              onClose();
              if (onDelete) onDelete(service.id);
              if (onRefresh) onRefresh();
            } catch {
              addToast('Nie udało się usunąć usługi', 'error');
            }
          }}
          onCancel={() => setIsDeleteOpen(false)}
        />
      )}
    </div>
  );
}
