import React, { useState, useEffect } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useLanguage } from '../../contexts/LanguageContext';
import Input from '../common/Input';
import Button from '../common/Button';
import { useToast } from '../../contexts/ToastContext';
import { Settings, Sliders, GitBranch, CheckCircle2, Globe } from 'lucide-react';

export default function GeneralSettings() {
  const { settings, updateSettings, loading } = useSettings();
  const { language, setLanguage, t } = useLanguage();
  const { addToast } = useToast();
  
  const [formData, setFormData] = useState({
    dashboard_name: 'NexusPanel',
    user_name: '',
    logo_url: '',
    favicon_url: '',
    language: 'pl',
    timezone: 'auto',
    show_header_clock: 'true',
    show_status_indicators: 'true'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        dashboard_name: settings.dashboard_name || 'NexusPanel',
        user_name: settings.user_name || '',
        logo_url: settings.logo_url || '',
        favicon_url: settings.favicon_url || '',
        language: settings.language || language || 'pl',
        timezone: settings.timezone || 'auto',
        show_header_clock: settings.show_header_clock !== undefined ? String(settings.show_header_clock) : 'true',
        show_status_indicators: settings.show_status_indicators !== undefined ? String(settings.show_status_indicators) : 'true'
      });
    }
  }, [settings, language]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 'true' : 'false') : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(formData);
      if (formData.language && setLanguage) {
        setLanguage(formData.language);
      }
      addToast(t('settings.saved', 'Ustawienia ogólne zostały zapisane'), 'success');
    } catch (err) {
      addToast(t('settings.error', 'Nie udało się zapisać ustawień'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Ładowanie ustawień...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Ustawienia Ogólne</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Dostosuj podstawowe opcje panelu, wybór języka oraz personalizację powitania.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {/* Core Identity */}
        <div className="p-5 rounded-2xl glass-card space-y-4 border border-black/[0.08] dark:border-white/10">
          <div className="flex items-center gap-2 pb-2 border-b border-black/[0.06] dark:border-white/10">
            <Settings className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tożsamość i Powitanie</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Twoje Imię / Pseudonim"
              name="user_name"
              value={formData.user_name}
              onChange={handleChange}
              placeholder="np. Maciej"
              helper="Wyświetlane w powitaniu na pulpicie: 'Witaj, <NAZWA>'"
            />

            <Input
              label="Nazwa Dashboardu"
              name="dashboard_name"
              value={formData.dashboard_name}
              onChange={handleChange}
              placeholder="np. NexusPanel"
              helper="Wyświetlana w nagłówku i na karcie przeglądarki"
            />
          </div>

          {/* Language Selector */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-tight flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-accent" />
              <span>Język interfejsu (Interface Language)</span>
            </label>
            <select
              name="language"
              value={formData.language}
              onChange={handleChange}
              className="w-full bg-black/[0.04] dark:bg-black/40 border border-black/[0.1] dark:border-white/15 text-slate-900 dark:text-white text-xs sm:text-sm rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-accent cursor-pointer"
            >
              <option value="pl" className="bg-slate-900 text-white">🇵🇱 Polski (Polish)</option>
              <option value="en" className="bg-slate-900 text-white">🇬🇧 English (Angielski)</option>
            </select>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="p-5 rounded-2xl glass-card space-y-4 border border-black/[0.08] dark:border-white/10">
          <div className="flex items-center gap-2 pb-2 border-b border-black/[0.06] dark:border-white/10">
            <Sliders className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Funkcje i Pasek Stanu</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 rounded-xl glass-pill cursor-pointer">
              <div>
                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white block">Wskaźniki stanu i pingu (Health Status)</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Wyświetla zielone/żółte/czerwone kropki oraz czas odpowiedzi (ms) na kafelkach</span>
              </div>
              <input
                type="checkbox"
                name="show_status_indicators"
                checked={formData.show_status_indicators === 'true'}
                onChange={handleChange}
                className="w-4 h-4 rounded accent-accent"
              />
            </label>
          </div>
        </div>

        <div className="pt-2">
          <Button type="submit" isLoading={saving} className="px-6 py-2.5 text-xs font-bold shadow-lg shadow-accent/25">
            Zapisz ustawienia
          </Button>
        </div>

        {/* System Version & Update Guide Card */}
        <div className="p-5 rounded-2xl glass-card border border-black/[0.08] dark:border-white/15 space-y-4 mt-8">
          <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/10">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Wersja i Aktualizacje</h3>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" />
              v1.0.0 (Wydanie stabilne)
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            NexusPanel został zaprojektowany z myślą o bezproblemowych aktualizacjach bez utraty danych. Wszystkie kafelki, kategorie i ustawienia są bezpiecznie przechowywane w trwałej bazie danych SQLite.
          </p>

          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">Sposób 1: Aktualizacja kontenera Proxmox LXC</span>
            <div className="p-3 rounded-xl bg-black/[0.04] dark:bg-black/50 border border-black/[0.08] dark:border-white/10 font-mono text-xs text-emerald-600 dark:text-emerald-400 select-all">
              cd /opt/nexuspanel && git pull && npm run build && systemctl restart nexuspanel
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">Sposób 2: Aktualizacja przez Docker Compose</span>
            <div className="p-3 rounded-xl bg-black/[0.04] dark:bg-black/50 border border-black/[0.08] dark:border-white/10 font-mono text-xs text-sky-600 dark:text-sky-400 select-all">
              docker compose pull && docker compose up -d --build
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
