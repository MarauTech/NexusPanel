import React, { useState, useEffect } from 'react';
import { Home, Thermometer, Zap, BatteryCharging, Droplets, Power } from 'lucide-react';
import WidgetCard from './WidgetCard';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

export default function HomeAssistantWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [switchesState, setSwitchesState] = useState({});
  const { addToast } = useToast();

  const fetchHA = async () => {
    setLoading(true);
    try {
      const res = await api.widgets.getHomeAssistant();
      setData(res.data);
      if (res.data?.switches) {
        const sw = {};
        res.data.switches.forEach(s => sw[s.id] = s.state === 'on');
        setSwitchesState(sw);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHA();
  }, []);

  const toggleSwitch = (id, name) => {
    setSwitchesState(prev => {
      const next = !prev[id];
      addToast(`${name}: ${next ? 'Włączono' : 'Wyłączono'}`, 'info');
      return { ...prev, [id]: next };
    });
  };

  const sensors = data?.sensors || [];

  return (
    <WidgetCard
      title="Home Assistant"
      icon={Home}
      badge="Smart Home"
      badgeColor="bg-sky-500/10 text-sky-400 border-sky-500/30"
      onRefresh={fetchHA}
      loading={loading}
    >
      <div className="space-y-3">
        {/* Sensor Grid */}
        <div className="grid grid-cols-2 gap-2">
          {sensors.slice(0, 4).map((s) => (
            <div key={s.id} className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-border/50">
              <div className="flex items-center gap-1.5 text-text-secondary text-[11px] mb-0.5">
                {s.icon === 'thermometer' && <Thermometer className="w-3.5 h-3.5 text-rose-400" />}
                {s.icon === 'zap' && <Zap className="w-3.5 h-3.5 text-amber-400" />}
                {s.icon === 'battery-charging' && <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />}
                {s.icon === 'droplets' && <Droplets className="w-3.5 h-3.5 text-sky-400" />}
                <span className="truncate">{s.name}</span>
              </div>
              <div className="font-mono font-bold text-sm text-text-primary">
                {s.value} <span className="text-[10px] text-text-secondary">{s.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Switches */}
        {data?.switches && (
          <div className="flex items-center gap-2">
            {data.switches.map((sw) => {
              const isOn = switchesState[sw.id];
              return (
                <button
                  key={sw.id}
                  type="button"
                  onClick={() => toggleSwitch(sw.id, sw.name)}
                  className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isOn 
                      ? 'bg-accent/15 border-accent text-accent shadow-xs' 
                      : 'bg-black/[0.02] dark:bg-white/[0.02] border-border text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Power className={`w-3 h-3 ${isOn ? 'text-accent' : 'text-text-secondary'}`} />
                  <span className="truncate">{sw.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </WidgetCard>
  );
}
