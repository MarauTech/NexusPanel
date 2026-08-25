import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, Wind, Droplets, Clock } from 'lucide-react';
import WidgetCard from './WidgetCard';
import api from '../../services/api';

export default function WeatherClockWidget() {
  const [weather, setWeather] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const clockTimer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const fetchWeather = async () => {
    try {
      const res = await api.widgets.getWeather();
      setWeather(res.data);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 120000);
    return () => clearInterval(interval);
  }, []);

  const formatHours = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const formatDate = time.toLocaleDateString('pl-PL', { weekday: 'short', day: 'numeric', month: 'long' });

  return (
    <WidgetCard
      title="Zegar & Pogoda"
      icon={Sun}
      badge={weather?.city || 'Warszawa'}
      badgeColor="bg-amber-500/10 text-amber-400 border-amber-500/30"
      onRefresh={fetchWeather}
    >
      <div className="space-y-3">
        {/* Clock & Date Header */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-border/50">
          <div>
            <div className="text-2xl font-black font-mono tracking-tight text-text-primary">
              {formatHours}
            </div>
            <div className="text-xs text-text-secondary capitalize mt-0.5">
              {formatDate}
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black font-mono text-amber-400">
              {weather?.temp ? `${Math.round(weather.temp)}°C` : '21°C'}
            </div>
            <div className="text-[10px] text-text-secondary font-mono">
              Odczuwalna: {weather?.feelsLike ? `${Math.round(weather.feelsLike)}°C` : '22°C'}
            </div>
          </div>
        </div>

        {/* Weather sub-metrics */}
        <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono">
          <div className="p-1.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-border/40">
            <span className="text-[9px] text-text-secondary uppercase block">Wilgotność</span>
            <span className="font-bold text-text-primary">{weather?.humidity || 55}%</span>
          </div>

          <div className="p-1.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-border/40">
            <span className="text-[9px] text-text-secondary uppercase block">Wiatr</span>
            <span className="font-bold text-text-primary">{weather?.windSpeed || 8.4} km/h</span>
          </div>

          <div className="p-1.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-border/40">
            <span className="text-[9px] text-text-secondary uppercase block">Ciśnienie</span>
            <span className="font-bold text-text-primary">{weather?.pressure || 1014} hPa</span>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}
