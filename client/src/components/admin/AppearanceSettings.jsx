import React, { useState, useEffect } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useServices } from '../../hooks/useServices';
import { useTheme } from '../../contexts/ThemeContext';
import Input from '../common/Input';
import Button from '../common/Button';
import { DEFAULT_COLORS, TILE_STYLES, TILE_SIZES } from '../../utils/constants';
import ServiceCard from '../dashboard/ServiceCard';
import api from '../../services/api';
import { 
  Sparkles, Palette, Sliders, Image, Code2, Check, Upload
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

const THEME_PRESETS = [
  {
    id: 'nexus-dark',
    name: 'Nexus Dark',
    accent: '#6366f1',
    theme: 'dark',
    tileStyle: 'default',
    radius: '18',
    css: ''
  },
  {
    id: 'nexus-light',
    name: 'Nexus Light',
    accent: '#4f46e5',
    theme: 'light',
    tileStyle: 'default',
    radius: '18',
    css: ''
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    accent: '#f43f5e',
    theme: 'dark',
    tileStyle: 'detailed',
    radius: '12',
    css: '.glass-card { border-color: rgba(244, 63, 94, 0.4) !important; box-shadow: 0 0 20px rgba(244, 63, 94, 0.15) !important; }'
  },
  {
    id: 'nord',
    name: 'Nordic Glacier',
    accent: '#38bdf8',
    theme: 'dark',
    tileStyle: 'default',
    radius: '16',
    css: '.glass-card { background: rgba(15, 23, 42, 0.8) !important; border-color: rgba(56, 189, 248, 0.25) !important; }'
  },
  {
    id: 'midnight',
    name: 'Midnight OLED',
    accent: '#10b981',
    theme: 'dark',
    tileStyle: 'compact',
    radius: '14',
    css: '.glass-card { background: rgba(0, 0, 0, 0.9) !important; border-color: rgba(255, 255, 255, 0.1) !important; }'
  }
];

const PRESET_SAMPLE_SERVICE = {
  id: 'preview-proxmox',
  name: 'Proxmox VE',
  description: 'Główny węzeł wirtualizacji dla maszyn wirtualnych i kontenerów LXC.',
  url: 'https://192.168.1.10:8006',
  icon: 'proxmox',
  category_name: 'Infrastruktura',
  tags: [{ id: 1, name: 'hypervisor', color: '#e57000' }],
  custom_badge: 'Node 01',
  uptime_percentage: '99.9',
  health_status: 'online',
  health_response_time: 14,
  favorite: 1
};

export default function AppearanceSettings() {
  const { settings, updateSettings, loading } = useSettings();
  const { theme, toggleTheme, setTheme, accentColor, setAccentColor } = useTheme();
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState({
    tile_style: 'default',
    tile_size: 'medium',
    tile_border_radius: '18',
    grid_gap: '16',
    grid_columns: '4',
    background_url: '',
    background_opacity: '100',
    background_blur: '0',
    custom_css: '',
    theme_preset: 'nexus-dark'
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        tile_style: settings.tile_style || 'default',
        tile_size: settings.tile_size || 'medium',
        tile_border_radius: settings.tile_border_radius || '18',
        grid_gap: settings.grid_gap || '16',
        grid_columns: settings.grid_columns || '4',
        background_url: settings.background_url || '',
        background_opacity: settings.background_opacity || '100',
        background_blur: settings.background_blur || '0',
        custom_css: settings.custom_css || '',
        theme_preset: settings.theme_preset || 'nexus-dark'
      });
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const applyPreset = (preset) => {
    setTheme(preset.theme);
    setAccentColor(preset.accent);
    setFormData(prev => ({
      ...prev,
      tile_style: preset.tileStyle,
      tile_border_radius: preset.radius,
      custom_css: preset.css,
      theme_preset: preset.id
    }));
    addToast(`Zastosowano motyw ${preset.name}`, 'info');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);

    setUploading(true);
    try {
      const res = await api.upload.uploadFile(data);
      setFormData(prev => ({ ...prev, background_url: res.data.url }));
      addToast('Tapeta została przesłana pomyślnie', 'success');
    } catch (err) {
      addToast('Błąd przesyłania tapety: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({ ...formData, theme, accent_color: accentColor });
      addToast('Zapisano ustawienia wyglądu i motywów', 'success');
    } catch (err) {
      addToast('Błąd zapisywania ustawień', 'error');
    } finally {
      setSaving(false);
    }
  };

  const livePreviewService = {
    ...PRESET_SAMPLE_SERVICE,
    color: accentColor,
    health_status: 'online',
    health_response_time: 14,
    health_check_enabled: 1,
    favorite: 1,
    open_new_tab: 1
  };

  const liveOverrideSettings = {
    ...settings,
    ...formData,
    accent_color: accentColor,
    show_status_indicators: 'true'
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Ładowanie ustawień...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Wygląd, Motywy i Custom CSS</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Dostosuj styl kafelków, gotowe motywy, własne reguły CSS oraz tapetę pulpitu.
        </p>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* ============================================
            LEFT: SETTINGS FORM (7 cols)
            ============================================ */}
        <form onSubmit={handleSubmit} className="xl:col-span-7 space-y-6">
          
          {/* Theme Presets */}
          <div className="p-5 rounded-2xl glass-card space-y-4 border border-black/[0.08] dark:border-white/10">
            <div className="flex items-center gap-2 pb-2 border-b border-black/[0.06] dark:border-white/10">
              <Sparkles className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Gotowe Motywy Systemowe</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`p-3 rounded-2xl text-left transition-all border cursor-pointer ${
                    formData.theme_preset === preset.id 
                      ? 'border-accent bg-accent/15 shadow-md shadow-accent/20 scale-[1.02]' 
                      : 'border-black/[0.08] dark:border-white/10 glass-pill hover:border-accent/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: preset.accent }} />
                    {formData.theme_preset === preset.id && <Check className="w-3.5 h-3.5 text-accent" />}
                  </div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block truncate">{preset.name}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block capitalize">
                    {preset.theme === 'dark' ? 'Tryb Ciemny' : 'Tryb Jasny'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Color & Mode Toggle */}
          <div className="p-5 rounded-2xl glass-card space-y-4 border border-black/[0.08] dark:border-white/10">
            <div className="flex items-center gap-2 pb-2 border-b border-black/[0.06] dark:border-white/10">
              <Palette className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Paleta Kolorów i Tryb</h3>
            </div>
            
            <div className="flex items-center justify-between p-3.5 rounded-xl glass-pill">
              <div>
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">Tryb Kolorystyczny</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Aktualny: {theme === 'dark' ? 'Tryb Ciemny' : 'Tryb Jasny'}</span>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold shadow-md shadow-accent/25 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                Przełącz na {theme === 'dark' ? 'Jasny ☀️' : 'Ciemny 🌙'}
              </button>
            </div>

            {/* Symmetrical 2x7 color palette */}
            <div className="grid grid-cols-7 gap-2.5 max-w-sm">
              {DEFAULT_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 active:scale-95 shadow-md cursor-pointer ${
                    accentColor?.toLowerCase() === color.toLowerCase() 
                      ? 'border-slate-900 dark:border-white ring-4 ring-accent/30 scale-110' 
                      : 'border-transparent opacity-90 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setAccentColor(color)}
                />
              ))}
            </div>
          </div>

          {/* Dimensions & Grid */}
          <div className="p-5 rounded-2xl glass-card space-y-4 border border-black/[0.08] dark:border-white/10">
            <div className="flex items-center gap-2 pb-2 border-b border-black/[0.06] dark:border-white/10">
              <Sliders className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Układ Kafelków i Wymiary</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-tight">
                  Styl Kafelka
                </label>
                <select
                  name="tile_style"
                  value={formData.tile_style}
                  onChange={handleChange}
                  className="w-full bg-black/[0.03] dark:bg-black/40 border border-black/[0.1] dark:border-white/15 focus:border-accent text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none"
                >
                  <option value="default">Domyślny (Zrównoważony)</option>
                  <option value="compact">Kompaktowy (Mini Pigułka)</option>
                  <option value="detailed">Szczegółowy (Rozszerzony)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-tight">
                  Rozmiar Kafelka
                </label>
                <select
                  name="tile_size"
                  value={formData.tile_size}
                  onChange={handleChange}
                  className="w-full bg-black/[0.03] dark:bg-black/40 border border-black/[0.1] dark:border-white/15 focus:border-accent text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none"
                >
                  <option value="small">Mały</option>
                  <option value="medium">Średni</option>
                  <option value="large">Duży</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-3 rounded-xl glass-pill space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-900 dark:text-white">
                  <span>Zaokrąglenie narożników</span>
                  <span className="text-accent font-mono">{formData.tile_border_radius}px</span>
                </div>
                <input
                  type="range"
                  name="tile_border_radius"
                  min="4" max="32"
                  value={formData.tile_border_radius}
                  onChange={handleChange}
                  className="w-full accent-accent cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-xl glass-pill space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-900 dark:text-white">
                  <span>Odstępy między kafelkami (Gap)</span>
                  <span className="text-accent font-mono">{formData.grid_gap}px</span>
                </div>
                <input
                  type="range"
                  name="grid_gap"
                  min="8" max="36"
                  value={formData.grid_gap}
                  onChange={handleChange}
                  className="w-full accent-accent cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Wallpaper Upload & URL */}
          <div className="p-5 rounded-2xl glass-card space-y-4 border border-black/[0.08] dark:border-white/10">
            <div className="flex items-center gap-2 pb-2 border-b border-black/[0.06] dark:border-white/10">
              <Image className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Własna Tapeta Pulpitu</h3>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  label="Adres URL tapety / Ścieżka pliku"
                  name="background_url"
                  value={formData.background_url}
                  onChange={handleChange}
                  placeholder="/uploads/wallpaper.png lub https://..."
                />
              </div>
              <div className="pt-6">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl glass-pill hover:bg-black/[0.04] dark:hover:bg-white/10 text-xs font-bold text-slate-900 dark:text-white shadow-sm hover:scale-105 active:scale-95 transition-all">
                  <Upload className="w-4 h-4 text-accent" />
                  <span>{uploading ? 'Wysyłanie...' : 'Wgraj plik'}</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Custom CSS Code Editor */}
          <div className="p-5 rounded-2xl glass-card space-y-4 border border-black/[0.08] dark:border-white/10">
            <div className="flex items-center gap-2 pb-2 border-b border-black/[0.06] dark:border-white/10">
              <Code2 className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Własne reguły Custom CSS</h3>
            </div>
            
            <Input
              name="custom_css"
              type="textarea"
              value={formData.custom_css}
              onChange={handleChange}
              placeholder="/* Wpisz własne reguły CSS (np. .glass-card { filter: contrast(1.1); }) */"
              helperText="Zmiany są wstrzykiwane na żywo na pulpicie bez konieczności przeładowania strony."
            />
          </div>

          <Button type="submit" isLoading={saving} className="px-6 py-3 text-xs font-bold shadow-lg shadow-accent/25">
            Zapisz ustawienia wyglądu
          </Button>
        </form>

        {/* ============================================
            RIGHT: REAL-TIME PREVIEW STAGE (5 cols)
            ============================================ */}
        <div className="xl:col-span-5 sticky top-20 space-y-4">
          <div className="p-5 rounded-[28px] glass-card space-y-4 border border-black/[0.08] dark:border-white/15 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/10">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">Podgląd kafelka na żywo</h3>
              <span className="text-[11px] font-mono text-emerald-500 font-bold">● LIVE 14ms</span>
            </div>

            <div className="p-4 rounded-[20px] bg-black/[0.03] dark:bg-black/30 border border-black/[0.06] dark:border-white/10 backdrop-blur-md">
              <ServiceCard 
                service={livePreviewService} 
                overrideSettings={liveOverrideSettings}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
