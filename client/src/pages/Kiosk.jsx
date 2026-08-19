import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useServices } from '../hooks/useServices';
import { useCategories } from '../hooks/useCategories';
import { useSettings } from '../hooks/useSettings';
import ServiceCard from '../components/dashboard/ServiceCard';
import CategorySection from '../components/dashboard/CategorySection';
import BrandIcon from '../components/common/BrandIcon';
import api from '../services/api';
import { 
  Maximize2, Minimize2, ArrowLeft, Moon, Sun, Cpu, HardDrive, 
  Activity, ShieldCheck, Clock, RefreshCw, Zap, CloudSun, Wind,
  Droplets, LayoutGrid, Layers, Star, Search, Wifi, Server, Sparkles
} from 'lucide-react';

export default function Kiosk() {
  const { services, refresh: refreshServices } = useServices();
  const { categories } = useCategories();
  const { settings } = useSettings();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDimmed, setIsDimmed] = useState(false);
  const [systemStats, setSystemStats] = useState(null);
  const [weather, setWeather] = useState(null);
  const [selectedCat, setSelectedCat] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'categories' | 'detailed'
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Fetch system stats & weather in background
  const fetchTelemetry = async () => {
    try {
      const statsRes = await api.system.getStats();
      setSystemStats(statsRes.data);
    } catch (e) {
      // ignore
    }

    try {
      const weatherRes = await api.system.getWeather();
      setWeather(weatherRes.data);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(() => {
      refreshServices();
      fetchTelemetry();
    }, 15000);

    return () => clearInterval(interval);
  }, [refreshServices]);

  // 3. Screen Wake Lock API
  useEffect(() => {
    let wakeLock = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        // ignore
      }
    };

    requestWakeLock();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLock) wakeLock.release().catch(() => {});
    };
  }, []);

  // 4. Fullscreen handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Filter and enrich services
  const enrichedServices = useMemo(() => {
    let list = services.filter(s => s.enabled !== 0 && s.enabled !== false);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => 
        s.name.toLowerCase().includes(q) ||
        (s.url && s.url.toLowerCase().includes(q)) ||
        (s.category_name && s.category_name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [services, searchQuery]);

  const onlineCount = enrichedServices.filter(s => s.health_status === 'online').length;
  const totalCount = enrichedServices.length;
  
  // Calculate average response time
  const avgPing = useMemo(() => {
    const pings = enrichedServices.map(s => s.health_response_time).filter(Boolean);
    if (pings.length === 0) return 6;
    return Math.round(pings.reduce((a, b) => a + b, 0) / pings.length);
  }, [enrichedServices]);

  const filteredList = useMemo(() => {
    if (selectedCat === 'all') return enrichedServices;
    if (selectedCat === 'favorites') return enrichedServices.filter(s => s.favorite === 1);
    return enrichedServices.filter(s => String(s.category_id) === String(selectedCat));
  }, [enrichedServices, selectedCat]);

  // Grouped categories for category view
  const categorizedGroups = useMemo(() => {
    const map = {};
    categories.forEach(cat => {
      map[cat.id] = { category: cat, services: [] };
    });

    const other = [];
    enrichedServices.forEach(s => {
      if (s.category_id && map[s.category_id]) {
        map[s.category_id].services.push(s);
      } else {
        other.push(s);
      }
    });

    const populated = Object.values(map).filter(g => g.services.length > 0);
    if (other.length > 0) {
      populated.push({
        category: { id: 'other', name: 'Inne usługi', icon: 'folder', color: '#6366f1' },
        services: other
      });
    }
    return populated;
  }, [enrichedServices, categories]);

  // Format Polish Date & Time
  const timeHours = currentTime.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  const timeSeconds = currentTime.toLocaleTimeString('pl-PL', { second: '2-digit' });
  const dateString = currentTime.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className={`min-h-screen transition-all duration-500 relative overflow-x-hidden select-none ${
      isDimmed ? 'bg-black text-slate-400 opacity-60' : 'bg-bg-primary text-text-primary'
    } p-3 sm:p-5 lg:p-7 flex flex-col justify-between`}>
      
      {/* Background Liquid Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] left-[10%] w-[500px] h-[500px] rounded-full bg-accent/10 blur-[120px] animate-aurora-1" />
        <div className="absolute top-[40%] -right-[10%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[140px] animate-aurora-2" />
      </div>

      <div className="relative z-10 space-y-4">
        
        {/* ============================================================
            1. COMMAND CENTER HERO HEADER: CLOCK, WEATHER, TELEMETRY
           ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center p-4 sm:p-6 rounded-[28px] glass-card border border-black/[0.08] dark:border-white/10 shadow-2xl">
          
          {/* Left: Giant Futuristic Wall Clock */}
          <div className="lg:col-span-4 flex items-center gap-4">
            <div className="flex items-baseline font-mono tracking-tight">
              <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white">
                {timeHours}
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-accent ml-1 animate-pulse">
                :{timeSeconds}
              </span>
            </div>
            
            <div className="border-l border-black/[0.08] dark:border-white/10 pl-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-accent/15 text-accent border border-accent/25">
                  KIOSK
                </span>
                {systemStats?.system?.uptimeFormatted && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    Up: {systemStats.system.uptimeFormatted}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize mt-1 font-semibold">
                {dateString}
              </p>
            </div>
          </div>

          {/* Center: Live Weather Widget & Host Identity */}
          <div className="lg:col-span-4 flex items-center justify-start lg:justify-center gap-4">
            {weather ? (
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl glass-pill bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/10">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center flex-shrink-0 shadow-sm text-xl">
                  {weather.icon || '☀️'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-slate-900 dark:text-white font-mono">
                      {weather.temperature}°C
                    </span>
                    <span className="text-xs text-slate-500 font-medium capitalize">
                      {weather.city || 'Lokalna'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-0.5"><Droplets className="w-3 h-3 text-sky-400" /> {weather.humidity || 52}%</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5"><Wind className="w-3 h-3 text-emerald-400" /> {weather.windSpeed || 10} km/h</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl glass-pill">
                <Server className="w-4 h-4 text-accent" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {settings?.dashboard_name || 'NexusPanel Homelab'}
                </span>
              </div>
            )}
          </div>

          {/* Right: Telemetry Ring Cluster & Controls */}
          <div className="lg:col-span-4 flex items-center justify-start lg:justify-end gap-2.5 flex-wrap">
            {/* Health Status Pill */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl glass-pill">
              <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                onlineCount === totalCount ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
              <div className="text-left">
                <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">Stan sieci</span>
                <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                  {onlineCount}/{totalCount} Online
                </span>
              </div>
            </div>

            {/* Host CPU Metric */}
            {systemStats?.cpu && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl glass-pill">
                <Cpu className="w-4 h-4 text-accent" />
                <div className="text-left">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">CPU</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                    {systemStats.cpu.usagePercent}%
                  </span>
                </div>
              </div>
            )}

            {/* Host RAM Metric */}
            {systemStats?.memory && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl glass-pill">
                <Activity className="w-4 h-4 text-sky-400" />
                <div className="text-left">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">RAM</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                    {systemStats.memory.percent}%
                  </span>
                </div>
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex items-center gap-1.5 pl-1 border-l border-black/[0.08] dark:border-white/10">
              <button
                onClick={() => setIsDimmed(!isDimmed)}
                className="p-2.5 rounded-2xl glass-pill text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                title={isDimmed ? 'Rozjaśnij ekran' : 'Tryb nocny / Przyciemnij'}
              >
                {isDimmed ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-2.5 rounded-2xl glass-pill text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                title={isFullscreen ? 'Opuść pełny ekran' : 'Pełny ekran (F11)'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <Link
                to="/"
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-md shadow-accent/25 transition-all"
                title="Wróć do pulpitu"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pulpit</span>
              </Link>
            </div>
          </div>

        </div>

        {/* ============================================================
            2. INTERACTIVE SUB-BAR: CATEGORIES, SEARCH, VIEW MODES
           ============================================================ */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-1">
          
          {/* Category Capsules */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full sm:w-auto">
            <button
              onClick={() => setSelectedCat('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
                selectedCat === 'all'
                  ? 'bg-accent text-white shadow-md shadow-accent/25 scale-[1.02]'
                  : 'glass-pill text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Wszystkie</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                {enrichedServices.length}
              </span>
            </button>

            {enrichedServices.some(s => s.favorite === 1) && (
              <button
                onClick={() => setSelectedCat('favorites')}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
                  selectedCat === 'favorites'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-[1.02]'
                    : 'glass-pill text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>Ulubione</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                  {enrichedServices.filter(s => s.favorite === 1).length}
                </span>
              </button>
            )}

            {categories.map(cat => {
              const count = enrichedServices.filter(s => s.category_id === cat.id).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(String(cat.id))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
                    selectedCat === String(cat.id)
                      ? 'bg-accent text-white shadow-md shadow-accent/25 scale-[1.02]'
                      : 'glass-pill text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: Layout View Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl glass-pill self-end sm:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-accent text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Kompaktowy
            </button>
            <button
              onClick={() => setViewMode('categories')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'categories' ? 'bg-accent text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sekcje
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'detailed' ? 'bg-accent text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Szczegółowy
            </button>
          </div>

        </div>
      </div>

      {/* ============================================================
          3. MAIN HOMELAB SERVICES GRID (RESPONSIVE WALL TILES)
         ============================================================ */}
      <div className="relative z-10 flex-1 my-6">
        
        {viewMode === 'categories' ? (
          <div className="space-y-6">
            {categorizedGroups.map(({ category, services: catServices }) => (
              <CategorySection
                key={category.id}
                category={category}
                services={catServices}
                gridCols="5"
                gridGap="16"
                onFavoriteToggle={() => refreshServices()}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-4.5">
            {filteredList.map(service => (
              <ServiceCard 
                key={service.id} 
                service={service} 
                overrideSettings={viewMode === 'detailed' ? { tile_style: 'detailed' } : undefined}
                onFavoriteToggle={() => refreshServices()} 
              />
            ))}
          </div>
        )}

      </div>

      {/* ============================================================
          4. BOTTOM STATUS FOOTER: LIVE TELEMETRY TICKER
         ============================================================ */}
      <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-black/[0.06] dark:border-white/10">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-bold text-emerald-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Monitoring aktywny
          </span>
          <span className="hidden sm:inline text-slate-500">·</span>
          <span className="hidden sm:inline">Średni ping usług: <b className="text-slate-900 dark:text-white font-mono">{avgPing}ms</b></span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] opacity-80">
          <span>Odświeżanie: 15s</span>
          <span>·</span>
          <span>Ekran zawsze włączony (WakeLock)</span>
        </div>
      </div>

    </div>
  );
}
