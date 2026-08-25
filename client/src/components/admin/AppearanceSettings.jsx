import React, { useState, useEffect } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useServices } from '../../hooks/useServices';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
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
  description: 'Primary hypervisor node for virtual machines and LXC containers.',
  url: 'https://192.168.1.10:8006',
  icon: 'proxmox',
  category_name: 'Infrastructure',
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
  const { t } = useLanguage();
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
    addToast(`${t('appearance.preset_applied', 'Zastosowano motyw')} ${preset.name}`, 'info');
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
      addToast(t('appearance.wallpaper_success', 'Tapeta została przesłana pomyślnie'), 'success');
    } catch (err) {
      addToast(`${t('appearance.wallpaper_error', 'Błąd przesyłania tapety')}: ${err.response?.data?.error || err.message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({ ...formData, theme, accent_color: accentColor });
      addToast(t('appearance.saved', 'Zapisano ustawienia wyglądu i motywów'), 'success');
    } catch (err) {
      addToast(t('common.error', 'Błąd zapisywania ustawień'), 'error');
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

  if (loading) return <div className="p-8 text-center text-slate-500">{t('common.loading', 'Ładowanie ustawień...')}</div>;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="pb-2 border-b border-slate-200 dark:border-[#1c2534]">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
          {t('appearance.title', 'Wygląd, Motywy i Custom CSS')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {t('appearance.subtitle', 'Dostosuj styl kafelków, gotowe motywy, własne reguły CSS oraz tapetę pulpitu.')}
        </p>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        
        {/* ============================================
            LEFT: SETTINGS FORM (7 cols)
            ============================================ */}
        <form onSubmit={handleSubmit} className="xl:col-span-7 space-y-5">
          
          {/* Theme Presets */}
          <div className="p-4 sm:p-5 rounded-lg bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1d2635] space-y-4 shadow-sm dark:shadow-none transition-colors">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-[#1c2534]">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('appearance.presets_title', 'Gotowe Motywy Systemowe')}
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`p-3 rounded-lg text-left transition-colors border cursor-pointer ${
                    formData.theme_preset === preset.id 
                      ? 'border-slate-300 dark:border-[#2b394f] bg-slate-200 dark:bg-[#1c2534] text-slate-900 dark:text-white' 
                      : 'border-slate-200 dark:border-[#202c3e] bg-white dark:bg-[#18202d] hover:border-slate-300 dark:hover:border-[#2f3d56] text-slate-700 dark:text-slate-300 shadow-sm dark:shadow-none'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: preset.accent }} />
                    {formData.theme_preset === preset.id && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                  </div>
                  <span className="font-medium text-xs block truncate text-slate-800 dark:text-slate-200">{preset.name}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block capitalize mt-0.5">
                    {preset.theme === 'dark' ? t('appearance.mode_dark', 'Tryb Ciemny') : t('appearance.mode_light', 'Tryb Jasny')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Color & Mode Toggle */}
          <div className="p-4 sm:p-5 rounded-lg bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1d2635] space-y-4 shadow-sm dark:shadow-none transition-colors">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-[#1c2534]">
              <Palette className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('appearance.palette_title', 'Paleta Kolorów i Tryb')}
              </h3>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-md bg-white dark:bg-[#18202d] border border-slate-200 dark:border-[#202c3e] shadow-sm dark:shadow-none">
              <div>
                <span className="font-medium text-xs text-slate-800 dark:text-slate-200 block">
                  {t('appearance.color_mode', 'Tryb Kolorystyczny')}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t('appearance.current_mode', 'Aktualny:')} {theme === 'dark' ? t('appearance.mode_dark', 'Tryb Ciemny') : t('appearance.mode_light', 'Tryb Jasny')}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-[#151c28] dark:hover:bg-[#1b2536] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-[#212c3e] text-xs font-medium transition-colors cursor-pointer"
              >
                {theme === 'dark' ? t('appearance.switch_to_light', 'Przełącz na Jasny ☀️') : t('appearance.switch_to_dark', 'Przełącz na Ciemny 🌙')}
              </button>
            </div>

            {/* Symmetrical color palette */}
            <div className="grid grid-cols-7 gap-2 max-w-sm">
              {DEFAULT_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`w-7 h-7 rounded-md border transition-all cursor-pointer ${
                    accentColor?.toLowerCase() === color.toLowerCase() 
                      ? 'border-slate-900 dark:border-white ring-2 ring-blue-500/40 scale-105' 
                      : 'border-transparent opacity-85 hover:opacity-100 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setAccentColor(color)}
                />
              ))}
            </div>
          </div>

          {/* Dimensions & Grid */}
          <div className="p-4 sm:p-5 rounded-lg bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1d2635] space-y-4 shadow-sm dark:shadow-none transition-colors">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-[#1c2534]">
              <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('appearance.grid_title', 'Układ Kafelków i Wymiary')}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('appearance.tile_style', 'Styl Kafelka')}
                </label>
                <select
                  name="tile_style"
                  value={formData.tile_style}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-[#18202d] border border-slate-300 dark:border-[#222d41] focus:border-blue-500 text-slate-900 dark:text-slate-200 rounded-md px-3 py-2 text-xs font-normal focus:outline-none shadow-sm dark:shadow-none"
                >
                  <option value="default">{t('appearance.style_default', 'Domyślny (Zrównoważony)')}</option>
                  <option value="compact">{t('appearance.style_compact', 'Kompaktowy (Mini Pigułka)')}</option>
                  <option value="detailed">{t('appearance.style_detailed', 'Szczegółowy (Rozszerzony)')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('appearance.tile_size', 'Rozmiar Kafelka')}
                </label>
                <select
                  name="tile_size"
                  value={formData.tile_size}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-[#18202d] border border-slate-300 dark:border-[#222d41] focus:border-blue-500 text-slate-900 dark:text-slate-200 rounded-md px-3 py-2 text-xs font-normal focus:outline-none shadow-sm dark:shadow-none"
                >
                  <option value="small">{t('appearance.size_small', 'Mały')}</option>
                  <option value="medium">{t('appearance.size_medium', 'Średni')}</option>
                  <option value="large">{t('appearance.size_large', 'Duży')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-3 rounded-md bg-white dark:bg-[#18202d] border border-slate-200 dark:border-[#202c3e] space-y-1.5 shadow-sm dark:shadow-none">
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span>{t('appearance.border_radius', 'Zaokrąglenie narożników')}</span>
                  <span className="text-slate-500 dark:text-slate-400 font-mono">{formData.tile_border_radius}px</span>
                </div>
                <input
                  type="range"
                  name="tile_border_radius"
                  min="4" max="32"
                  value={formData.tile_border_radius}
                  onChange={handleChange}
                  className="w-full accent-blue-600 dark:accent-blue-500 cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-md bg-white dark:bg-[#18202d] border border-slate-200 dark:border-[#202c3e] space-y-1.5 shadow-sm dark:shadow-none">
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span>{t('appearance.grid_gap', 'Odstępy między kafelkami (Gap)')}</span>
                  <span className="text-slate-500 dark:text-slate-400 font-mono">{formData.grid_gap}px</span>
                </div>
                <input
                  type="range"
                  name="grid_gap"
                  min="8" max="36"
                  value={formData.grid_gap}
                  onChange={handleChange}
                  className="w-full accent-blue-600 dark:accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Wallpaper Upload & URL */}
          <div className="p-4 sm:p-5 rounded-lg bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1d2635] space-y-4 shadow-sm dark:shadow-none transition-colors">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-[#1c2534]">
              <Image className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('appearance.wallpaper_title', 'Własna Tapeta Pulpitu')}
              </h3>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  label={t('appearance.wallpaper_url', 'Adres URL tapety / Ścieżka pliku')}
                  name="background_url"
                  value={formData.background_url}
                  onChange={handleChange}
                  placeholder="/uploads/wallpaper.png lub https://..."
                />
              </div>
              <div className="pt-6">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white hover:bg-slate-100 dark:bg-[#151c28] dark:hover:bg-[#1b2536] border border-slate-300 dark:border-[#212c3e] text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors shadow-sm dark:shadow-none">
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>{uploading ? t('appearance.uploading', 'Wysyłanie...') : t('appearance.upload_btn', 'Wgraj plik')}</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Custom CSS Code Editor */}
          <div className="p-4 sm:p-5 rounded-lg bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1d2635] space-y-4 shadow-sm dark:shadow-none transition-colors">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-[#1c2534]">
              <Code2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('appearance.css_title', 'Własne reguły Custom CSS')}
              </h3>
            </div>
            
            <Input
              name="custom_css"
              type="textarea"
              value={formData.custom_css}
              onChange={handleChange}
              placeholder="/* body { filter: contrast(1.05); } */"
              helperText={t('appearance.css_helper', 'Zmiany są wstrzykiwane na żywo na pulpicie bez konieczności przeładowania strony.')}
            />
          </div>

          <Button type="submit" isLoading={saving} className="px-5 py-2 text-xs font-medium">
            {t('appearance.save_btn', 'Zapisz ustawienia wyglądu')}
          </Button>
        </form>

        {/* ============================================
            RIGHT: REAL-TIME PREVIEW STAGE (5 cols)
            ============================================ */}
        <div className="xl:col-span-5 sticky top-20 space-y-4">
          <div className="p-4 sm:p-5 rounded-lg bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1d2635] space-y-3 shadow-sm dark:shadow-lg transition-colors">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#1c2534]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {t('appearance.preview_title', 'Podgląd kafelka na żywo')}
              </h3>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">● LIVE 14ms</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-100 dark:bg-[#0b0f17] border border-slate-200 dark:border-[#1d2635]">
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
