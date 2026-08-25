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

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">{t('common.loading', 'Ładowanie ustawień...')}</div>;

  return (
    <div className="space-y-5">
      <div className="pb-2 border-b border-[#1c2534]">
        <h2 className="text-base sm:text-lg font-semibold text-slate-100 tracking-tight">
          {t('settings.general_title', 'Ustawienia Ogólne')}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {t('settings.general_subtitle', 'Dostosuj podstawowe opcje panelu, wybór języka oraz personalizację powitania.')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
        {/* Core Identity */}
        <div className="p-4 sm:p-5 rounded-lg bg-[#111622] border border-[#1d2635] space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#1c2534]">
            <Settings className="w-3.5 h-3.5 text-blue-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              {t('settings.section_identity', 'Tożsamość i Powitanie')}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('settings.user_name_label', 'Twoje Imię / Pseudonim')}
              name="user_name"
              value={formData.user_name}
              onChange={handleChange}
              placeholder="np. Maciej"
              helperText={t('settings.user_name_helper', 'Wyświetlane w powitaniu na pulpicie: "Witaj, <NAZWA>"')}
            />

            <Input
              label={t('settings.dash_name_label', 'Nazwa Dashboardu')}
              name="dashboard_name"
              value={formData.dashboard_name}
              onChange={handleChange}
              placeholder="np. NexusPanel"
              helperText={t('settings.dash_name_helper', 'Wyświetlana w nagłówku i na karcie przeglądarki')}
            />
          </div>

          {/* Language Selector */}
          <div className="pt-1">
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('settings.language_label', 'Język interfejsu (Interface Language)')}</span>
            </label>
            <select
              name="language"
              value={formData.language}
              onChange={(e) => {
                handleChange(e);
                if (setLanguage) setLanguage(e.target.value);
              }}
              className="w-full bg-[#18202d] border border-[#222d41] text-slate-200 text-xs sm:text-sm rounded-md px-3 py-2 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="pl" className="bg-[#141b27] text-slate-200">🇵🇱 Polski (Polish)</option>
              <option value="en" className="bg-[#141b27] text-slate-200">🇬🇧 English (Angielski)</option>
            </select>
          </div>
        </div>

        {/* Feature Toggles */}
        <div className="p-4 sm:p-5 rounded-lg bg-[#111622] border border-[#1d2635] space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#1c2534]">
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              {t('settings.section_features', 'Funkcje i Pasek Stanu')}
            </h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-md bg-[#18202d] border border-[#202c3e] cursor-pointer hover:border-[#2f3d56] transition-colors">
              <div>
                <span className="font-medium text-xs text-slate-200 block">
                  {t('settings.status_indicators_label', 'Wskaźniki stanu i pingu (Health Status)')}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  {t('settings.status_indicators_helper', 'Wyświetla zielone/żółte/czerwone kropki oraz czas odpowiedzi (ms) na kafelkach')}
                </span>
              </div>
              <input
                type="checkbox"
                name="show_status_indicators"
                checked={formData.show_status_indicators === 'true'}
                onChange={handleChange}
                className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

        <div className="pt-1">
          <Button type="submit" isLoading={saving} className="px-5 py-2 text-xs font-medium">
            {t('settings.btn_save', 'Zapisz ustawienia')}
          </Button>
        </div>

        {/* System Version & Update Guide Card */}
        <div className="p-4 sm:p-5 rounded-lg bg-[#111622] border border-[#1d2635] space-y-3.5 mt-6">
          <div className="flex items-center justify-between pb-2 border-b border-[#1c2534]">
            <div className="flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5 text-blue-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                {t('settings.version_title', 'Wersja i Aktualizacje')}
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              <CheckCircle2 className="w-3 h-3" />
              {t('settings.version_stable', 'v1.0.0 (Wydanie stabilne)')}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            {t('settings.version_desc', 'NexusPanel został zaprojektowany z myślą o bezproblemowych aktualizacjach bez utraty danych. Wszystkie kafelki, kategorie i ustawienia są bezpiecznie przechowywane w trwałej bazie danych SQLite.')}
          </p>

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-300 block">
              {t('settings.update_proxmox', 'Sposób 1: Aktualizacja kontenera Proxmox LXC')}
            </span>
            <div className="p-2.5 rounded-md bg-[#18202d] border border-[#202c3e] font-mono text-xs text-emerald-400 select-all">
              cd /opt/nexuspanel && git fetch origin main && git reset --hard origin/main && systemctl restart nexuspanel
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-300 block">
              {t('settings.update_docker', 'Sposób 2: Aktualizacja przez Docker Compose')}
            </span>
            <div className="p-2.5 rounded-md bg-[#18202d] border border-[#202c3e] font-mono text-xs text-sky-400 select-all">
              docker compose pull && docker compose up -d --build
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
