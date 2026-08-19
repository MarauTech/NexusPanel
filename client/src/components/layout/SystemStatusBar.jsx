import React, { useState, useEffect } from 'react';
import { 
  Cpu, HardDrive, Sun, Cloud, CloudRain, Snowflake, CloudLightning, 
  Activity, Globe, Terminal, ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import Modal from '../common/Modal';
import BrandIcon from '../common/BrandIcon';

export default function SystemStatusBar() {
  const { t, language, setLanguage } = useLanguage();
  const [stats, setStats] = useState(null);
  const [weather, setWeather] = useState(null);
  const [pveNode, setPveNode] = useState(null);
  const [showWeatherModal, setShowWeatherModal] = useState(false);

  const fetchSystemData = async () => {
    try {
      const [statsRes, weatherRes, pveRes] = await Promise.allSettled([
        api.system.getStats(),
        api.system.getWeather(),
        api.proxmox.getNodeStatus()
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (weatherRes.status === 'fulfilled') setWeather(weatherRes.value.data);
      if (pveRes.status === 'fulfilled') setPveNode(pveRes.value.data);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchSystemData();
    const timer = setInterval(fetchSystemData, 10000);
    return () => clearInterval(timer);
  }, []);

  const getWeatherIcon = (iconName) => {
    switch (iconName) {
      case 'sun': return <Sun className="w-3.5 h-3.5 text-amber-400" />;
      case 'cloud-sun': return <Cloud className="w-3.5 h-3.5 text-amber-300" />;
      case 'cloud-rain': return <CloudRain className="w-3.5 h-3.5 text-sky-400" />;
      case 'snowflake': return <Snowflake className="w-3.5 h-3.5 text-blue-200" />;
      case 'cloud-lightning': return <CloudLightning className="w-3.5 h-3.5 text-purple-400" />;
      default: return <Sun className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 select-none text-xs">
        
        {/* 1. Host CPU Load */}
        {stats && (
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 font-medium cursor-default transition-colors hover:bg-white/[0.08]" 
            title={`Serwer Host (CPU): Obciążenie procesora (${stats.cpu.cores} rdzeni)`}
          >
            <Cpu className="w-3.5 h-3.5 text-accent" />
            <span className="text-slate-400">CPU</span>
            <span className={`font-mono font-bold ${
              stats.cpu.usagePercent > 80 ? 'text-rose-400' : stats.cpu.usagePercent > 50 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {stats.cpu.usagePercent}%
            </span>
          </div>
        )}

        {/* 2. Host RAM Usage */}
        {stats && (
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 font-medium cursor-default transition-colors hover:bg-white/[0.08]" 
            title={`Serwer Host (RAM): Pamięć RAM (${stats.memory.usedGb} GB / ${stats.memory.totalGb} GB)`}
          >
            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-400">RAM</span>
            <span className="font-mono font-bold text-white">
              {stats.memory.usedGb} GB
            </span>
            <span className="text-[10px] text-slate-500 font-mono">({stats.memory.percent}%)</span>
          </div>
        )}

        {/* 3. Proxmox VE Pill (Only when configured and active) */}
        {pveNode && pveNode.enabled && pveNode.configured !== false && pveNode.cpu && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 font-medium">
            <div className="w-3.5 h-3.5 rounded flex items-center justify-center bg-[#e57000] text-white">
              <BrandIcon name="proxmox" color="#ffffff" className="w-2.5 h-2.5" />
            </div>
            <span className="text-slate-400">PVE</span>
            <span className="text-xs text-emerald-400 font-mono font-bold">
              {pveNode.cpu?.usagePercent}%
            </span>
          </div>
        )}

        {/* 4. Live Weather Pill */}
        {weather && (
          <button
            type="button"
            onClick={() => setShowWeatherModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 font-medium transition-all"
            title="Kliknij, aby zobaczyć prognozę pogody"
          >
            {getWeatherIcon(weather.icon)}
            <span className="font-mono font-bold text-white">{weather.temperature}°C</span>
            <span className="text-slate-400 hidden lg:inline text-[11px]">{weather.city}</span>
          </button>
        )}

        {/* 5. Language Switcher (PL / EN) */}
        <div className="flex items-center rounded-xl bg-white/[0.04] border border-white/[0.08] p-0.5 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setLanguage('pl')}
            className={`px-1.5 py-0.5 rounded-lg transition-all ${
              language === 'pl' 
                ? 'bg-accent text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
            title="Polski"
          >
            PL
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-1.5 py-0.5 rounded-lg transition-all ${
              language === 'en' 
                ? 'bg-accent text-white shadow-sm' 
                : 'text-slate-400 hover:text-white'
            }`}
            title="English"
          >
            EN
          </button>
        </div>
      </div>

      {/* Weather Forecast Modal */}
      {showWeatherModal && weather && (
        <Modal
          title={`Pogoda lokalna — ${weather.city}`}
          onClose={() => setShowWeatherModal(false)}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-transparent border border-white/10 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs text-slate-400 font-medium">{weather.condition}</span>
                <div className="text-3xl font-black text-white tracking-tight">{weather.temperature}°C</div>
                <div className="text-xs text-slate-400">Odczuwalna: <strong className="text-white">{weather.apparentTemperature}°C</strong></div>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/10 shadow-lg">
                {getWeatherIcon(weather.icon)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <span className="text-slate-400 block text-[11px]">Wilgotność</span>
                <span className="text-base font-bold text-white font-mono">{weather.humidity}%</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <span className="text-slate-400 block text-[11px]">Wiatr</span>
                <span className="text-base font-bold text-white font-mono">{weather.windSpeed} km/h</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
