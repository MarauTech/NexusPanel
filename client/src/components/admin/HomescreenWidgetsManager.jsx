import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Star, Activity, Layers, Clock, ShieldCheck, 
  LayoutGrid, Check, RefreshCw, Plus, Trash2, ArrowUp, ArrowDown, 
  ExternalLink, Sun, Moon, Info, MonitorCheck
} from 'lucide-react';
import API from '../../services/api';
import { useServices } from '../../hooks/useServices';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../common/Button';

export default function HomescreenWidgetsManager() {
  const { services, loading: servicesLoading, refresh: refreshServices } = useServices();
  const { addToast } = useToast();
  const { theme } = useTheme();

  const [selectedWidget, setSelectedWidget] = useState('favorite_apps');
  const [previewTheme, setPreviewTheme] = useState(theme || 'dark');
  const [loading, setLoading] = useState(false);

  // Data states
  const [favApps, setFavApps] = useState([]);
  const [serverStats, setServerStats] = useState(null);
  const [servicesSummary, setServicesSummary] = useState(null);
  const [uptimeStats, setUptimeStats] = useState(null);
  const [singleService, setSingleService] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [overviewData, setOverviewData] = useState(null);

  // Load all live widget data from API
  const loadWidgetData = async () => {
    setLoading(true);
    try {
      const [favRes, srvRes, sumRes, upRes, singleRes, overRes] = await Promise.allSettled([
        API.widgets.getFavoriteApps(),
        API.widgets.getServerStatus(),
        API.widgets.getServicesSummary(),
        API.widgets.getUptimeStats(),
        API.widgets.getServiceMonitor(),
        API.widgets.getOverview()
      ]);

      if (favRes.status === 'fulfilled') {
        const data = favRes.value.data || [];
        setFavApps(data);
        try { window.AndroidWidgetBridge?.syncWidgetData('favorite_apps', JSON.stringify(data)); } catch (e) {}
      }
      if (srvRes.status === 'fulfilled') {
        const data = srvRes.value.data || null;
        setServerStats(data);
        try { window.AndroidWidgetBridge?.syncWidgetData('server_status', JSON.stringify(data)); } catch (e) {}
      }
      if (sumRes.status === 'fulfilled') {
        const data = sumRes.value.data || null;
        setServicesSummary(data);
        try { window.AndroidWidgetBridge?.syncWidgetData('services_summary', JSON.stringify(data)); } catch (e) {}
      }
      if (upRes.status === 'fulfilled') {
        const data = upRes.value.data || null;
        setUptimeStats(data);
        try { window.AndroidWidgetBridge?.syncWidgetData('uptime_stats', JSON.stringify(data)); } catch (e) {}
      }
      if (singleRes.status === 'fulfilled') {
        const data = singleRes.value.data || null;
        setSingleService(data);
        if (data?.id) setSelectedServiceId(String(data.id));
        try { window.AndroidWidgetBridge?.syncWidgetData('single_service', JSON.stringify(data)); } catch (e) {}
      }
      if (overRes.status === 'fulfilled') {
        const data = overRes.value.data || null;
        setOverviewData(data);
        try { window.AndroidWidgetBridge?.syncWidgetData('overview', JSON.stringify(data)); } catch (e) {}
      }
    } catch (err) {
      console.error('Error fetching widget data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWidgetData();
  }, []);

  // Save Favorite Apps configuration (Max 4)
  const handleSaveFavoriteApps = async (newFavs) => {
    setFavApps(newFavs);
    try {
      localStorage.setItem('nexuspanel_favorite_widgets', JSON.stringify(newFavs));
      window.AndroidWidgetBridge?.syncWidgetData('favorite_apps', JSON.stringify(newFavs));
    } catch (e) {}

    const ids = newFavs.map(s => s.id);
    try {
      await API.widgets.updateFavoriteApps(ids);
    } catch (err) {
      console.warn('Backend sync warning (saved locally):', err);
    }
    addToast('Zapisano ulubione aplikacje dla widżetu', 'success');
  };

  // Add app to favorites (Max 4)
  const handleAddApp = (serviceId) => {
    if (favApps.length >= 4) {
      addToast('Maksymalna liczba aplikacji w tym widżecie to 4', 'warning');
      return;
    }
    const svc = services.find(s => s.id === Number(serviceId));
    if (!svc) return;
    if (favApps.some(s => s.id === svc.id)) {
      addToast('Ta aplikacja jest już na liście', 'info');
      return;
    }
    let host = '127.0.0.1';
    try {
      const u = new URL(svc.url.startsWith('http') ? svc.url : `http://${svc.url}`);
      host = u.hostname + (u.port ? `:${u.port}` : '');
    } catch (e) {
      host = svc.url || '127.0.0.1';
    }

    const updated = [...favApps, {
      id: svc.id,
      name: svc.name,
      ip: host,
      url: svc.url,
      icon: svc.icon || 'globe',
      color: svc.color || '#6366f1',
      health_status: svc.health_status || 'online'
    }];
    handleSaveFavoriteApps(updated);
  };

  // Remove app
  const handleRemoveApp = (id) => {
    const updated = favApps.filter(s => s.id !== id);
    handleSaveFavoriteApps(updated);
  };

  // Move app up/down
  const handleMoveApp = (index, direction) => {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= favApps.length) return;
    const clone = [...favApps];
    const item = clone.splice(index, 1)[0];
    clone.splice(newIdx, 0, item);
    handleSaveFavoriteApps(clone);
  };

  // Select single service to monitor
  const handleSelectSingleService = (svcId) => {
    setSelectedServiceId(String(svcId));
    const svc = services.find(s => s.id === Number(svcId));
    if (!svc) return;

    let host = '127.0.0.1';
    try {
      const u = new URL(svc.url.startsWith('http') ? svc.url : `http://${svc.url}`);
      host = u.hostname + (u.port ? `:${u.port}` : '');
    } catch (e) {
      host = svc.url || '127.0.0.1';
    }

    const singleObj = {
      id: svc.id,
      name: svc.name,
      ip: host,
      url: svc.url,
      status: svc.health_status || 'online',
      uptimeFormatted: '100%',
      latencyMs: svc.health_response_time || null,
      color: svc.color || '#6366f1'
    };

    setSingleService(singleObj);
    try {
      localStorage.setItem('nexuspanel_single_widget', JSON.stringify(singleObj));
      window.AndroidWidgetBridge?.syncWidgetData('single_service', JSON.stringify(singleObj));
    } catch (e) {}
    addToast(`Ustawiono ${svc.name} jako monitorowaną usługę`, 'success');
  };

  const widgetDefinitions = [
    {
      id: 'favorite_apps',
      name: 'Ulubione aplikacje',
      category: 'Skróty & Launcher',
      size: '4×2',
      icon: Star,
      description: 'Maksymalnie 4 ulubione aplikacje z logo, nazwą, adresem IP i statusem działania.',
    },
    {
      id: 'server_status',
      name: 'Status serwera',
      category: 'Zasoby Hosta',
      size: '3×2 / 4×2',
      icon: Activity,
      description: 'Obciążenie CPU, zużycie RAM, temperatura, uptime oraz ogólny status węzła.',
    },
    {
      id: 'services_status',
      name: 'Status usług',
      category: 'Dostępność',
      size: '3×2 / 4×1',
      icon: Layers,
      description: 'Podsumowanie stanu monitorowanych usług (online, ostrzeżenia, offline).',
    },
    {
      id: 'uptime',
      name: 'Uptime',
      category: 'Niezawodność',
      size: '3×2 / 4×1',
      icon: Clock,
      description: 'Wskaźnik dostępności panelu: aktualny, 24h, 7 dni oraz 30 dni.',
    },
    {
      id: 'single_service',
      name: 'Monitoring konkretnej usługi',
      category: 'Dedykowany Monitor',
      size: '3×2 / 4×1',
      icon: MonitorCheck,
      description: 'Szczegółowy podgląd jednej wybranej usługi: IP, latency, uptime i status.',
    },
    {
      id: 'nexus_overview',
      name: 'Nexus Overview',
      category: 'Zbiorczy Pulpit',
      size: '4×2 / 4×3',
      icon: LayoutGrid,
      description: 'Kompleksowe podsumowanie całego systemu homelaba w jednym miejscu.',
    }
  ];

  const isDark = previewTheme === 'dark';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-[#1d2635]">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-indigo-500" />
            Widżety Ekranu Głównego Androida
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Podgląd w czasie rzeczywistym i konfiguracja 6 natywnych widżetów na pulpit Twojego telefonu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme switcher for preview */}
          <div className="flex items-center bg-slate-100 dark:bg-[#101622] p-1 rounded-lg border border-slate-200 dark:border-[#1e293b]">
            <button
              onClick={() => setPreviewTheme('dark')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
                isDark ? 'bg-[#1e293b] text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              Ciemny
            </button>
            <button
              onClick={() => setPreviewTheme('light')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all ${
                !isDark ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              Jasny
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={loadWidgetData}
            isLoading={loading}
          >
            Odśwież dane
          </Button>
        </div>
      </div>

      {/* Main Grid: Left Selector & Settings, Right Live Phone Mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* =========================================================
            LEFT COLUMN (5 cols): WIDGET SELECTOR & CONFIGURATOR
            ========================================================= */}
        <div className="lg:col-span-6 space-y-4">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Wybierz widżet do konfiguracji i podglądu
          </div>

          {/* Widget Cards List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {widgetDefinitions.map((w) => {
              const isSelected = selectedWidget === w.id;
              const IconComp = w.icon;

              return (
                <button
                  key={w.id}
                  onClick={() => setSelectedWidget(w.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                      : 'bg-white dark:bg-[#141b27] border-slate-200 dark:border-[#1d2635] hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-[#1c2436] text-slate-600 dark:text-slate-300'}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#1c2436] text-slate-500 dark:text-slate-400">
                      {w.size}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {w.name}
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {w.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* =========================================================
              CUSTOM CONFIGURATOR FOR SPECIFIC WIDGETS
              ========================================================= */}
          {/* 1. Favorite Apps Config Card */}
          {selectedWidget === 'favorite_apps' && (
            <div className="bg-white dark:bg-[#141b27] border border-slate-200 dark:border-[#1d2635] rounded-xl p-4 space-y-3.5 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-400" />
                    Konfiguracja Ulubionych Aplikacji ({favApps.length}/4)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Wybierz do 4 usług, które mają pojawić się na widżecie telefonu.
                  </p>
                </div>
              </div>

              {/* List of current 4 favorites */}
              <div className="space-y-1.5">
                {favApps.map((app, idx) => (
                  <div 
                    key={app.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#101622] border border-slate-200 dark:border-[#1e293b]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[11px] font-bold text-slate-400 w-4">{idx + 1}.</span>
                      <div className="w-6 h-6 rounded bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-[10px] font-bold">
                        {app.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{app.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{app.ip}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveApp(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white disabled:opacity-30"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveApp(idx, 1)}
                        disabled={idx === favApps.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white disabled:opacity-30"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveApp(app.id)}
                        className="p-1 text-rose-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add dropdown if < 4 */}
              {favApps.length < 4 && (
                <div className="w-full min-w-0 pt-1 overflow-hidden">
                  <select
                    className="w-full min-w-0 max-w-full bg-slate-50 dark:bg-[#101622] border border-slate-200 dark:border-[#1e293b] rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 truncate cursor-pointer"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddApp(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      + Dodaj usługę z panelu ({4 - favApps.length === 1 ? '1 wolne miejsce' : `${4 - favApps.length} wolne miejsca`})...
                    </option>
                    {services
                      .filter(s => !favApps.some(f => f.id === s.id))
                      .map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.url})</option>
                      ))
                    }
                  </select>
                </div>
              )}
            </div>
          )}

          {selectedWidget === 'single_service' && (
            <div className="bg-white dark:bg-[#141b27] border border-slate-200 dark:border-[#1d2635] rounded-xl p-4 space-y-3 shadow-sm overflow-hidden">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <MonitorCheck className="w-3.5 h-3.5 text-indigo-400" />
                Wybór Monitorowanej Usługi
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Wskaż usługę, której status, czas odpowiedzi i uptime chcesz mieć na pulpicie:
              </p>

              <div className="w-full min-w-0 overflow-hidden">
                <select
                  value={selectedServiceId}
                  onChange={(e) => handleSelectSingleService(e.target.value)}
                  className="w-full min-w-0 max-w-full truncate bg-slate-50 dark:bg-[#101622] border border-slate-200 dark:border-[#1e293b] rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} — {s.url}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Instructions Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#101622] border border-slate-200 dark:border-[#1e293b] flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200 mb-0.5">Jak dodać widżet na ekran telefonu?</div>
              1. Przytrzymaj palec na wolnym miejscu na pulpicie telefonu.<br />
              2. Wybierz <strong>„Widżety”</strong> i odszukaj <strong>NexusPanel</strong>.<br />
              3. Wybierz jeden z 6 widżetów i przeciągnij na swój ekran!
            </div>
          </div>
        </div>

        {/* =========================================================
            RIGHT COLUMN (6 cols): PIXEL-PERFECT LIVE WIDGET PREVIEW
            ========================================================= */}
        <div className="lg:col-span-6 space-y-3">
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Rzeczywisty podgląd na pulpicie Androida</span>
            <span className="text-[10px] text-indigo-500 font-mono">100% spójne tło</span>
          </div>

          {/* Realistic Phone Screen Canvas */}
          <div className="relative rounded-3xl p-6 bg-gradient-to-b from-slate-900 via-[#0a0f1d] to-black border-4 border-slate-800 shadow-2xl overflow-hidden flex flex-col items-center justify-center min-h-[380px]">
            
            {/* Ambient Wallpaper Lines */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* LIVE WIDGET CONTAINER */}
            <div className="w-full max-w-[360px] z-10 transition-all duration-300">
              
              {/* =================================================
                  1. WIDGET: ULUBIONE APLIKACJE (Favorite Apps)
                  ================================================= */}
              {selectedWidget === 'favorite_apps' && (
                <div className={`rounded-2xl p-3 border shadow-xl transition-colors ${
                  isDark ? 'bg-[#0f1523]/95 border-[#1e293b] text-white' : 'bg-white/95 border-slate-200 text-slate-900'
                }`}>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2.5 px-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-bold text-slate-400">NexusPanel</span>
                      <span className="text-[11px] font-bold">· Ulubione</span>
                    </div>
                    <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                      {favApps.filter(s => s.health_status !== 'offline').length}/{favApps.length} Online
                    </span>
                  </div>

                  {/* 4 Cards Grid (2x2) */}
                  <div className="grid grid-cols-2 gap-2">
                    {favApps.map((app) => (
                      <div 
                        key={app.id}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                          isDark ? 'bg-[#172033] border-[#24324f]' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        {/* Logo Monogram */}
                        <div 
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[10.5px] font-bold shadow-sm"
                          style={{ backgroundColor: `${app.color}20`, color: app.color }}
                        >
                          {app.name.substring(0, 2).toUpperCase()}
                        </div>

                        {/* Name & IP */}
                        <div className="min-w-0 flex-1">
                          <div className="text-[11.5px] font-bold truncate leading-tight">{app.name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[9px] text-slate-400 font-mono truncate">{app.ip}</span>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              app.health_status === 'offline' ? 'bg-rose-500' :
                              app.health_status === 'degraded' ? 'bg-amber-500' : 'bg-emerald-500'
                            }`} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* =================================================
                  2. WIDGET: STATUS SERWERA (Server Status)
                  =================                <div className={`rounded-2xl p-3.5 border shadow-xl ${
                  isDark ? 'bg-[#0f1523]/95 border-[#1e293b] text-white' : 'bg-white/95 border-slate-200 text-slate-900'
                }`}>
                  <div className="flex items-center justify-between mb-3 px-0.5">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[11.5px] font-bold">Status Serwera</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                      serverStats?.status === 'offline' ? 'bg-rose-500/15 text-rose-400' :
                      serverStats?.status === 'warning' ? 'bg-amber-500/15 text-amber-400' :
                      'bg-emerald-500/15 text-emerald-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        serverStats?.status === 'offline' ? 'bg-rose-400' :
                        serverStats?.status === 'warning' ? 'bg-amber-400' :
                        'bg-emerald-400'
                      }`} />
                      {serverStats?.status === 'offline' ? 'Offline' : serverStats?.status === 'warning' ? 'Warning' : 'Online'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-center">
                    <div className={`p-2 rounded-xl border ${isDark ? 'bg-[#172033] border-[#24324f]' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="text-[9px] font-bold text-slate-400">CPU</div>
                      <div className="text-[14px] font-bold text-indigo-400 mt-0.5">{serverStats?.cpu !== null && serverStats?.cpu !== undefined ? `${serverStats.cpu}%` : '--'}</div>
                    </div>
                    <div className={`p-2 rounded-xl border ${isDark ? 'bg-[#172033] border-[#24324f]' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="text-[9px] font-bold text-slate-400">RAM</div>
                      <div className="text-[14px] font-bold text-emerald-400 mt-0.5">{serverStats?.ram !== null && serverStats?.ram !== undefined ? `${serverStats.ram}%` : '--'}</div>
                    </div>
                    <div className={`p-2 rounded-xl border ${isDark ? 'bg-[#172033] border-[#24324f]' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="text-[9px] font-bold text-slate-400">TEMP</div>
                      <div className="text-[14px] font-bold text-amber-400 mt-0.5">{serverStats?.temperature || '--'}</div>
                    </div>
                    <div className={`p-2 rounded-xl border ${isDark ? 'bg-[#172033] border-[#24324f]' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="text-[9px] font-bold text-slate-400">UPTIME</div>
                      <div className="text-[13px] font-bold text-cyan-400 mt-0.5">{serverStats?.uptimeFormatted || '--'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================
                  3. WIDGET: STATUS USŁUG (Services Status)
                  ================================================= */}
              {selectedWidget === 'services_status' && (
                <div className={`rounded-2xl p-3.5 border shadow-xl ${
                  isDark ? 'bg-[#0f1523]/95 border-[#1e293b] text-white' : 'bg-white/95 border-slate-200 text-slate-900'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[11.5px] font-bold">Status Usług</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">{servicesSummary?.total ?? services.length} monitorowanych</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${isDark ? 'bg-[#172033] border-[#24324f]' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <div>
                        <div className="text-[14px] font-bold text-emerald-400 leading-tight">{servicesSummary?.online ?? '--'}</div>
                        <div className="text-[9px] font-semibold text-slate-400">online</div>
                      </div>
                    </div>

                    <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${isDark ? 'bg-[#172033] border-[#24324f]' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                      <div>
                        <div className="text-[14px] font-bold text-amber-400 leading-tight">{servicesSummary?.warning ?? '--'}</div>
                        <div className="text-[9px] font-semibold text-slate-400">warning</div>
                      </div>
                    </div>

                    <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${isDark ? 'bg-[#172033] border-[#24324f]' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                      <div>
                        <div className="text-[14px] font-bold text-rose-400 leading-tight">{servicesSummary?.offline ?? '--'}</div>
                        <div className="text-[9px] font-semibold text-slate-400">offline</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================
                  4. WIDGET: UPTIME (Uptime Stats)
                  ================================================= */}
              {selectedWidget === 'uptime' && (
                <div className={`rounded-2xl p-3.5 border shadow-xl ${
                  isDark ? 'bg-[#0f1523]/95 border-[#1e293b] text-white' : 'bg-white/95 border-slate-200 text-slate-900'
                }`}>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[11.5px] font-bold tracking-wide uppercase text-slate-400">UPTIME</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                      30 DNI
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mb-2">
                    <div className="text-2xl font-black text-emerald-400 tracking-tight">
                      {uptimeStats?.uptime30d !== undefined ? `${uptimeStats.uptime30d}%` : '--%'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Host: {uptimeStats?.uptimeFormatted || '--'}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center pt-2 border-t border-slate-200 dark:border-[#1e293b]">
                    <div>
                      <div className="text-[8.5px] text-slate-400">24 GODZINY</div>
                      <div className="text-[11px] font-bold text-emerald-400">{uptimeStats?.uptime24h !== undefined ? `${uptimeStats.uptime24h}%` : '--%'}</div>
                    </div>
                    <div>
                      <div className="text-[8.5px] text-slate-400">7 DNI</div>
                      <div className="text-[11px] font-bold text-emerald-400">{uptimeStats?.uptime7d !== undefined ? `${uptimeStats.uptime7d}%` : '--%'}</div>
                    </div>
                    <div>
                      <div className="text-[8.5px] text-slate-400">30 DNI</div>
                      <div className="text-[11px] font-bold text-emerald-400">{uptimeStats?.uptime30d !== undefined ? `${uptimeStats.uptime30d}%` : '--%'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================
                  5. WIDGET: MONITORING KONKRETNEJ USŁUGI
                  ================================================= */}
              {selectedWidget === 'single_service' && (
                <div className={`rounded-2xl p-3.5 border shadow-xl ${
                  isDark ? 'bg-[#0f1523]/95 border-[#1e293b] text-white' : 'bg-white/95 border-slate-200 text-slate-900'
                }`}>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: `${singleService?.color || '#6366f1'}20`, color: singleService?.color || '#6366f1' }}
                      >
                        {(singleService?.name || 'US').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold">{singleService?.name || 'Brak wybranej usługi'}</div>
                        <div className="text-[9.5px] text-slate-400 font-mono">{singleService?.ip || '--'}</div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                      singleService?.status === 'offline' ? 'bg-rose-500/10 text-rose-400' :
                      singleService?.status === 'degraded' || singleService?.status === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                      singleService?.status === 'online' ? 'bg-emerald-500/10 text-emerald-400' :
                      'bg-slate-500/10 text-slate-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        singleService?.status === 'offline' ? 'bg-rose-400' :
                        singleService?.status === 'degraded' || singleService?.status === 'warning' ? 'bg-amber-400' :
                        singleService?.status === 'online' ? 'bg-emerald-400' :
                        'bg-slate-400'
                      }`} />
                      {singleService?.status === 'online' ? 'Online' :
                       singleService?.status === 'degraded' || singleService?.status === 'warning' ? 'Warning' :
                       singleService?.status === 'offline' ? 'Offline' : 'Unknown'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200 dark:border-[#1e293b] text-xs">
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-[#172033]' : 'bg-slate-50'}`}>
                      <div className="text-[9px] text-slate-400">Uptime</div>
                      <div className="font-bold text-cyan-400 mt-0.5">{singleService?.uptimeFormatted || '--'}</div>
                    </div>
                    <div className={`p-2 rounded-lg ${isDark ? 'bg-[#172033]' : 'bg-slate-50'}`}>
                      <div className="text-[9px] text-slate-400">Czas odpowiedzi</div>
                      <div className="font-bold text-emerald-400 mt-0.5">{singleService?.latencyMs !== null && singleService?.latencyMs !== undefined ? `${singleService.latencyMs} ms` : '--'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================
                  6. WIDGET: NEXUS OVERVIEW
                  ================================================= */}
              {selectedWidget === 'nexus_overview' && (
                <div className={`rounded-2xl p-3.5 border shadow-xl ${
                  isDark ? 'bg-[#0f1523]/95 border-[#1e293b] text-white' : 'bg-white/95 border-slate-200 text-slate-900'
                }`}>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">NEXUS OVERVIEW</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                      overviewData?.statusTone === 'offline' ? 'bg-rose-500/10 text-rose-400' :
                      overviewData?.statusTone === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        overviewData?.statusTone === 'offline' ? 'bg-rose-400' :
                        overviewData?.statusTone === 'warning' ? 'bg-amber-400' :
                        'bg-emerald-400'
                      }`} />
                      {overviewData?.systemStatus || 'Unknown'}
                    </span>
                  </div>

                  {/* CPU / RAM Bar */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className={`p-2 rounded-xl border ${isDark ? 'bg-[#172033] border-[#24324f]' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="text-[9px] text-slate-400 font-bold">CPU</div>
                      <div className="text-sm font-bold text-indigo-400 mt-0.5">{overviewData?.cpuPercent !== null && overviewData?.cpuPercent !== undefined ? `${overviewData.cpuPercent}%` : '--'}</div>
                    </div>
                    <div className={`p-2 rounded-xl border ${isDark ? 'bg-[#172033] border-[#24324f]' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="text-[9px] text-slate-400 font-bold">RAM</div>
                      <div className="text-sm font-bold text-emerald-400 mt-0.5">{overviewData?.ramPercent !== null && overviewData?.ramPercent !== undefined ? `${overviewData.ramPercent}%` : '--'}</div>
                    </div>
                  </div>

                  {/* Summary Rows */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-slate-400 text-[11px]">Usługi:</span>
                      <span className="font-bold text-slate-200">{overviewData?.servicesRatio || '--'}</span>
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <span className="text-slate-400 text-[11px]">Alerty:</span>
                      <span className="font-bold text-emerald-400">{overviewData?.alertsCount !== undefined ? `${overviewData.alertsCount} alertów` : '--'}</span>
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <span className="text-slate-400 text-[11px]">Uptime hosta:</span>
                      <span className="font-bold text-cyan-400">{overviewData?.uptimeFormatted || '--'}</span>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
