import React, { useState, useEffect } from 'react';
import { 
  X, ExternalLink, RefreshCw, Edit3, Trash2, Star, CheckCircle2, 
  AlertTriangle, XCircle, Clock, Globe, Shield, Tag, Folder, Copy, Check, Server
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
  let protocol = 'http:';

  try {
    const parsed = new URL(service.url);
    host = parsed.hostname || 'N/A';
    protocol = parsed.protocol;
    if (parsed.port) {
      port = parsed.port;
    } else {
      port = parsed.protocol === 'https:' ? '443 (HTTPS)' : '80 (HTTP)';
    }
  } catch {
    const clean = service.url.replace(/^https?:\/\//, '').split('/')[0];
    const parts = clean.split(':');
    host = parts[0] || 'N/A';
    port = parts[1] || '80 / 443';
  }

  // Active status (live probe result takes precedence if triggered)
  const currentStatus = probeResult?.status || service.health_status || service.status || 'unknown';
  const currentLatency = typeof probeResult?.responseTime === 'number' 
    ? probeResult.responseTime 
    : (typeof service.health_response_time === 'number' ? service.health_response_time : null);
  const lastChecked = probeResult?.checkedAt || service.health_last_checked;

  const uptimeStr = service.uptime_percentage 
    ? `${service.uptime_percentage}% (ostatnie 20 testów)`
    : 'N/A';

  const serviceColor = service.color || '#6366f1';
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

  // Live health probe
  const handleCheckNow = async () => {
    if (isProbing) return;
    setIsProbing(true);
    try {
      const res = await api.services.probeService(service.id);
      if (res.data) {
        setProbeResult(res.data);
        if (res.data.status === 'online') {
          addToast(`${service.name} jest dostępny (${res.data.responseTime}ms)`, 'success');
        } else if (res.data.status === 'degraded') {
          addToast(`${service.name} odpowiada z opóźnieniem (${res.data.responseTime}ms)`, 'warning');
        } else {
          addToast(`${service.name} jest niedostępny`, 'error');
        }
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      setProbeResult({ status: 'offline', responseTime: null, checkedAt: new Date().toISOString() });
      addToast('Błąd podczas sprawdzania dostępności', 'error');
    } finally {
      setIsProbing(false);
    }
  };

  // Favorite toggle
  const handleToggleFavorite = async () => {
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

  // Open service directly
  const handleOpenService = () => {
    if (openInNewTab) {
      window.open(service.url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = service.url;
    }
  };

  // Format date helper
  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString([], {
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
      {/* Backdrop with smooth blur */}
      <div 
        className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        {/* Drawer Panel */}
        <div 
          className="w-screen max-w-full sm:max-w-md md:max-w-lg bg-bg-secondary text-text-primary shadow-2xl border-l border-black/[0.08] dark:border-white/[0.08] flex flex-col justify-between animate-in slide-in-from-right duration-250 ease-out"
        >
          {/* Top Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center gap-2">
              <h2 id="drawer-title" className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t('drawer.service_details', 'Szczegóły Usługi')}
              </h2>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleToggleFavorite}
                className={`p-2 rounded-xl transition-all hover:scale-105 ${
                  isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-400 hover:text-amber-400'
                }`}
                title={isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
                aria-label={isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-all focus-visible:ring-2 focus-visible:ring-accent"
                aria-label={t('common.close', 'Zamknij')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-5">
            
            {/* 1. Hero Service Profile */}
            <div className="flex items-start gap-4 p-4 rounded-2xl glass-card border border-black/[0.06] dark:border-white/[0.08]">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md relative overflow-hidden"
                style={{ 
                  background: `linear-gradient(135deg, ${serviceColor} 0%, ${serviceColor}dd 100%)`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/15 pointer-events-none" />
                <BrandIcon name={service.icon} color="#ffffff" className="w-7 h-7 relative z-10" fallbackText={service.name} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight break-words">
                    {service.name}
                  </h1>
                  {service.custom_badge && (
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-accent/15 text-accent border border-accent/25 tracking-wider">
                      {service.custom_badge}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1 break-all">
                  {host}:{port}
                </p>

                {service.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {service.description}
                  </p>
                )}
              </div>
            </div>

            {/* 2. Primary Launch Button */}
            <Button
              onClick={handleOpenService}
              icon={ExternalLink}
              className="w-full justify-center py-3 text-sm font-bold shadow-md shadow-accent/20 bg-accent hover:bg-accent-hover text-white"
            >
              {t('drawer.open_service', 'Otwórz usługę')}
            </Button>

            {/* 3. Live Health & Availability Card */}
            <div className="p-4 rounded-2xl glass-card border border-black/[0.06] dark:border-white/[0.08] space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-black/[0.05] dark:border-white/[0.06]">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t('drawer.monitoring_status', 'Status i Dostępność')}
                </span>

                {isAdmin && (
                  <button
                    onClick={handleCheckNow}
                    disabled={isProbing}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent text-xs font-bold transition-all disabled:opacity-50"
                    title={t('drawer.check_now', 'Przetestuj połączenie')}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin' : ''}`} />
                    <span>{isProbing ? t('drawer.checking', 'Sprawdzanie...') : t('drawer.check_now', 'Sprawdź teraz')}</span>
                  </button>
                )}
              </div>

              {/* Status Indicator */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                {/* Status Badge */}
                <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.05] space-y-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                    {t('drawer.status_label', 'Stan połączenia')}
                  </span>
                  <div className="flex items-center gap-1.5 font-bold">
                    {currentStatus === 'online' && (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono">Online</span>
                      </>
                    )}
                    {currentStatus === 'degraded' && (
                      <>
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span className="text-amber-600 dark:text-amber-400 font-mono">Spadek wydajności</span>
                      </>
                    )}
                    {currentStatus === 'offline' && (
                      <>
                        <XCircle className="w-4 h-4 text-rose-500" />
                        <span className="text-rose-600 dark:text-rose-400 font-mono">Offline</span>
                      </>
                    )}
                    {currentStatus === 'unknown' && (
                      <>
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-400 font-mono">Niezweryfikowany</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Latency */}
                <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.05] space-y-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                    {t('drawer.latency', 'Aktualne opóźnienie')}
                  </span>
                  <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                    {currentLatency !== null ? `${currentLatency} ms` : 'N/A'}
                  </span>
                </div>

                {/* Last Health Check */}
                <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.05] space-y-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                    {t('drawer.last_check', 'Ostatnie sprawdzenie')}
                  </span>
                  <span className="font-bold font-mono text-slate-800 dark:text-slate-200 text-[11px] block truncate">
                    {formatDateTime(lastChecked)}
                  </span>
                </div>

                {/* Uptime */}
                <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.05] space-y-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                    {t('drawer.uptime', 'Dostępność (Uptime)')}
                  </span>
                  <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {uptimeStr}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Network & Technical Details */}
            <div className="p-4 rounded-2xl glass-card border border-black/[0.06] dark:border-white/[0.08] space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block pb-1 border-b border-black/[0.05] dark:border-white/[0.06]">
                {t('drawer.network_details', 'Dane Sieciowe i Konfiguracja')}
              </span>

              {/* Service URL with copy button */}
              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {t('drawer.target_url', 'Pełny adres URL')}
                </span>
                <div className="flex items-center gap-2 p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.05]">
                  <Globe className="w-4 h-4 text-accent flex-shrink-0" />
                  <span className="text-xs font-mono text-slate-800 dark:text-slate-200 truncate flex-1 select-all">
                    {service.url}
                  </span>
                  <button
                    onClick={handleCopyUrl}
                    className="p-1 rounded-lg hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all flex-shrink-0"
                    title={t('common.copy', 'Kopiuj')}
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Host and Port Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.05]">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Host / IP</span>
                  <span className="font-bold font-mono text-slate-800 dark:text-slate-200 truncate block mt-0.5 select-all">
                    {host}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.05]">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Port</span>
                  <span className="font-bold font-mono text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                    {port}
                  </span>
                </div>
              </div>

              {/* Category */}
              <div className="pt-1 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-slate-400" /> {t('drawer.category', 'Kategoria')}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {service.category_name || service.category?.name || t('dashboard.other_services', 'Inne')}
                </span>
              </div>

              {/* Tags */}
              <div className="pt-1 space-y-1.5 text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" /> {t('drawer.tags', 'Tagi')}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Array.isArray(service.tags) && service.tags.length > 0 ? (
                    service.tags.map((tag, idx) => {
                      const tagName = typeof tag === 'string' ? tag : tag.name;
                      const tagColor = typeof tag === 'object' && tag.color ? tag.color : '#6366f1';
                      return (
                        <span 
                          key={idx}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono border"
                          style={{
                            backgroundColor: `${tagColor}15`,
                            borderColor: `${tagColor}30`,
                            color: tagColor
                          }}
                        >
                          #{tagName}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                      {t('drawer.no_tags', 'Brak przypisanych tagów')}
                    </span>
                  )}
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Actions Footer (Admin Actions: Edit, Delete) */}
          {isAdmin && (
            <div className="p-4 sm:p-5 border-t border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between gap-3">
              <Button
                variant="danger"
                icon={Trash2}
                onClick={() => setIsDeleteOpen(true)}
                className="flex-1 justify-center text-xs font-bold"
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
                className="flex-1 justify-center text-xs font-bold glass-card"
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
