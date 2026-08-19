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
      return <CloudSun className="w-5 h-5 text-amber-400" />;
    case 'cloud-rain':
      return <CloudRain className="w-5 h-5 text-sky-400" />;
    case 'cloud-lightning':
      return <CloudLightning className="w-5 h-5 text-purple-400" />;
    case 'snowflake':
      return <Snowflake className="w-5 h-5 text-cyan-300" />;
    case 'cloud-fog':
      return <CloudFog className="w-5 h-5 text-slate-400" />;
    case 'sun':
    default:
      return <Sun className="w-5 h-5 text-amber-400" />;
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
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' | 'grid' | 'categories'
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

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isDeepBlackout) setIsDeepBlackout(false);
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
  
  // Average ping
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
    <div className="h-screen w-screen overflow-hidden select-none bg-bg-primary text-text-primary p-3 sm:p-4 flex flex-col justify-between relative">
      
      {/* Background Liquid Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] left-[10%] w-[450px] h-[450px] rounded-full bg-accent/10 blur-[120px] animate-aurora-1" />
        <div className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[140px] animate-aurora-2" />
      </div>

      {/* ============================================================
          1. COMPACT COMMAND CENTER HEADER (NO SCROLL)
         ============================================================ */}
      <div className="relative z-10 flex-shrink-0 mb-2">
        <div className="flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-[22px] glass-card border border-black/[0.08] dark:border-white/10 shadow-lg">
          
          {/* Left: Wall Clock & Date */}
          <div className="flex items-center gap-3">
            <div className="flex items-baseline font-mono tracking-tight">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                {timeHours}
              </span>
              <span className="text-xl font-bold text-accent ml-0.5 animate-pulse">
                :{timeSeconds}
              </span>
            </div>
            
            <div className="border-l border-black/[0.08] dark:border-white/10 pl-2.5 hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md bg-accent/15 text-accent border border-accent/25">
                  KIOSK
                </span>
                {systemStats?.system?.uptimeFormatted && (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    Up: {systemStats.system.uptimeFormatted}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 capitalize font-bold">
                {dateString}
              </p>
            </div>
          </div>

          {/* Center: Live Weather Capsule */}
          {weather && (
            <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl glass-pill bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/10">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <WeatherIcon name={weather.icon} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-sm text-slate-900 dark:text-white font-mono">
                    {weather.temperature}°C
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold capitalize">
                    {weather.city || 'Lokalna'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                  <span className="flex items-center gap-0.5"><Droplets className="w-2.5 h-2.5 text-sky-400" /> {weather.humidity || 52}%</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5"><Wind className="w-2.5 h-2.5 text-emerald-400" /> {weather.windSpeed || 10} km/h</span>
                </div>
              </div>
            </div>
          )}

          {/* Right: Telemetry Badges & Control Buttons */}
          <div className="flex items-center gap-2">
            {/* Health Status Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass-pill">
              <span className={`w-2 h-2 rounded-full animate-pulse ${
                onlineCount === totalCount ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
              <span className="text-[11px] font-black text-slate-900 dark:text-white font-mono">
                {onlineCount}/{totalCount}
              </span>
            </div>

            {/* Host CPU */}
            {systemStats?.cpu && (
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass-pill">
                <Cpu className="w-3.5 h-3.5 text-accent" />
                <span className="text-[11px] font-black text-slate-900 dark:text-white font-mono">
                  {systemStats.cpu.usagePercent}%
                </span>
              </div>
            )}

            {/* Host RAM */}
            {systemStats?.memory && (
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl glass-pill">
                <Activity className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[11px] font-black text-slate-900 dark:text-white font-mono">
                  {systemStats.memory.percent}%
                </span>
              </div>
            )}

            {/* Control Icons */}
            <div className="flex items-center gap-1 pl-1 border-l border-black/[0.08] dark:border-white/10">
              <button
                onClick={() => setIsDeepBlackout(true)}
                className="p-2 rounded-xl glass-pill text-slate-500 hover:text-amber-400 transition-all cursor-pointer"
                title="Głęboki Sen (Wygaszacz 0% OLED)"
              >
                <Power className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setScanModalOpen(true)}
                className="p-2 rounded-xl glass-pill text-slate-500 hover:text-accent dark:hover:text-white transition-all cursor-pointer"
                title="Skanuj sieć LAN"
              >
                <Radar className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-xl glass-pill text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                title={isFullscreen ? 'Opuść pełny ekran' : 'Pełny ekran (F11)'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <Link
                to="/"
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-md shadow-accent/25 transition-all"
                title="Wróć do pulpitu"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Pulpit</span>
              </Link>
            </div>
          </div>

        </div>

        {/* Sub-bar: Category Capsules & View Switcher */}
        <div className="flex items-center justify-between gap-2 mt-2">
          {/* Category Capsules */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setSelectedCat('all')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex-shrink-0 ${
                selectedCat === 'all'
                  ? 'bg-accent text-white shadow-sm'
                  : 'glass-pill text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Wszystkie ({enrichedServices.length})</span>
            </button>

            {enrichedServices.some(s => s.favorite === 1) && (
              <button
                onClick={() => setSelectedCat('favorites')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex-shrink-0 ${
                  selectedCat === 'favorites'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'glass-pill text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Star className="w-3 h-3 fill-current" />
                <span>Ulubione</span>
              </button>
            )}

            {categories.map(cat => {
              const count = enrichedServices.filter(s => s.category_id === cat.id).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(String(cat.id))}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex-shrink-0 ${
                    selectedCat === String(cat.id)
                      ? 'bg-accent text-white shadow-sm'
                      : 'glass-pill text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          {/* View Switcher */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl glass-pill flex-shrink-0">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                viewMode === 'dashboard' ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Pulpit + NOC
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Siatka Kafelków
            </button>
            <button
              onClick={() => setViewMode('categories')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                viewMode === 'categories' ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sekcje
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          2. MAIN CONTENT AREA (LOCKED TO VIEWPORT HEIGHT - NO SCROLL)
         ============================================================ */}
      <div className="relative z-10 flex-1 min-h-0 overflow-hidden my-1 flex flex-col">
        
        {viewMode === 'dashboard' ? (
          /* =========================================================
             NOC DASHBOARD MODE: TILES + LIVE HARDWARE GAUGES & CCTV
             ========================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full overflow-hidden">
            
            {/* Left: Main Services Grid (8 cols) - auto-filling rows */}
            <div className="lg:col-span-8 h-full overflow-y-auto custom-scrollbar pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {filteredList.map(service => (
                  <ServiceCard 
                    key={service.id} 
                    service={service} 
                    onFavoriteToggle={() => refreshServices()} 
                  />
                ))}
              </div>
            </div>

            {/* Right: Telemetry & CCTV Column (4 cols) */}
            <div className="lg:col-span-4 h-full flex flex-col justify-between gap-2.5 overflow-hidden">
              
              {/* CCTV / 3D Printer Snapshot Widget */}
              <div className="flex-shrink-0">
                <CameraWidget />
              </div>

              {/* Host Hardware Progress Bars */}
              <div className="p-3.5 rounded-[20px] glass-card border border-black/[0.08] dark:border-white/10 space-y-2.5 shadow-lg flex-shrink-0">
                <div className="flex items-center justify-between pb-1.5 border-b border-black/[0.06] dark:border-white/10">
                  <div className="flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-accent" />
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Zasoby Serwera Host
                    </h3>
                  </div>
                  <span className="text-[9px] font-mono text-emerald-500 font-bold">● LIVE</span>
                </div>

                {/* CPU Bar */}
                {systemStats?.cpu && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      <span>Procesor (CPU)</span>
                      <span className="font-mono text-accent">{systemStats.cpu.usagePercent}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-black/[0.06] dark:bg-white/10 overflow-hidden">
                      <div 
                        className="h-full bg-accent rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, systemStats.cpu.usagePercent)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* RAM Bar */}
                {systemStats?.memory && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      <span>Pamięć RAM</span>
                      <span className="font-mono text-sky-400">
                        {systemStats.memory.usedGb} / {systemStats.memory.totalGb} GB ({systemStats.memory.percent}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-black/[0.06] dark:bg-white/10 overflow-hidden">
                      <div 
                        className="h-full bg-sky-400 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, systemStats.memory.percent)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* NOC Availability Table */}
              <div className="p-3 rounded-[20px] glass-card border border-black/[0.08] dark:border-white/10 flex-1 min-h-0 flex flex-col shadow-lg overflow-hidden">
                <div className="flex items-center justify-between pb-1.5 border-b border-black/[0.06] dark:border-white/10 flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Monitoring Usług (NOC)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                    {onlineCount}/{totalCount}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pt-1.5 pr-1">
                  {enrichedServices.map(svc => (
                    <div 
                      key={svc.id}
                      className="flex items-center justify-between p-1.5 rounded-xl glass-pill text-xs hover:border-accent/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
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
                          className="text-accent hover:underline p-0.5"
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
          <div className="h-full overflow-y-auto custom-scrollbar space-y-4 pr-1">
            {categorizedGroups.map(({ category, services: catServices }) => (
              <CategorySection
                key={category.id}
                category={category}
                services={catServices}
                gridCols="5"
                gridGap="12"
                onFavoriteToggle={() => refreshServices()}
              />
            ))}
          </div>
        ) : (
          /* Standard Full-Width Grid */
          <div className="h-full overflow-y-auto custom-scrollbar pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredList.map(service => (
                <ServiceCard 
                  key={service.id} 
                  service={service} 
                  onFavoriteToggle={() => refreshServices()} 
                />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ============================================================
          3. COMPACT FOOTER (1-LINE STATUS)
         ============================================================ */}
      <div className="relative z-10 flex-shrink-0 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-black/[0.06] dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1 font-bold text-emerald-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Monitoring aktywny
          </span>
          <span>·</span>
          <span>Średni ping: <b className="text-slate-900 dark:text-white font-mono">{avgPing}ms</b></span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[10px] opacity-75">
          <span>Odświeżanie: 15s</span>
          <span>·</span>
          <span>WakeLock aktywny</span>
        </div>
      </div>

      {/* ============================================================
          4. DEEP BLACKOUT OVERLAY (0% OLED SCREEN SAVER)
         ============================================================ */}
      {isDeepBlackout && (
        <div 
          onClick={() => setIsDeepBlackout(false)}
          className="fixed inset-0 z-[999999] bg-black flex flex-col justify-between p-8 cursor-pointer select-none animate-in fade-in duration-300"
        >
          <div className="flex items-center justify-between text-white/10 text-xs">
            <span>NexusPanel · Tryb Głęboki Sen (0% OLED)</span>
            <span>Dotknij ekranu, aby wybudzić</span>
          </div>

          <div className="flex flex-col items-center justify-center my-auto">
            <span className="text-7xl sm:text-9xl font-black font-mono text-white/[0.08] tracking-widest">
              {timeHours}:{timeSeconds}
            </span>
            <span className="text-xs text-white/[0.06] mt-4 font-medium tracking-wider uppercase">
              Dotknij w dowolnym miejscu, aby wybudzić
            </span>
          </div>

          <div className="text-center text-[10px] text-white/[0.05] font-mono">
            WakeLock aktywny · Wybudzanie dotykiem
          </div>
        </div>
      )}

      {/* Dialog Modals */}
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
