import React, { useState } from 'react';
import { Plus, Sparkles, Server, Shield, Layers, LayoutGrid, Radar, ArrowRight, Network, Compass, User, CheckCircle2 } from 'lucide-react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../hooks/useSettings';

export default function EmptyState({ onRefresh, onOpenScanner, onOpenAddModal }) {
  const { addToast } = useToast();
  const { t } = useLanguage();
  const { settings, refresh: refreshSettings } = useSettings();

  const [chosenMode, setChosenMode] = useState(null); // 'scanner' | 'manual'
  const [showNameModal, setShowNameModal] = useState(false);
  const [userName, setUserName] = useState(settings?.user_name || '');
  const [savingName, setSavingName] = useState(false);

  const handleSelectOption = (mode) => {
    setChosenMode(mode);
    setShowNameModal(true);
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
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 sm:p-8 text-center max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-300">
      
      {/* Glossy Icon Hub */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-[26px] glass-card flex items-center justify-center text-accent shadow-2xl relative overflow-hidden border border-white/20">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/25 via-transparent to-purple-500/15 pointer-events-none" />
          <Compass className="w-10 h-10 text-accent relative z-10 animate-pulse" />
        </div>
        <span className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-full bg-emerald-500 text-white shadow-lg">
          <Sparkles className="w-3.5 h-3.5" />
        </span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
        Witaj w NexusPanel
      </h1>
      <p className="text-sm sm:text-base text-slate-300 max-w-lg mb-10 font-medium leading-relaxed">
        Twój szybki, nowoczesny ekran startowy w przeglądarce. Skonfiguruj swój pulpit w 30 sekund i przechodź do swoich aplikacji 1 kliknięciem.
      </p>

      {/* 2 Focused Interactive Setup Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full text-left mb-10">
        
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
                Zalecane
              </span>
            </div>

            <h3 className="font-black text-lg text-white group-hover:text-accent transition-colors">
              Skaner Sieci LAN ⚡
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Automatycznie bada Twoją podsieć i wykrywa Proxmox, Home Assistant, Docker, Portainer, NAS oraz inne usługi.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-accent pt-5 mt-2">
            <span>Uruchom skaner</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Option 2: Add Manually */}
        <div 
          onClick={() => handleSelectOption('manual')}
          className="group relative p-6 rounded-3xl glass-card border border-white/15 hover:border-white/30 hover:scale-[1.02] cursor-pointer transition-all duration-300 shadow-lg flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/10 shadow-md">
              <Plus className="w-6 h-6" />
            </div>

            <h3 className="font-black text-lg text-white group-hover:text-accent transition-colors">
              Dodaj ręcznie ➕
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Wpisz własny adres URL, nazwę i kategorię oraz wybierz ikonę z obszernego katalogu aplikacji homelabu.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 group-hover:text-white pt-5 mt-2">
            <span>Otwórz formularz</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* Feature Highlights Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left pt-6 border-t border-white/10">
        <div className="p-3 rounded-2xl glass-pill flex items-center gap-3">
          <div className="w-7 h-7 rounded-xl bg-accent/20 flex items-center justify-center text-accent flex-shrink-0">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-extrabold text-xs text-white block">Szybki Startpage</span>
            <span className="text-[11px] text-slate-400">Ekran nowej karty</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl glass-pill flex items-center gap-3">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <Network className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-extrabold text-xs text-white block">Auto Subnet Discovery</span>
            <span className="text-[11px] text-slate-400">Wykrywa podsieć LAN</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl glass-pill flex items-center gap-3">
          <div className="w-7 h-7 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-extrabold text-xs text-white block">Live Status & Ping</span>
            <span className="text-[11px] text-slate-400">Monitorowanie stanu</span>
          </div>
        </div>
      </div>

      {/* Personalization Modal Step: "Jak mamy się do Ciebie zwracać?" */}
      {showNameModal && (
        <Modal
          title="Personalizacja Dashboardu"
          onClose={() => handleConfirmName()}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmName} className="space-y-5">
            <div className="text-center space-y-2 py-2">
              <div className="w-14 h-14 rounded-2xl bg-accent/20 text-accent flex items-center justify-center mx-auto border border-accent/30 shadow-lg">
                <User className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-white tracking-tight">
                Jak mamy się do Ciebie zwracać?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Wpisz swoje imię lub pseudonim, aby spersonalizować powitanie na ekranie startowym.
              </p>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-300 block">
                Twoje Imię lub Pseudonim:
              </label>
              <input
                type="text"
                autoFocus
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="np. Maciej, Administrator, Homelab Master"
                className="w-full bg-black/40 border border-white/15 focus:border-accent focus:ring-4 focus:ring-accent/20 text-white placeholder:text-slate-500 rounded-xl px-4 py-3 text-sm font-medium transition-all"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleConfirmName()}
              >
                Pomiń
              </Button>

              <Button
                type="submit"
                isLoading={savingName}
                className="px-6 py-2.5 shadow-lg shadow-accent/25"
              >
                Dalej ➔
              </Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
}
