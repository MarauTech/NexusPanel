import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useServices } from '../hooks/useServices';
import { useCategories } from '../hooks/useCategories';
import { useSettings } from '../hooks/useSettings';
import ServiceCard from '../components/dashboard/ServiceCard';
import CategorySection from '../components/dashboard/CategorySection';
import NetworkDiscoveryModal from '../components/scanner/NetworkDiscoveryModal';
import SearchModal from '../components/search/SearchModal';
import CameraWidget from '../components/kiosk/CameraWidget';
import BrandIcon from '../components/common/BrandIcon';
import api from '../services/api';
import { 
  Maximize2, Minimize2, ArrowLeft, Moon, Sun, Cpu, HardDrive, 
  Activity, ShieldCheck, Clock, RefreshCw, Zap, CloudSun, CloudRain,
  CloudLightning, Snowflake, CloudFog, Wind, Droplets, LayoutGrid, 
  Layers, Star, Search, Wifi, Server, Sparkles, Radar, CheckCircle2,
  AlertTriangle, ExternalLink, Camera, Power
} from 'lucide-react';

function WeatherIcon({ name }) {
  switch (name) {
    case 'cloud-sun':
      return <CloudSun className="w-6 h-6 text-amber-400" />;
    case 'cloud-rain':
      return <CloudRain className="w-6 h-6 text-sky-400" />;
    case 'cloud-lightning':
      return <CloudLightning className="w-6 h-6 text-purple-400" />;
    case 'snowflake':
      return <Snowflake className="w-6 h-6 text-cyan-300" />;
    case 'cloud-fog':
      return <CloudFog className="w-6 h-6 text-slate-400" />;
    case 'sun':
    default:
      return <Sun className="w-6 h-6 text-amber-400" />;
  }
}

export default function Kiosk() {
  const { services, refresh: refreshServices } = useServices();
  const { categories } = useCategories();
  const { settings } = useSettings();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDeepBlackout, setIsDeepBlackout] = useState(false);
  const [systemStats, setSystemStats] = useState(null);
  const [weather, setWeather] = useState(null);
  const [selectedCat, setSelectedCat] = useState('all');
  const [viewMode, setViewMode] = useState('dashboard'); // 'grid' | 'categories' | 'dashboard'
  const [searchOpen, setSearchOpen] = useState(false);
  const [scanModalOpen, setScanModalOpen] = useState(false);

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

  // Keyboard shortcut to exit blackout or search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isDeepBlackout) {
        setIsDeepBlackout(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDeepBlackout]);

  // Filter and enrich services
  const enrichedServices = useMemo(() => {
    return services.filter(s => s.enabled !== 0 && s.enabled !== false);
  }, [services]);

  const onlineCount = enrichedServices.filter(s => s.health_status === 'online').length;
  const totalCount = enrichedServices.length;
  
  // Calculate average response time
  const avgPing = useMemo(() => {
    const pings = enrichedServices.map(s => s.health_response_time).filter(Boolean);
    if (pings.length === 0) return 8;
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
    <div className="min-h-screen transition-all duration-500 relative overflow-x-hidden select-none bg-bg-primary text-text-primary p-3 sm:p-5 lg:p-7 flex flex-col justify-between">
      
      {/* Background Liquid Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] left-[10%] w-[500px] h-[500px] rounded-full bg-accent/10 blur-[120px] animate-aurora-1" />
        <div className="absolute top-[40%] -right-[10%] w-[600px] h-[600px] rounded-full bg-indigo-500/10 blur-[140px] animate-aurora-2" />
      </div>

      <div className="relative z-10 space-y-5">
        
        {/* ============================================================
            1. COMMAND CENTER HERO HEADER: CLOCK, WEATHER, TELEMETRY
           ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center p-4 sm:p-6 rounded-[28px] glass-card border border-black/[0.08] dark:border-white/10 shadow-2xl">
          
          {/* Left: Giant Wall Clock & Polish Date */}
          <div className="lg:col-span-4 flex items-center gap-4">
            <div className="flex items-baseline font-mono tracking-tight">
              <span className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white">
                {timeHours}
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-accent ml-1 animate-pulse">
                :{timeSeconds}
              </span>
            </div>
            
            <div className="border-l border-black/[0.08] dark:border-white/10 pl-3.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-accent/15 text-accent border border-accent/25">
                  KIOSK
                </span>
                {systemStats?.system?.uptimeFormatted && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    Up: {systemStats.system.uptimeFormatted}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 capitalize mt-1 font-bold">
                {dateString}
              </p>
            </div>
          </div>

          {/* Center: Live Weather Widget */}
          <div className="lg:col-span-4 flex items-center justify-start lg:justify-center">
            {weather ? (
              <div className="flex items-center gap-3.5 px-4 py-2.5 rounded-2xl glass-pill bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/10">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <WeatherIcon name={weather.icon} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg text-slate-900 dark:text-white font-mono">
                      {weather.temperature}°C
                    </span>
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold capitalize">
                      {weather.city || 'Lokalna'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    <span className="flex items-center gap-1"><Droplets className="w-3 h-3 text-sky-400" /> {weather.humidity || 52}%</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Wind className="w-3 h-3 text-emerald-400" /> {weather.windSpeed || 10} km/h</span>
                    <span>·</span>
                    <span className="text-slate-400 capitalize">{weather.condition}</span>
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
                <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">Stan usług</span>
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
              {/* Deep Blackout Button */}
              <button
                onClick={() => setIsDeepBlackout(true)}
                className="p-2.5 rounded-2xl glass-pill text-slate-500 hover:text-amber-400 transition-all cursor-pointer"
                title="Tryb Głęboki Sen (0% OLED Blackout - wygaś ekran)"
              >
                <Power className="w-4 h-4" />
              </button>

              {/* LAN Scanner */}
              <button
                onClick={() => setScanModalOpen(true)}
                className="p-2.5 rounded-2xl glass-pill text-slate-500 hover:text-accent dark:hover:text-white transition-all cursor-pointer"
                title="Skanuj sieć LAN"
              >
                <Radar className="w-4 h-4" />
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2.5 rounded-2xl glass-pill text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                title={isFullscreen ? 'Opuść pełny ekran' : 'Pełny ekran (F11)'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Exit */}
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
            2. INTERACTIVE SUB-BAR: CATEGORIES & VIEW MODES
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

          {/* Right: View Mode Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl glass-pill self-end sm:self-auto">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'dashboard' ? 'bg-accent text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pulpit + NOC Monitor
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-accent text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Siatka Kafelków
            </button>
            <button
              onClick={() => setViewMode('categories')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'categories' ? 'bg-accent text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sekcje
            </button>
          </div>

        </div>

        {/* ============================================================
            3. MAIN CONTENT: ADAPTIVE HOMELAB GRID & TELEMETRY
           ============================================================ */}
        {viewMode === 'dashboard' ? (
          /* =========================================================
             NOC DASHBOARD MODE: TILES + LIVE SYSTEM ANALYTICS & CAMERA
             ========================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-300">
            
            {/* Left: Main Services Grid (8 cols) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {filteredList.map(service => (
                  <ServiceCard 
                    key={service.id} 
                    service={service} 
                    onFavoriteToggle={() => refreshServices()} 
                  />
                ))}
              </div>
            </div>

            {/* Right: Live Homelab NOC & Hardware Status & CCTV (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              
              {/* CCTV / 3D Printer Snapshot Widget */}
              <CameraWidget />

              {/* Host Hardware Progress Bars */}
              <div className="p-5 rounded-[24px] glass-card border border-black/[0.08] dark:border-white/10 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-accent" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Zasoby Serwera Host
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-500 font-bold">● LIVE</span>
                </div>

                {/* CPU Bar */}
                {systemStats?.cpu && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span>Użycie Procesora (CPU)</span>
                      <span className="font-mono text-accent">{systemStats.cpu.usagePercent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/[0.06] dark:bg-white/10 overflow-hidden">
                      <div 
                        className="h-full bg-accent rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, systemStats.cpu.usagePercent)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      {systemStats.cpu.cores} rdzeni · {systemStats.cpu.model}
                    </div>
                  </div>
                )}

                {/* RAM Bar */}
                {systemStats?.memory && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span>Pamięć RAM</span>
                      <span className="font-mono text-sky-400">
                        {systemStats.memory.usedGb} / {systemStats.memory.totalGb} GB ({systemStats.memory.percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-black/[0.06] dark:bg-white/10 overflow-hidden">
                      <div 
                        className="h-full bg-sky-400 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, systemStats.memory.percent)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Wolne: {(systemStats.memory.freeBytes / (1024**3)).toFixed(1)} GB
                    </div>
                  </div>
                )}
              </div>

              {/* NOC Availability Table */}
              <div className="p-5 rounded-[24px] glass-card border border-black/[0.08] dark:border-white/10 space-y-3 shadow-xl">
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Monitoring Dostępności (NOC)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    {onlineCount}/{totalCount}
                  </span>
                </div>

                <div className="max-h-[22vh] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                  {enrichedServices.map(svc => (
                    <div 
                      key={svc.id}
                      className="flex items-center justify-between p-2 rounded-xl glass-pill text-xs hover:border-accent/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          svc.health_status === 'online' ? 'bg-emerald-500' : svc.health_status === 'offline' ? 'bg-rose-500' : 'bg-slate-400'
                        }`} />
                        <span className="font-bold text-slate-900 dark:text-white truncate text-[11px]">{svc.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 font-mono text-[10px]">
                        <span className="text-slate-400">{svc.health_response_time ? `${svc.health_response_time}ms` : '—'}</span>
                        <a 
                          href={svc.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-accent hover:underline p-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        ) : viewMode === 'categories' ? (
          /* Category Sections View */
          <div className="space-y-6 animate-in fade-in duration-300">
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
          /* Standard Responsive Full-Width Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-4.5 animate-in fade-in duration-300">
            {filteredList.map(service => (
              <ServiceCard 
                key={service.id} 
                service={service} 
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
          <span className="hidden sm:inline text-slate-600 dark:text-slate-400">
            Średni ping usług: <b className="text-slate-900 dark:text-white font-mono">{avgPing}ms</b>
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px] opacity-80">
          <span>Odświeżanie: 15s</span>
          <span>·</span>
          <span>Ekran zawsze włączony (WakeLock)</span>
        </div>
      </div>

      {/* ============================================================
          5. DEEP BLACKOUT OVERLAY (0% OLED POWER SAVER)
         ============================================================ */}
      {isDeepBlackout && (
        <div 
          onClick={() => setIsDeepBlackout(false)}
          className="fixed inset-0 z-[999999] bg-black flex flex-col justify-between p-8 sm:p-12 cursor-pointer select-none animate-in fade-in duration-300"
        >
          <div className="flex items-center justify-between text-white/10 text-xs">
            <span>NexusPanel · Tryb Głęboki Sen (0% OLED)</span>
            <span>Dotknij ekranu, aby wybudzić</span>
          </div>

          <div className="flex flex-col items-center justify-center my-auto">
            <span className="text-6xl sm:text-8xl lg:text-9xl font-black font-mono text-white/[0.08] tracking-widest">
              {timeHours}:{timeSeconds}
            </span>
            <span className="text-xs text-white/[0.06] mt-4 font-medium tracking-wider uppercase">
              Dotknij w dowolnym miejscu, aby wybudzić
            </span>
          </div>

          <div className="text-center text-[10px] text-white/[0.05] font-mono">
            WakeLock aktywny · Wybudzanie dotykiem lub klawiaturą
          </div>
        </div>
      )}

      {/* Dialog Modals for Kiosk */}
      {scanModalOpen && (
        <NetworkDiscoveryModal
          onClose={() => setScanModalOpen(false)}
          onSuccess={() => {
            setScanModalOpen(false);
            refreshServices();
          }}
        />
      )}

      {searchOpen && (
        <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      )}

    </div>
  );
}
