import React, { useState, useRef } from 'react';
import { Plus, FolderUp, Radar, ArrowRight, Network, Compass, User, FileCode } from 'lucide-react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../hooks/useSettings';

export default function EmptyState({ onRefresh, onOpenScanner, onOpenAddModal }) {
  const { addToast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const { settings, refresh: refreshSettings } = useSettings();

  const [chosenMode, setChosenMode] = useState(null); // 'scanner' | 'manual'
  const [showNameModal, setShowNameModal] = useState(false);
  const [userName, setUserName] = useState(settings?.user_name || '');
  const [savingName, setSavingName] = useState(false);
  const [importingJson, setImportingJson] = useState(false);

  const fileInputRef = useRef(null);

  const handleSelectOption = (mode) => {
    setChosenMode(mode);
    setShowNameModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      setImportingJson(true);
      try {
        const json = JSON.parse(event.target.result);
        if (!json || typeof json !== 'object') {
          throw new Error('Invalid JSON structure');
        }
        await api.backup.importBackup(json);
        addToast(t('empty.import_success', 'Konfiguracja została pomyślnie zaimportowana'), 'success');
        if (refreshSettings) refreshSettings();
        if (onRefresh) onRefresh();
      } catch (err) {
        console.error('Import error:', err);
        addToast(t('empty.import_invalid', 'Nieprawidłowy plik szablonu JSON') + (err.response?.data?.error ? `: ${err.response.data.error}` : ''), 'error');
      } finally {
        setImportingJson(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmName = async (e) => {
    if (e) e.preventDefault();
    const trimmed = userName.trim();
    setSavingName(true);
    try {
      if (trimmed) {
        await api.settings.updateSettings({ user_name: trimmed });
        if (refreshSettings) refreshSettings();
      }
    } catch (err) {
      // ignore
    } finally {
      setSavingName(false);
      setShowNameModal(false);
      if (chosenMode === 'scanner' && onOpenScanner) {
        onOpenScanner();
      } else if (chosenMode === 'manual' && onOpenAddModal) {
        onOpenAddModal();
      }
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 sm:p-8 text-center max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-300">
      
      {/* Hidden File Input for JSON template import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Top Language Toggle Switcher */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl glass-pill mb-6 border border-white/10 shadow-sm">
        <button
          onClick={() => setLanguage('pl')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            language === 'pl'
              ? 'bg-accent text-white shadow-md shadow-accent/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Polski</span>
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            language === 'en'
              ? 'bg-accent text-white shadow-md shadow-accent/25'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>English</span>
        </button>
      </div>

      {/* Glossy Icon Hub */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-[26px] glass-card flex items-center justify-center text-accent shadow-2xl relative overflow-hidden border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/25 via-transparent to-purple-500/15 pointer-events-none" />
          <Compass className="w-10 h-10 text-accent relative z-10" />
        </div>
      </div>

      <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
        {t('empty.title', 'Witaj w NexusPanel')}
      </h1>
      <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-lg mb-10 font-medium leading-relaxed">
        {t('empty.subtitle', 'Twój szybki, nowoczesny ekran startowy w przeglądarce. Skonfiguruj swój pulpit w kilka chwil i przechodź do swoich aplikacji jednym kliknięciem.')}
      </p>

      {/* 3 Focused Interactive Setup Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full text-left mb-10">
        
        {/* Option 1: Auto LAN Discovery (Recommended) */}
        <div 
          onClick={() => handleSelectOption('scanner')}
          className="group relative p-6 rounded-3xl glass-card border border-accent/40 bg-gradient-to-b from-accent/15 via-transparent to-transparent hover:border-accent hover:scale-[1.02] cursor-pointer transition-all duration-300 shadow-xl flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-white shadow-lg shadow-accent/30">
                <Radar className="w-6 h-6 animate-spin" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-accent text-white shadow-md">
                {t('common.recommended', 'Zalecane')}
              </span>
            </div>

            <h3 className="font-black text-lg text-slate-900 dark:text-white group-hover:text-accent transition-colors">
              {t('empty.scanner_title', 'Skaner Sieci LAN')}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('empty.scanner_desc', 'Automatycznie bada Twoją podsieć i wykrywa Proxmox, Home Assistant, Docker, Portainer, NAS oraz inne usługi.')}
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-accent pt-5 mt-2">
            <span>{t('empty.scanner_btn', 'Uruchom skaner')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Option 2: Import .JSON Backup / Template File */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="group relative p-6 rounded-3xl glass-card border border-sky-500/30 bg-gradient-to-b from-sky-500/10 via-transparent to-transparent hover:border-sky-500 hover:scale-[1.02] cursor-pointer transition-all duration-300 shadow-xl flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-600/30">
                <FolderUp className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 font-mono">
                .JSON
              </span>
            </div>

            <h3 className="font-black text-lg text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors">
              {t('empty.import_title', 'Wczytaj szablon / plik JSON')}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('empty.import_desc', 'Wgraj wcześniej wyeksportowany plik .json, aby błyskawicznie przywrócić wszystkie kafelki i ustawienia.')}
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400 pt-5 mt-2">
            <span>{importingJson ? t('common.loading', 'Importowanie...') : t('empty.import_btn', 'Wybierz plik JSON')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Option 3: Add Manually */}
        <div 
          onClick={() => handleSelectOption('manual')}
          className="group relative p-6 rounded-3xl glass-card border border-black/[0.08] dark:border-white/15 hover:border-accent/40 hover:scale-[1.02] cursor-pointer transition-all duration-300 shadow-lg flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-black/[0.05] dark:bg-white/10 flex items-center justify-center text-slate-900 dark:text-white border border-black/[0.08] dark:border-white/10 shadow-md">
              <Plus className="w-6 h-6" />
            </div>

            <h3 className="font-black text-lg text-slate-900 dark:text-white group-hover:text-accent transition-colors">
              {t('empty.manual_title', 'Dodaj ręcznie')}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('empty.manual_desc', 'Wpisz własny adres URL, nazwę i kategorię oraz wybierz ikonę z obszernego katalogu aplikacji homelabu.')}
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-accent pt-5 mt-2">
            <span>{t('empty.manual_btn', 'Otwórz formularz')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* Feature Highlights Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left pt-6 border-t border-black/[0.08] dark:border-white/10">
        <div className="p-3 rounded-2xl glass-pill flex items-center gap-3">
          <div className="w-7 h-7 rounded-xl bg-accent/20 flex items-center justify-center text-accent flex-shrink-0">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-extrabold text-xs text-slate-900 dark:text-white block">{t('empty.badge_speed', 'Szybki Startpage')}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{t('empty.badge_speed_sub', 'Ekran nowej karty')}</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl glass-pill flex items-center gap-3">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
            <Network className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-extrabold text-xs text-slate-900 dark:text-white block">{t('empty.badge_discovery', 'Auto Subnet Discovery')}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{t('empty.badge_discovery_sub', 'Wykrywa podsieć LAN')}</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl glass-pill flex items-center gap-3">
          <div className="w-7 h-7 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
            <FileCode className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-extrabold text-xs text-slate-900 dark:text-white block">{t('empty.badge_status', 'Live Status & Ping')}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{t('empty.badge_status_sub', 'Monitorowanie stanu')}</span>
          </div>
        </div>
      </div>

      {/* Personalization Modal Step: "Jak mamy się do Ciebie zwracać?" */}
      {showNameModal && (
        <Modal
          title={t('empty.modal_title', 'Personalizacja Dashboardu')}
          onClose={() => handleConfirmName()}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmName} className="space-y-5">
            <div className="text-center space-y-2 py-2">
              <div className="w-14 h-14 rounded-2xl bg-accent/20 text-accent flex items-center justify-center mx-auto border border-accent/30 shadow-lg">
                <User className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                {t('empty.modal_heading', 'Jak mamy się do Ciebie zwracać?')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('empty.modal_desc', 'Wpisz swoje imię lub pseudonim, aby spersonalizować powitanie na ekranie startowym.')}
              </p>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {t('empty.modal_input_label', 'Twoje Imię lub Pseudonim:')}
              </label>
              <input
                type="text"
                autoFocus
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder={t('empty.modal_placeholder', 'np. Maciej, Administrator, Homelab Master')}
                className="w-full bg-black/[0.04] dark:bg-black/40 border border-black/[0.1] dark:border-white/15 focus:border-accent focus:ring-4 focus:ring-accent/20 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-xl px-4 py-3 text-sm font-medium transition-all"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-black/[0.08] dark:border-white/10">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleConfirmName()}
              >
                {t('common.skip', 'Pomiń')}
              </Button>

              <Button
                type="submit"
                isLoading={savingName}
                className="px-6 py-2.5 shadow-lg shadow-accent/25"
              >
                {t('common.next', 'Dalej')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
