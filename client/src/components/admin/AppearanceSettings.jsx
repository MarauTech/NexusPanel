import React, { useState, useEffect, useCallback } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useServices } from '../../hooks/useServices';
import { useTheme } from '../../contexts/ThemeContext';
import Input from '../common/Input';
import Button from '../common/Button';
import { DEFAULT_COLORS, TILE_STYLES, TILE_SIZES } from '../../utils/constants';
import ServiceCard from '../dashboard/ServiceCard';
import api from '../../services/api';
import { 
  Sparkles, Eye, CheckCircle2, AlertTriangle, XCircle, RefreshCw, 
  Palette, Sliders, Image, Activity, Globe, Upload, Code2, Layers, Check
} from 'lucide-react';

const THEME_PRESETS = [
  {
    id: 'nexus-dark',
    name: 'Nexus Dark',
    accent: '#6366f1',
    theme: 'dark',
    tileStyle: 'default',
    radius: '20',
    css: ''
  },
  {
    id: 'nexus-light',
    name: 'Nexus Light',
    accent: '#4f46e5',
    theme: 'light',
    tileStyle: 'default',
    radius: '20',
    css: ''
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    accent: '#f43f5e',
    theme: 'dark',
    tileStyle: 'detailed',
    radius: '8',
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

const PRESET_SAMPLE_SERVICES = [
  {
    id: 'preview-proxmox',
    name: 'Proxmox VE',
    description: 'Virtualization management platform for VMs and LXC containers.',
    url: 'https://192.168.1.10:8006',
    icon: 'proxmox',
    category_name: 'Infrastructure',
    tags: [{ id: 1, name: 'hypervisor', color: '#e57000' }],
    custom_badge: 'Node 01',
    uptime_percentage: '99.9',
    history: [{ status: 'online', responseTime: 14 }, { status: 'online', responseTime: 18 }, { status: 'online', responseTime: 12 }]
  },
  {
    id: 'preview-ha',
    name: 'Home Assistant',
    description: 'Open source home automation that puts local control and privacy first.',
    url: 'http://192.168.1.30:8123',
    icon: 'home-assistant',
    category_name: 'Smart Home',
    tags: [{ id: 3, name: 'zigbee', color: '#0284c7' }],
    custom_badge: 'Hub',
    uptime_percentage: '100.0',
    history: [{ status: 'online', responseTime: 22 }, { status: 'online', responseTime: 20 }]
  }
];

export default function AppearanceSettings() {
  const { settings, updateSettings, loading } = useSettings();
  const { services: userServices } = useServices();
  const { theme, toggleTheme, setTheme, accentColor, setAccentColor } = useTheme();
  
  const [formData, setFormData] = useState({
    tile_style: 'default',
    tile_size: 'medium',
    tile_border_radius: '20',
    grid_gap: '16',
    grid_columns: '4',
    background_url: '',
    background_opacity: '0',
    background_blur: '0',
    custom_css: '',
    theme_preset: 'umbrel-dark'
  });
  
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Live Auto Health Probe State
  const [previewSampleIndex, setPreviewSampleIndex] = useState(0);
  const [liveStatus, setLiveStatus] = useState('online');
  const [liveLatency, setLiveLatency] = useState(14);
  const [probing, setProbing] = useState(false);

  const activeSample = PRESET_SAMPLE_SERVICES[previewSampleIndex];

  useEffect(() => {
    if (settings) {
      setFormData({
        tile_style: settings.tile_style || 'default',
        tile_size: settings.tile_size || 'medium',
        tile_border_radius: settings.tile_border_radius || '20',
        grid_gap: settings.grid_gap || '16',
        grid_columns: settings.grid_columns || '4',
        background_url: settings.background_url || '',
        background_opacity: settings.background_opacity || '0',
        background_blur: settings.background_blur || '0',
        custom_css: settings.custom_css || '',
        theme_preset: settings.theme_preset || 'umbrel-dark'
      });
    }
  }, [settings]);

  // Handle Custom CSS Live Injection
  useEffect(() => {
    let styleTag = document.getElementById('nexuspanel-custom-css');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'nexuspanel-custom-css';
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = formData.custom_css || '';
  }, [formData.custom_css]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyPreset = (preset) => {
    setTheme(preset.theme);
    setAccentColor(preset.accent);
    setFormData(prev => ({
      ...prev,
      theme_preset: preset.id,
      tile_style: preset.tileStyle,
      tile_border_radius: preset.radius,
      custom_css: preset.css
    }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);
    setUploading(true);

    try {
      const res = await api.upload.uploadImage(data);
      if (res.data?.url) {
        setFormData(prev => ({ ...prev, background_url: res.data.url }));
      }
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await updateSettings({ ...formData, theme, accent_color: accentColor });
    setSaving(false);
  };

  const livePreviewService = {
    ...activeSample,
    color: accentColor,
    health_status: liveStatus,
    health_response_time: liveLatency,
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

  if (loading) return <div className="p-8 text-center text-text-secondary">Loading settings...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">Wygląd, Motywy i Custom CSS</h2>
        <p className="text-sm text-text-secondary mt-1">
          Dostosuj styl kafelków, gotowe motywy, własne reguły CSS oraz tapetę dashboardu.
        </p>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* ============================================
            LEFT: SETTINGS FORM (7 cols)
            ============================================ */}
        <form onSubmit={handleSubmit} className="xl:col-span-7 space-y-6">
          
          {/* Theme Presets */}
          <div className="p-5 rounded-2xl glass-card space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <Sparkles className="w-5 h-5 text-accent" />
              <h3 className="text-base font-bold text-text-primary">Gotowe Motywy Systemowe</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`p-3 rounded-2xl text-left transition-all border ${
                    formData.theme_preset === preset.id 
                      ? 'border-accent bg-accent/15 shadow-md shadow-accent/20 scale-[1.02]' 
                      : 'border-white/10 glass-pill hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: preset.accent }} />
                    {formData.theme_preset === preset.id && <Check className="w-3.5 h-3.5 text-accent" />}
                  </div>
                  <span className="font-bold text-xs text-text-primary block truncate">{preset.name}</span>
                  <span className="text-[10px] text-text-secondary block capitalize">{preset.theme} mode</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color & Mode Toggle */}
          <div className="p-5 rounded-2xl glass-card space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <Palette className="w-5 h-5 text-accent" />
              <h3 className="text-base font-bold text-text-primary">Paleta Kolorów i Tryb</h3>
            </div>
            
            <div className="flex items-center justify-between p-3.5 rounded-xl glass-pill">
              <div>
                <span className="font-bold text-xs sm:text-sm text-text-primary block">Tryb Kolorystyczny</span>
                <span className="text-xs text-text-secondary">Aktualny: {theme === 'dark' ? 'Tryb Ciemny' : 'Tryb Jasny'}</span>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold shadow-md shadow-accent/25 hover:scale-105 active:scale-95 transition-all"
              >
                Przełącz na {theme === 'dark' ? 'Jasny' : 'Ciemny'}
              </button>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {DEFAULT_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`w-9 h-9 rounded-full border-2 transition-all hover:scale-110 active:scale-95 shadow-md ${
                    accentColor === color ? 'border-white ring-4 ring-accent/30 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setAccentColor(color)}
                />
              ))}
            </div>
          </div>

          {/* Dimensions & Grid */}
          <div className="p-5 rounded-2xl glass-card space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <Sliders className="w-5 h-5 text-accent" />
              <h3 className="text-base font-bold text-text-primary">Tile Layout & Dimensions</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Tile Style Variant"
                name="tile_style"
                type="select"
                value={formData.tile_style}
                onChange={handleChange}
                options={Object.entries(TILE_STYLES).map(([val, label]) => ({ value: val, label }))}
              />
              <Input
                label="Tile Size"
                name="tile_size"
                type="select"
                value={formData.tile_size}
                onChange={handleChange}
                options={Object.entries(TILE_SIZES).map(([val, label]) => ({ value: val, label }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-3 rounded-xl glass-pill space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-text-primary">
                  <span>Corner Radius</span>
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
                <div className="flex justify-between text-xs font-bold text-text-primary">
                  <span>Grid Gap Spacing</span>
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
          <div className="p-5 rounded-2xl glass-card space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <Image className="w-5 h-5 text-accent" />
              <h3 className="text-base font-bold text-text-primary">Wallpaper & Background Upload</h3>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  label="Wallpaper Image URL / File Path"
                  name="background_url"
                  value={formData.background_url}
                  onChange={handleChange}
                  placeholder="/uploads/wallpaper.png or https://..."
                />
              </div>
              <div className="pt-6">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl glass-pill hover:bg-white/10 text-xs font-bold text-text-primary shadow-sm hover:scale-105 active:scale-95 transition-all">
                  <Upload className="w-4 h-4 text-accent" />
                  <span>{uploading ? 'Uploading...' : 'Upload'}</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* Custom CSS Code Editor */}
          <div className="p-5 rounded-2xl glass-card space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-white/10">
              <Code2 className="w-5 h-5 text-accent" />
              <h3 className="text-base font-bold text-text-primary">Custom CSS Rules (Live Inject)</h3>
            </div>
            
            <Input
              name="custom_css"
              type="textarea"
              value={formData.custom_css}
              onChange={handleChange}
              placeholder="/* Add custom CSS rules here (e.g. .glass-card { filter: contrast(1.1); }) */"
              helperText="Changes are injected live into the page without requiring a reload."
            />
          </div>

          <Button type="submit" isLoading={saving} className="px-6 py-3 text-sm font-bold shadow-lg shadow-accent/25">
            Save Appearance & Themes
          </Button>
        </form>

        {/* ============================================
            RIGHT: REAL-TIME PREVIEW STAGE (5 cols)
            ============================================ */}
        <div className="xl:col-span-5 sticky top-20 space-y-4">
          <div className="p-5 rounded-[28px] glass-card space-y-4 border border-white/20 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-extrabold text-text-primary tracking-tight">Podgląd kafelka na żywo</h3>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">● LIVE 14ms</span>
            </div>

            <div className="p-4 rounded-[20px] bg-black/30 border border-white/10 backdrop-blur-md">
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
