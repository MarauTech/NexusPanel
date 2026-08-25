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
import { suggestIconForServiceName } from '../../data/homelabIconCatalog';
import { Sparkles, Layers, Palette, Sliders, Activity, CheckCircle2, ChevronRight, ChevronLeft, Image as ImageIcon } from 'lucide-react';

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
  const [userCustomizedIcon, setUserCustomizedIcon] = useState(false);

  useEffect(() => {
    if (service) {
      const tagString = Array.isArray(service.tags) 
        ? service.tags.map(t => (typeof t === 'string' ? t : t.name)).join(', ') 
        : '';
      
      setUserCustomizedIcon(true);
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

  // Real-time automatic icon suggestion on service name change
  const handleNameChange = (e) => {
    const val = e.target.value;
    setFormData(prev => {
      const updated = { ...prev, name: val };
      if (!userCustomizedIcon && val.trim().length >= 2) {
        const detected = suggestIconForServiceName(val);
        if (detected) {
          updated.icon = detected.slug;
          if (detected.color && prev.color === '#6366f1') {
            updated.color = detected.color;
          }
        }
      }
      return updated;
    });

    if (val.trim().length >= 2) {
      const detected = suggestIconForServiceName(val);
      if (detected) {
        setSuggestion(detected);
        return;
      }
    }
    setSuggestion(null);
  };

  const applySuggestion = (sug) => {
    let matchedCatId = formData.category_id;
    if (sug.category && categories.length > 0) {
      const foundCat = categories.find(c => c.name.toLowerCase().includes(sug.category.toLowerCase()));
      if (foundCat) matchedCatId = foundCat.id;
    }

    setFormData(prev => ({
      ...prev,
      name: sug.name || prev.name,
      icon: sug.slug || prev.icon,
      color: sug.color || prev.color,
      category_id: matchedCatId
    }));
    setUserCustomizedIcon(true);
    setSuggestion(null);
    addToast(`Przypisano oficjalną ikonę ${sug.name}`, 'info');
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
      addToast(t('form.validation_error', 'Wprowadź nazwę usługi oraz poprawny adres URL'), 'error');
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
        addToast(t('services.updated', `Zaktualizowano ${payload.name}`).replace('{name}', payload.name), 'success');
      } else {
        await api.services.createService(payload);
        addToast(t('services.created', `Dodano usługę ${payload.name}`).replace('{name}', payload.name), 'success');
      }
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      addToast(err.response?.data?.error || t('common.error', 'Wystąpił błąd podczas zapisywania'), 'error');
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
      title={isEdit ? t('form.edit_title', `Edytuj: ${service?.name}`).replace('{name}', service?.name) : t('form.add_title', '+ Dodaj aplikację')}
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Modern 3-Step Tab Bar matching dashboard filter tabs */}
        <div className="flex items-center p-1 rounded-lg bg-slate-100 dark:bg-[#18202d] border border-slate-300 dark:border-[#222d41] gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'basic'
                ? 'bg-white text-slate-900 border border-slate-300 dark:bg-[#1c2534] dark:text-white dark:border-[#2b394f] shadow-sm dark:shadow-none'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t('form.tab_basic', '1. Podstawowe')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'appearance'
                ? 'bg-white text-slate-900 border border-slate-300 dark:bg-[#1c2534] dark:text-white dark:border-[#2b394f] shadow-sm dark:shadow-none'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>{t('form.tab_appearance', '2. Wygląd i Kolor')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('advanced')}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'advanced'
                ? 'bg-white text-slate-900 border border-slate-300 dark:bg-[#1c2534] dark:text-white dark:border-[#2b394f] shadow-sm dark:shadow-none'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{t('form.tab_advanced', '3. Monitoring & Opcje')}</span>
          </button>
        </div>

        {/* =========================================================
            TAB 1: PODSTAWOWE
           ========================================================= */}
        {activeTab === 'basic' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Auto Catalog Suggestion Pill */}
            {suggestion && (
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#18202d] border border-blue-500/40 flex items-center justify-between gap-3 animate-in fade-in shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 rounded bg-white dark:bg-[#141b27] border border-slate-300 dark:border-[#222d41] flex items-center justify-center p-0.5 flex-shrink-0">
                    <BrandIcon name={suggestion.slug} className="w-4 h-4" fallbackText={suggestion.name} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-slate-900 dark:text-slate-100 font-bold truncate">
                      Rozpoznano: {suggestion.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Kategoria: {suggestion.category} · Oficjalna ikona SVG
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => applySuggestion(suggestion)}
                  className="px-3 py-1 bg-white hover:bg-slate-100 dark:bg-[#151c28] dark:hover:bg-[#1b2536] border border-slate-300 dark:border-[#212c3e] text-slate-900 dark:text-slate-100 text-xs font-semibold rounded-md transition-colors cursor-pointer shadow-xs flex-shrink-0"
                >
                  Użyj ➔
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('form.name', 'Nazwa usługi *')}
                name="name"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="np. Proxmox VE, Plex, Home Assistant, Pi-hole"
                required
                autoFocus
              />

              <Input
                label={t('form.url', 'Adres URL / IP *')}
                name="url"
                value={formData.url}
                onChange={handleChange}
                placeholder="https://192.168.1.10:8006 lub http://pve.lan"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-300 mb-1.5">
                  {t('form.category', 'Kategoria')}
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-[#18202d] border border-slate-300 dark:border-[#222d41] focus:border-blue-500 text-slate-900 dark:text-slate-200 rounded-md px-3 py-2 text-xs font-normal focus:outline-none shadow-xs dark:shadow-none"
                >
                  <option value="">{t('form.uncategorized', 'Bez kategorii (Inne)')}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-300 mb-1.5">
                  {t('form.icon', 'Ikona aplikacji')}
                </label>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-9 h-9 rounded-md bg-white dark:bg-[#192231] border border-slate-300 dark:border-[#222d41] flex items-center justify-center flex-shrink-0 p-1 shadow-xs"
                    title={formData.icon || 'Domyślna ikona'}
                  >
                    <BrandIcon name={formData.icon} color={formData.color} className="w-5 h-5" fallbackText={formData.name} />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowIconPicker(true)}
                    className="flex-1 text-xs font-medium justify-center"
                  >
                    {formData.icon ? `Zmień ikonę (${formData.icon.length > 18 ? formData.icon.slice(0, 15) + '...' : formData.icon})` : 'Wybierz ikonę z katalogu'}
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {t('form.description', 'Krótki opis')}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                placeholder="np. Główny hiperwizor dla maszyn wirtualnych i kontenerów LXC"
                className="w-full bg-white dark:bg-[#18202d] border border-slate-300 dark:border-[#222d41] focus:border-blue-500 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-md px-3 py-2 text-xs font-normal focus:outline-none resize-none shadow-sm dark:shadow-none"
              />
            </div>
          </div>
        )}

        {/* =========================================================
            TAB 2: WYGLĄD I KOLOR
           ========================================================= */}
        {activeTab === 'appearance' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('form.color', 'Kolor kafelka (Wybierz z palety lub podaj HEX)')}
              </label>
              <ColorPicker
                color={formData.color}
                onChange={(c) => setFormData(prev => ({ ...prev, color: c }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <Input
                label={t('form.custom_badge', 'Własna plakietka / Badge (opcjonalnie)')}
                name="custom_badge"
                value={formData.custom_badge}
                onChange={handleChange}
                placeholder="np. Node 01, DMZ, v2.0, Prod"
              />

              <Input
                label={t('form.tags', 'Tagi (oddzielone przecinkami)')}
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="docker, monitoring, nas, pve"
              />
            </div>

            {/* Display Options Container */}
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1d2635] space-y-2.5 shadow-sm dark:shadow-none">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400">
                {t('form.display_options', 'Opcje wyświetlania')}
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <label className="flex items-center justify-between p-2.5 rounded-md bg-white dark:bg-[#18202d] border border-slate-200 dark:border-[#202c3e] cursor-pointer hover:border-slate-300 dark:hover:border-[#2f3d56] transition-colors shadow-sm dark:shadow-none">
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    {t('form.enabled', 'Włączona')}
                  </span>
                  <input
                    type="checkbox"
                    name="enabled"
                    checked={formData.enabled}
                    onChange={handleChange}
                    className="w-4 h-4 rounded accent-blue-600 dark:accent-blue-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-md bg-white dark:bg-[#18202d] border border-slate-200 dark:border-[#202c3e] cursor-pointer hover:border-slate-300 dark:hover:border-[#2f3d56] transition-colors shadow-sm dark:shadow-none">
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    {t('form.favorite', 'Ulubiona ⭐')}
                  </span>
                  <input
                    type="checkbox"
                    name="favorite"
                    checked={formData.favorite}
                    onChange={handleChange}
                    className="w-4 h-4 rounded accent-amber-500 dark:accent-amber-400 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-md bg-white dark:bg-[#18202d] border border-slate-200 dark:border-[#202c3e] cursor-pointer hover:border-slate-300 dark:hover:border-[#2f3d56] transition-colors shadow-sm dark:shadow-none">
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    {t('form.open_new_tab', 'W nowej karcie')}
                  </span>
                  <input
                    type="checkbox"
                    name="open_new_tab"
                    checked={formData.open_new_tab}
                    onChange={handleChange}
                    className="w-4 h-4 rounded accent-blue-600 dark:accent-blue-500 cursor-pointer"
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
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Health Check Card */}
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1d2635] space-y-3 shadow-sm dark:shadow-none">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {t('form.health_check', 'Automatyczny Health Check (Monitoring pingu)')}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('form.health_check_desc', 'Bada dostępność hosta w tle i wyświetla czas odpowiedzi w milisekundach (ms).')}
                  </p>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="health_check_enabled"
                    checked={formData.health_check_enabled}
                    onChange={handleChange}
                    className="w-4 h-4 rounded accent-blue-600 dark:accent-blue-500 cursor-pointer"
                  />
                </label>
              </div>

              {formData.health_check_enabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-[#1c2534] animate-in fade-in">
                  <Input
                    label={t('form.alt_health_url', 'Alternatywny URL Health Check')}
                    name="health_check_url"
                    value={formData.health_check_url}
                    onChange={handleChange}
                    placeholder={t('form.alt_health_url_placeholder', 'Domyślnie używa adresu usługi')}
                  />

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      {t('form.check_interval', 'Częstotliwość sprawdzania')}
                    </label>
                    <select
                      name="health_check_interval"
                      value={formData.health_check_interval}
                      onChange={handleChange}
                      className="w-full bg-white dark:bg-[#18202d] border border-slate-300 dark:border-[#222d41] focus:border-blue-500 text-slate-900 dark:text-slate-200 rounded-md px-3 py-2 text-xs font-normal focus:outline-none shadow-sm dark:shadow-none"
                    >
                      <option value={30}>{t('form.interval_30s', 'Co 30 sekund')}</option>
                      <option value={60}>{t('form.interval_1m', 'Co 1 minutę')}</option>
                      <option value={120}>{t('form.interval_2m', 'Co 2 minuty')}</option>
                      <option value={300}>{t('form.interval_5m', 'Co 5 minut')}</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {t('form.notes', 'Prywatne notatki administratora (opcjonalnie)')}
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder={t('form.notes_placeholder', 'np. Domyślny login, podsieć VLAN, data ostatniej aktualizacji, klucze referencyjne')}
                className="w-full bg-white dark:bg-[#18202d] border border-slate-300 dark:border-[#222d41] focus:border-blue-500 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-md px-3 py-2 text-xs font-normal focus:outline-none resize-none shadow-sm dark:shadow-none"
              />
            </div>
          </div>
        )}

        {/* Footer Navigation & Submit */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-[#1c2534]">
          <div>
            {activeTab !== 'basic' ? (
              <Button type="button" variant="ghost" size="sm" onClick={prevTab} className="text-xs">
                <ChevronLeft className="w-4 h-4 mr-1" /> {t('common.back', 'Wstecz')}
              </Button>
            ) : (
              <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs">
                {t('common.cancel', 'Anuluj')}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeTab !== 'advanced' && (
              <Button type="button" variant="secondary" size="sm" onClick={nextTab} className="text-xs font-medium">
                {t('common.next', 'Dalej')} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}

            <Button
              type="submit"
              isLoading={loading}
              size="sm"
              className="px-5 py-1.5 text-xs font-medium"
            >
              {isEdit ? t('form.save_changes', 'Zapisz zmiany') : t('form.create', 'Utwórz aplikację')}
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
