import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import IconPicker from '../common/IconPicker';
import ColorPicker from '../common/ColorPicker';
import BrandIcon from '../common/BrandIcon';
import api from '../../services/api';
import { useCategories } from '../../hooks/useCategories';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { detectHomelabService } from '../../utils/homelabCatalog';
import { Sparkles, Layers, Palette, Sliders, Activity, CheckCircle2, ChevronRight, ChevronLeft, Wand2, Radio } from 'lucide-react';

export default function ServiceForm({ service, onClose, onSuccess }) {
  const isEdit = !!service;
  const { categories } = useCategories();
  const { addToast } = useToast();
  const { t } = useLanguage();
  
  // Tabs: 'basic' | 'appearance' | 'advanced'
  const [activeTab, setActiveTab] = useState('basic');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    category_id: '',
    icon: '',
    color: '#6366f1',
    open_new_tab: true,
    enabled: true,
    favorite: false,
    health_check_enabled: false,
    health_check_type: 'http',
    health_check_url: '',
    health_check_interval: 60,
    custom_badge: '',
    tags: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    if (service) {
      const tagString = Array.isArray(service.tags) 
        ? service.tags.map(t => (typeof t === 'string' ? t : t.name)).join(', ') 
        : '';
      
      setFormData({
        name: service.name || '',
        description: service.description || '',
        url: service.url || '',
        category_id: service.category_id || service.category?.id || '',
        icon: service.icon || '',
        color: service.color || '#6366f1',
        open_new_tab: service.open_new_tab === 1 || service.open_new_tab === true || service.openInNewTab !== false,
        enabled: service.enabled === 1 || service.enabled === true || service.enabled !== false,
        favorite: service.favorite === 1 || service.favorite === true || Boolean(service.favorite),
        health_check_enabled: service.health_check_enabled === 1 || service.health_check_enabled === true,
        health_check_type: service.health_check_type || 'http',
        health_check_url: service.health_check_url || '',
        health_check_interval: service.health_check_interval || 60,
        custom_badge: service.custom_badge || '',
        tags: tagString,
        notes: service.notes || ''
      });
    }
  }, [service]);

  // Check auto-detection suggestions on name change when creating new service
  const handleNameChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, name: val }));

    if (!isEdit && val.length >= 3) {
      const detected = detectHomelabService(val);
      if (detected && detected.icon !== formData.icon) {
        setSuggestion(detected);
        return;
      }
    }
    setSuggestion(null);
  };

  const applySuggestion = (sug) => {
    let matchedCatId = formData.category_id;
    if (sug.categoryName && categories.length > 0) {
      const foundCat = categories.find(c => c.name.toLowerCase().includes(sug.categoryName.toLowerCase()));
      if (foundCat) matchedCatId = foundCat.id;
    }

    setFormData(prev => ({
      ...prev,
      name: sug.name || prev.name,
      icon: sug.icon || prev.icon,
      color: sug.color || prev.color,
      category_id: matchedCatId
    }));
    setSuggestion(null);
    addToast(`Automatycznie uzupełniono ikonę i styl dla ${sug.name}!`, 'info');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name.trim() || !formData.url.trim()) {
      addToast('Wprowadź nazwę usługi oraz poprawny adres URL', 'error');
      setActiveTab('basic');
      return;
    }

    setLoading(true);
    try {
      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim().toLowerCase().replace(/^#/, ''))
        .filter(Boolean);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        url: formData.url.trim(),
        category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
        icon: formData.icon || 'globe',
        color: formData.color || '#6366f1',
        open_new_tab: formData.open_new_tab ? 1 : 0,
        enabled: formData.enabled ? 1 : 0,
        favorite: formData.favorite ? 1 : 0,
        health_check_enabled: formData.health_check_enabled ? 1 : 0,
        health_check_type: formData.health_check_type || 'http',
        health_check_url: formData.health_check_url.trim(),
        health_check_interval: parseInt(formData.health_check_interval, 10) || 60,
        custom_badge: formData.custom_badge.trim(),
        tags: tagsArray,
        notes: formData.notes.trim()
      };

      if (isEdit) {
        await api.services.updateService(service.id, payload);
        addToast(`Zaktualizowano ${payload.name}`, 'success');
      } else {
        await api.services.createService(payload);
        addToast(`Dodano usługę ${payload.name}`, 'success');
      }
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.error || 'Wystąpił błąd podczas zapisywania', 'error');
    } finally {
      setLoading(false);
    }
  };

  const nextTab = () => {
    if (activeTab === 'basic') setActiveTab('appearance');
    else if (activeTab === 'appearance') setActiveTab('advanced');
  };

  const prevTab = () => {
    if (activeTab === 'advanced') setActiveTab('appearance');
    else if (activeTab === 'appearance') setActiveTab('basic');
  };

  return (
    <Modal
      title={isEdit ? `Edytuj: ${service?.name}` : '+ Dodaj aplikację'}
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Modern 3-Step Pill Tab Bar with Clear Active Contrast */}
        <div className="flex items-center p-1.5 rounded-2xl bg-black/[0.04] dark:bg-black/40 border border-black/[0.08] dark:border-white/10 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'basic'
                ? 'bg-accent text-white shadow-md shadow-accent/25 scale-[1.01]'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. Podstawowe</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'appearance'
                ? 'bg-accent text-white shadow-md shadow-accent/25 scale-[1.01]'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/5'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>2. Wygląd i Kolor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('advanced')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'advanced'
                ? 'bg-accent text-white shadow-md shadow-accent/25 scale-[1.01]'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/5'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>3. Monitoring & Opcje</span>
          </button>
        </div>

        {/* =========================================================
            TAB 1: PODSTAWOWE
           ========================================================= */}
        {activeTab === 'basic' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Auto Catalog Suggestion Pill */}
            {suggestion && (
              <div className="p-3 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Rozpoznano: <b>{suggestion.name}</b> (Katalog Homelabu)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => applySuggestion(suggestion)}
                  className="px-3 py-1 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  Użyj ikony i stylu ➔
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nazwa usługi *"
                name="name"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="np. Proxmox VE, Plex, Home Assistant"
                required
                autoFocus
              />

              <Input
                label="Adres URL / IP *"
                name="url"
                value={formData.url}
                onChange={handleChange}
                placeholder="https://192.168.1.10:8006 lub http://pve.lan"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-tight">
                  Kategoria
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full bg-black/[0.03] dark:bg-black/40 border border-black/[0.1] dark:border-white/15 focus:border-accent text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none"
                >
                  <option value="">Bez kategorii (Inne)</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-tight">
                  Ikona aplikacji
                </label>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm relative overflow-hidden"
                    style={{ backgroundColor: formData.color }}
                  >
                    <BrandIcon name={formData.icon} color="#ffffff" className="w-5 h-5 relative z-10" fallbackText={formData.name} />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowIconPicker(true)}
                    className="flex-1 text-xs py-2"
                  >
                    Wybierz ikonę z biblioteki
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-tight">
                Krótki opis
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                placeholder="np. Główny hiperwizor dla maszyn wirtualnych i kontenerów LXC"
                className="w-full bg-black/[0.03] dark:bg-black/40 border border-black/[0.1] dark:border-white/15 focus:border-accent text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none resize-none"
              />
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: WYGLĄD I KOLOR
           ========================================================= */}
        {activeTab === 'appearance' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2 tracking-tight">
                Kolor kafelka (Wybierz z palety lub podaj HEX)
              </label>
              <ColorPicker
                color={formData.color}
                onChange={(c) => setFormData(prev => ({ ...prev, color: c }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Input
                label="Własna plakietka / Badge (opcjonalnie)"
                name="custom_badge"
                value={formData.custom_badge}
                onChange={handleChange}
                placeholder="np. Node 01, DMZ, v2.0, Prod"
              />

              <Input
                label="Tagi (oddzielone przecinkami)"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="docker, monitoring, nas, pve"
              />
            </div>

            {/* iOS Style Switches for display options */}
            <div className="p-4 rounded-2xl glass-card space-y-3 mt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Opcje wyświetlania
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center justify-between p-2.5 rounded-xl glass-pill cursor-pointer hover:border-accent/30 transition-colors">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Włączona</span>
                  <input
                    type="checkbox"
                    name="enabled"
                    checked={formData.enabled}
                    onChange={handleChange}
                    className="w-4 h-4 rounded accent-accent cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl glass-pill cursor-pointer hover:border-accent/30 transition-colors">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Ulubiona ⭐</span>
                  <input
                    type="checkbox"
                    name="favorite"
                    checked={formData.favorite}
                    onChange={handleChange}
                    className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl glass-pill cursor-pointer hover:border-accent/30 transition-colors">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">W nowej karcie</span>
                  <input
                    type="checkbox"
                    name="open_new_tab"
                    checked={formData.open_new_tab}
                    onChange={handleChange}
                    className="w-4 h-4 rounded accent-accent cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 3: MONITORING & NOTATKI
           ========================================================= */}
        {activeTab === 'advanced' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Health Check Card */}
            <div className="p-4 rounded-2xl glass-card space-y-3.5 border border-black/[0.08] dark:border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Automatyczny Health Check (Monitoring pingu)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Bada dostępność hosta w tle i wyświetla czas odpowiedzi w milisekundach (ms).
                  </p>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="health_check_enabled"
                    checked={formData.health_check_enabled}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>

              {formData.health_check_enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-black/[0.05] dark:border-white/10 animate-in fade-in">
                  <Input
                    label="Alternatywny URL Health Check"
                    name="health_check_url"
                    value={formData.health_check_url}
                    onChange={handleChange}
                    placeholder="Domyślnie używa adresu usługi"
                  />

                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-tight">
                      Częstotliwość sprawdzania
                    </label>
                    <select
                      name="health_check_interval"
                      value={formData.health_check_interval}
                      onChange={handleChange}
                      className="w-full bg-black/[0.03] dark:bg-black/40 border border-black/[0.1] dark:border-white/15 focus:border-accent text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none"
                    >
                      <option value={30}>Co 30 sekund</option>
                      <option value={60}>Co 1 minutę</option>
                      <option value={120}>Co 2 minuty</option>
                      <option value={300}>Co 5 minut</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 tracking-tight">
                Prywatne notatki administratora (opcjonalnie)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="np. Domyślny login, podsieć VLAN, data ostatniej aktualizacji, klucze referencyjne"
                className="w-full bg-black/[0.03] dark:bg-black/40 border border-black/[0.1] dark:border-white/15 focus:border-accent text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none resize-none"
              />
            </div>
          </div>
        )}

        {/* Footer Navigation & Submit */}
        <div className="flex items-center justify-between pt-3 border-t border-black/[0.06] dark:border-white/10">
          <div>
            {activeTab !== 'basic' ? (
              <Button type="button" variant="ghost" size="sm" onClick={prevTab} className="text-xs">
                <ChevronLeft className="w-4 h-4 mr-1" /> Wstecz
              </Button>
            ) : (
              <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs">
                Anuluj
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeTab !== 'advanced' && (
              <Button type="button" variant="secondary" size="sm" onClick={nextTab} className="text-xs font-bold">
                Dalej <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}

            <Button
              type="submit"
              isLoading={loading}
              className="px-6 py-2 shadow-lg shadow-accent/25 text-xs font-bold"
            >
              {isEdit ? 'Zapisz zmiany' : 'Utwórz aplikację'}
            </Button>
          </div>
        </div>

      </form>

      {/* Icon Picker Dialog */}
      {showIconPicker && (
        <IconPicker
          selectedIcon={formData.icon}
          onSelect={(icon) => {
            setFormData(prev => ({ ...prev, icon }));
            setShowIconPicker(false);
          }}
          onClose={() => setShowIconPicker(false)}
        />
      )}
    </Modal>
  );
}
