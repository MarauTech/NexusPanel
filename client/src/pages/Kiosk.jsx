import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useServices } from '../hooks/useServices';
import { useCategories } from '../hooks/useCategories';
import { useSettings } from '../hooks/useSettings';
import ServiceCard from '../components/dashboard/ServiceCard';
import BrandIcon from '../components/common/BrandIcon';
import api from '../services/api';
import { 
  Maximize2, Minimize2, ArrowLeft, Moon, Sun, Cpu, HardDrive, 
  Activity, ShieldCheck, Clock, RefreshCw, Zap, Lock
} from 'lucide-react';

export default function Kiosk() {
  const { services, refresh: refreshServices } = useServices();
  const { categories } = useCategories();
  const { settings } = useSettings();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDimmed, setIsDimmed] = useState(false);
  const [systemStats, setSystemStats] = useState(null);
  const [selectedCat, setSelectedCat] = useState('all');

  // 1. Real-time Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Periodic background refresh (services & stats every 15s)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.system.getStats();
        setSystemStats(res.data);
      } catch (e) {
        // ignore
      }
    };

    fetchStats();
    const interval = setInterval(() => {
      refreshServices();
      fetchStats();
    }, 15000);

    return () => clearInterval(interval);
  }, [refreshServices]);

  // 3. Screen Wake Lock API to prevent wall screen from sleeping
  useEffect(() => {
    let wakeLock = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        // WakeLock may fail if window not active or unsupported
      }
    };

    requestWakeLock();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
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

  // Categorize services
  const enrichedServices = useMemo(() => {
    return services.filter(s => s.enabled !== 0 && s.enabled !== false);
  }, [services]);

  const onlineCount = enrichedServices.filter(s => s.health_status === 'online').length;
  const totalCount = enrichedServices.length;

  const filteredList = useMemo(() => {
    if (selectedCat === 'all') return enrichedServices;
    if (selectedCat === 'favorites') return enrichedServices.filter(s => s.favorite === 1);
    return enrichedServices.filter(s => String(s.category_id) === String(selectedCat));
  }, [enrichedServices, selectedCat]);

  // Format Polish Date & Time
  const timeString = currentTime.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = currentTime.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className={`min-h-screen transition-all duration-500 select-none ${
      isDimmed ? 'bg-black text-slate-400 opacity-60' : 'bg-bg-primary text-text-primary'
    } p-4 sm:p-6 lg:p-8 flex flex-col justify-between`}>
      
      {/* ============================================================
          TOP HERO BAR: BIG CLOCK, DATE, HOMELAB TELEMETRY
         ============================================================ */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 sm:p-6 rounded-[28px] glass-card border border-black/[0.08] dark:border-white/10 shadow-xl">
          
          {/* Left: Huge Wall Clock & Polish Date */}
          <div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl lg:text-6xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {timeString}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-accent/15 text-accent border border-accent/20">
                Kiosk
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 capitalize mt-1 font-semibold">
              {dateString}
            </p>
          </div>

          {/* Center: Live Telemetry Badges */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Health Counter */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl glass-pill">
              <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                onlineCount === totalCount ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">Dostępność</span>
                <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                  {onlineCount}/{totalCount} Online
                </span>
              </div>
            </div>

            {/* Host CPU */}
            {systemStats?.cpu && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl glass-pill">
                <Cpu className="w-4 h-4 text-accent" />
                <div className="text-left">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">CPU</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                    {systemStats.cpu.usagePercent}%
                  </span>
                </div>
              </div>
            )}

            {/* Host RAM */}
            {systemStats?.memory && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl glass-pill">
                <Activity className="w-4 h-4 text-sky-400" />
                <div className="text-left">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">RAM</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                    {systemStats.memory.usedPercent}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right: Kiosk Controls */}
          <div className="flex items-center gap-2">
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
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-md shadow-accent/25 transition-all"
              title="Wróć do standardowego pulpitu"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Wyjdź</span>
            </Link>
          </div>
        </div>

        {/* Category Filter Capsules */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              selectedCat === 'all'
                ? 'bg-accent text-white shadow-md shadow-accent/25'
                : 'glass-pill text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Wszystkie ({enrichedServices.length})
          </button>

          {enrichedServices.some(s => s.favorite === 1) && (
            <button
              onClick={() => setSelectedCat('favorites')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                selectedCat === 'favorites'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                  : 'glass-pill text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Ulubione ⭐ ({enrichedServices.filter(s => s.favorite === 1).length})
            </button>
          )}

          {categories.map(cat => {
            const count = enrichedServices.filter(s => s.category_id === cat.id).length;
            if (count === 0) return null;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(String(cat.id))}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCat === String(cat.id)
                    ? 'bg-accent text-white shadow-md shadow-accent/25'
                    : 'glass-pill text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================
          MAIN SERVICE GRID: LARGE TOUCH-FRIENDLY TILES
         ============================================================ */}
      <div className="flex-1 my-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {filteredList.map(service => (
            <ServiceCard 
              key={service.id} 
              service={service} 
              onFavoriteToggle={() => refreshServices()} 
            />
          ))}
        </div>
      </div>

      {/* ============================================================
          BOTTOM FOOTER: CLEAN MINIMAL STATUS
         ============================================================ */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-black/[0.05] dark:border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>NexusPanel Wall Display Mode</span>
        </div>
        <div className="font-mono text-[11px] opacity-75">
          Odświeżanie pingu w tle: co 15s · WakeLock aktywny
        </div>
      </div>

    </div>
  );
}
