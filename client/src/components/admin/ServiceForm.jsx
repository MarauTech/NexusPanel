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
import { Sparkles, Layers, Palette, Sliders, Activity, CheckCircle2, ChevronRight, Wand2, Radio } from 'lucide-react';

export default function ServiceForm({ service, onClose, onSuccess }) {
  const isEdit = !!service;
  const { categories } = useCategories();
  const { addToast } = useToast();
  const { t } = useLanguage();
  
  // Tab: 'basic' | 'appearance' | 'advanced'
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
      category_id: matchedCatId,
      custom_badge: sug.customBadge || prev.custom_badge,
      health_check_enabled: sug.healthCheck !== undefined ? sug.healthCheck : prev.health_check_enabled,
      tags: sug.tags ? sug.tags.join(', ') : prev.tags,
      url: prev.url ? prev.url : (sug.defaultPort ? `${sug.defaultProtocol || 'http'}://192.168.1.10:${sug.defaultPort}${sug.defaultPath || ''}` : '')
    }));

    setSuggestion(null);
    addToast(`Automatycznie skonfigurowano: ${sug.name}`, 'info');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast(t('form.name_required', 'Wpisz nazwę aplikacji'), 'error');
      return;
    }
    if (!formData.url.trim()) {
      addToast(t('form.url_required', 'Wpisz poprawny adres URL'), 'error');
      return;
    }

    setLoading(true);
    try {
      const tagList = formData.tags
        ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [];

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        url: formData.url.trim(),
        category_id: formData.category_id ? parseInt(formData.category_id, 10) : null,
        icon: formData.icon || 'globe',
        icon_type: 'lucide',
        icon_url: '',
        color: formData.color,
        open_new_tab: formData.open_new_tab ? 1 : 0,
        enabled: formData.enabled ? 1 : 0,
        favorite: formData.favorite ? 1 : 0,
        health_check_enabled: formData.health_check_enabled ? 1 : 0,
        health_check_type: formData.health_check_type || 'http',
        health_check_url: formData.health_check_url.trim(),
        health_check_interval: parseInt(formData.health_check_interval, 10) || 60,
        custom_badge: formData.custom_badge.trim(),
        tags: tagList,
        notes: formData.notes.trim()
      };

      if (isEdit) {
        await api.services.updateService(service.id, payload);
        addToast(t('form.saved', 'Zapisano zmiany'), 'success');
      } else {
        await api.services.createService(payload);
        addToast(t('form.created', 'Dodano nową aplikację'), 'success');
      }
      onSuccess();
    } catch (err) {
      addToast(err.response?.data?.error || t('common.error', 'Wystąpił błąd podczas zapisu'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      title={isEdit ? `Edytuj "${formData.name || 'Aplikację'}"` : t('dashboard.add_app', 'Dodaj nową aplikację')} 
      onClose={onClose}
      maxWidth="max-w-xl"
    >
      {/* Smart Auto-Detection Banner */}
      {suggestion && (
        <div className="p-3.5 rounded-2xl glass-pill bg-accent/15 border-accent/30 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white flex-shrink-0 shadow-sm" style={{ backgroundColor: suggestion.color }}>
              <BrandIcon name={suggestion.icon} color="#ffffff" className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs text-text-primary block truncate">
                Wykryto: {suggestion.name}
              </span>
              <span className="text-[10px] text-text-secondary">
                Automatycznie ustawia ikonę, port {suggestion.defaultPort || ''}, kolor i health check
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => applySuggestion(suggestion)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-accent text-white font-bold text-xs shadow-md shadow-accent/25 hover:scale-105 active:scale-95 transition-all flex-shrink-0"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Zastosuj</span>
          </button>
        </div>
      )}

      {/* Tabs Selector */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl glass-pill">
        <button
          type="button"
          onClick={() => setActiveTab('basic')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'basic' 
              ? 'bg-accent text-white shadow-md shadow-accent/25' 
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{t('form.tab_basic', 'Podstawowe')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appearance')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'appearance' 
              ? 'bg-accent text-white shadow-md shadow-accent/25' 
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>{t('form.tab_appearance', 'Wygląd')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('advanced')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'advanced' 
              ? 'bg-accent text-white shadow-md shadow-accent/25' 
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>{t('form.tab_advanced', 'Zaawansowane')}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ============================================
            TAB 1: BASIC SETTINGS
            ============================================ */}
        {activeTab === 'basic' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                label={t('form.name', 'Nazwa')}
                name="name" 
                value={formData.name} 
                onChange={handleNameChange} 
                required 
                placeholder="np. Proxmox VE, Plex, Home Assistant" 
              />
              <Input 
                label={t('form.url', 'Adres URL')}
                name="url" 
                value={formData.url} 
                onChange={handleChange} 
                required 
                placeholder="https://192.168.1.10:8006" 
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                label={t('form.category', 'Kategoria')}
                name="category_id" 
                type="select" 
                value={formData.category_id} 
                onChange={handleChange}
                options={[
                  { value: '', label: 'Bez kategorii (Inne)' },
                  ...categories.map(c => ({ value: c.id, label: c.name }))
                ]}
              />

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5 tracking-tight">Ikona aplikacji</label>
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-md flex-shrink-0"
                    style={{ backgroundColor: formData.color }}
                  >
                    <BrandIcon name={formData.icon} color="#ffffff" className="w-5 h-5" fallbackText={formData.name} />
                  </div>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setShowIconPicker(true)} className="flex-1">
                    {formData.icon ? `Ikona: ${formData.icon}` : 'Wybierz ikonę'}
                  </Button>
                </div>
              </div>
            </div>

            <Input 
              label={t('form.description', 'Krótki opis (opcjonalnie)')}
              name="description" 
              type="textarea" 
              value={formData.description} 
              onChange={handleChange} 
              placeholder="np. Główny węzeł wirtualizacji dla maszyn wirtualnych i kontenerów"
            />
          </div>
        )}

        {/* ============================================
            TAB 2: APPEARANCE & DISPLAY
            ============================================ */}
        {activeTab === 'appearance' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5 tracking-tight">Kolor kafelka</label>
              <ColorPicker color={formData.color} onChange={(c) => setFormData(prev => ({ ...prev, color: c }))} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                label="Własna plakietka / Badge (opcjonalnie)" 
                name="custom_badge" 
                value={formData.custom_badge} 
                onChange={handleChange} 
                placeholder="np. Node 01, DMZ, v2.0" 
              />
              <Input 
                label="Tagi (oddzielone przecinkami)" 
                name="tags" 
                value={formData.tags} 
                onChange={handleChange} 
                placeholder="docker, monitoring, nas" 
              />
            </div>

            <div className="p-4 rounded-2xl glass-pill space-y-3">
              <span className="font-bold text-xs text-text-primary block">Opcje wyświetlania</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" name="enabled" checked={formData.enabled} onChange={handleChange} className="rounded accent-accent" />
                  <span className="text-xs font-semibold text-text-primary">Włączona</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" name="favorite" checked={formData.favorite} onChange={handleChange} className="rounded accent-accent" />
                  <span className="text-xs font-semibold text-text-primary">Ulubiona ⭐</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" name="open_new_tab" checked={formData.open_new_tab} onChange={handleChange} className="rounded accent-accent" />
                  <span className="text-xs font-semibold text-text-primary">W nowej karcie</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ============================================
            TAB 3: HEALTH CHECK & ADVANCED
            ============================================ */}
        {activeTab === 'advanced' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-4 rounded-2xl glass-card space-y-3.5 border border-white/15">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-text-primary block">Automatyczny Health Check (Monitoring)</span>
                  <p className="text-[11px] text-text-secondary">Bada dostępność hosta w tle i wyświetla czas odpowiedzi ms</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="health_check_enabled" 
                    checked={formData.health_check_enabled} 
                    onChange={handleChange} 
                    className="rounded accent-accent w-4 h-4"
                  />
                  <span className="ml-2 text-xs font-bold text-text-primary">
                    {formData.health_check_enabled ? 'Aktywny' : 'Wyłączony'}
                  </span>
                </label>
              </div>

              {formData.health_check_enabled && (
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input 
                      label="Protokół sprawdzania" 
                      name="health_check_type" 
                      type="select" 
                      value={formData.health_check_type} 
                      onChange={handleChange}
                      options={[
                        { value: 'http', label: 'Żądanie HTTP / HTTPS (Strona WWW)' },
                        { value: 'ping', label: 'Ping TCP / Socket (np. switch, kamera, IP)' }
                      ]}
                    />
                    <Input 
                      label="Interwał badania (sekundy)" 
                      name="health_check_interval" 
                      type="number"
                      min="10"
                      max="3600"
                      value={formData.health_check_interval} 
                      onChange={handleChange} 
                    />
                  </div>

                  <Input 
                    label="Opcjonalny własny adres probe URL / IP" 
                    name="health_check_url" 
                    value={formData.health_check_url} 
                    onChange={handleChange} 
                    placeholder="Pozostaw puste, aby badać główny adres URL" 
                  />
                </div>
              )}
            </div>

            <Input 
              label="Prywatne notatki administratora (opcjonalnie)" 
              name="notes" 
              type="textarea"
              value={formData.notes} 
              onChange={handleChange} 
              placeholder="np. Domyślny login, podsieć VLAN, data ostatniej aktualizacji" 
            />
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-white/10">
          <div className="text-xs text-text-secondary">
            {activeTab === 'basic' && 'Krok 1 z 3 · Podstawowe'}
            {activeTab === 'appearance' && 'Krok 2 z 3 · Wygląd'}
            {activeTab === 'advanced' && 'Krok 3 z 3 · Monitoring i Notatki'}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Anuluj
            </Button>
            <Button type="submit" isLoading={loading}>
              {isEdit ? 'Zapisz zmiany' : 'Utwórz aplikację'}
            </Button>
          </div>
        </div>
      </form>

      {/* Nested Icon Picker Modal */}
      {showIconPicker && (
        <Modal title="Wybierz ikonę aplikacji" onClose={() => setShowIconPicker(false)}>
          <IconPicker 
            onSelect={(icon) => {
              setFormData(prev => ({ ...prev, icon }));
              setShowIconPicker(false);
            }} 
          />
        </Modal>
      )}
    </Modal>
  );
}
