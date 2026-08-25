import React, { useState, useMemo, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import { Search, X, Upload, Check, Sparkles, Grid, Folder, Image, ArrowRight } from 'lucide-react';
import Modal from './Modal';
import BrandIcon from './BrandIcon';
import Button from './Button';
import { ICON_CATEGORIES, HOMELAB_CATALOG_ITEMS, searchIconCatalog } from '../../data/homelabIconCatalog';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';

const LUCIDE_NAMES = Object.keys(LucideIcons).filter(name => 
  (typeof LucideIcons[name] === 'object' || typeof LucideIcons[name] === 'function') && 
  name !== 'createLucideIcon' && 
  name !== 'default' &&
  !name.endsWith('Icon')
);

export default function IconPicker({ selectedIcon = '', onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all'); // category id, 'custom', or 'lucide'
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(selectedIcon && selectedIcon.startsWith('/uploads/') ? selectedIcon : '');
  const fileInputRef = useRef(null);

  const { t } = useLanguage();
  const { addToast } = useToast();

  // Filter homelab catalog
  const filteredHomelab = useMemo(() => {
    if (activeCategory === 'lucide' || activeCategory === 'custom') return [];
    return searchIconCatalog(search, activeCategory);
  }, [search, activeCategory]);

  // Filter Lucide icons
  const filteredLucide = useMemo(() => {
    if (activeCategory !== 'lucide' && activeCategory !== 'all') return [];
    const q = search.toLowerCase().trim();
    if (!q) return LUCIDE_NAMES.slice(0, 160);
    return LUCIDE_NAMES.filter(name => name.toLowerCase().includes(q)).slice(0, 160);
  }, [search, activeCategory]);

  const handleSelect = (iconSlugOrUrl) => {
    if (onSelect) onSelect(iconSlugOrUrl);
    if (onClose) onClose();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast('Maksymalny rozmiar pliku ikony to 5 MB', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data && res.data.url) {
        setUploadedUrl(res.data.url);
        addToast('Pomyślnie przesłano własną ikonę', 'success');
        handleSelect(res.data.url);
      }
    } catch (err) {
      addToast(err.response?.data?.error || 'Nie udało się przesłać ikony', 'error');
    } finally {
      setUploading(false);
    }
  };

  const content = (
    <div className="flex flex-col space-y-3.5">
      {/* Search Input Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="text"
          className="w-full bg-white dark:bg-[#18202d] border border-slate-300 dark:border-[#222d41] text-slate-900 dark:text-slate-200 text-xs rounded-md pl-9 pr-9 py-2.5 focus:outline-none focus:border-blue-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium shadow-xs dark:shadow-none"
          placeholder="Szukaj ikony (np. Plex, TrueNAS, Proxmox, Docker, WireGuard, Nginx)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Horizontally Scrollable Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 border-b border-slate-200 dark:border-[#1c2534] scrollbar-none">
        {ICON_CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white shadow-xs'
                  : 'bg-white dark:bg-[#18202d] text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-[#222d41] hover:bg-slate-100 dark:hover:bg-[#202b3d]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}

        {/* Lucide Tab */}
        <button
          type="button"
          onClick={() => setActiveCategory('lucide')}
          className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeCategory === 'lucide'
              ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white shadow-xs'
              : 'bg-white dark:bg-[#18202d] text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-[#222d41] hover:bg-slate-100 dark:hover:bg-[#202b3d]'
          }`}
        >
          <Grid className="w-3 h-3" />
          <span>Ikony Lucide</span>
        </button>

        {/* Custom Icon Tab */}
        <button
          type="button"
          onClick={() => setActiveCategory('custom')}
          className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            activeCategory === 'custom'
              ? 'bg-slate-900 text-white dark:bg-blue-600 dark:text-white shadow-xs'
              : 'bg-white dark:bg-[#18202d] text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-[#222d41] hover:bg-slate-100 dark:hover:bg-[#202b3d]'
          }`}
        >
          <Upload className="w-3 h-3" />
          <span>Własna ikona</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="max-h-[55vh] overflow-y-auto custom-scrollbar p-1">
        
        {/* TAB: Custom Icon Upload */}
        {activeCategory === 'custom' && (
          <div className="space-y-4 p-4 rounded-lg bg-slate-50 dark:bg-[#141b27] border border-slate-300 dark:border-[#1d2635]">
            <div className="text-center space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200">
                Prześlij własną ikonę (SVG / PNG)
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Możesz przesłać oficjalne logo usługi w formacie SVG lub przezroczysty plik PNG.
              </p>
            </div>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-[#2b384e] hover:border-blue-500 dark:hover:border-blue-400 rounded-lg p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer bg-white dark:bg-[#18202d] transition-colors"
            >
              <Upload className="w-8 h-8 text-slate-400" />
              <div className="text-center">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {uploading ? 'Wysyłanie pliku...' : 'Kliknij, aby wybrać plik SVG lub PNG'}
                </span>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">Maks. 5 MB · SVG, PNG, WEBP</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".svg,image/svg+xml,.png,image/png,.webp,image/webp"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </div>

            {/* Current Custom Icon Preview */}
            {uploadedUrl && (
              <div className="flex items-center justify-between p-3 rounded-md bg-white dark:bg-[#18202d] border border-slate-300 dark:border-[#222d41]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-slate-100 dark:bg-[#141b27] border border-slate-300 dark:border-[#222d41] flex items-center justify-center p-1">
                    <img src={uploadedUrl} alt="Custom" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-200">Własna ikona przesłana</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate max-w-[220px]">{uploadedUrl}</div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => handleSelect(uploadedUrl)}
                  className="text-xs"
                >
                  Wybierz tę ikonę
                </Button>
              </div>
            )}
          </div>
        )}

        {/* TAB: Homelab Catalog Icons */}
        {activeCategory !== 'custom' && activeCategory !== 'lucide' && (
          <div>
            {filteredHomelab.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {filteredHomelab.map(item => {
                  const isSelected = selectedIcon === item.slug || selectedIcon === item.icon;
                  return (
                    <button
                      key={item.slug}
                      type="button"
                      onClick={() => handleSelect(item.slug)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg text-left transition-all border cursor-pointer group ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                          : 'bg-white dark:bg-[#18202d] border-slate-300 dark:border-[#202c3e] hover:border-slate-400 dark:hover:border-[#2f3d56] shadow-xs hover:shadow'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-md bg-slate-50 dark:bg-[#141b27] border border-slate-300 dark:border-[#222d41] flex items-center justify-center flex-shrink-0 p-1 group-hover:border-slate-400 transition-colors">
                        <BrandIcon name={item.slug} className="w-6 h-6" fallbackText={item.name} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">
                          {item.slug}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex-shrink-0 text-blue-600 dark:text-blue-400">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400 text-xs">
                Nie znaleziono pasujących ikon w katalogu homelabu.
              </div>
            )}
          </div>
        )}

        {/* TAB: Generic Lucide Icons */}
        {activeCategory === 'lucide' && (
          <div>
            {filteredLucide.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {filteredLucide.map(name => {
                  const Icon = LucideIcons[name];
                  const isSelected = selectedIcon === name;
                  if (!Icon) return null;

                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleSelect(name)}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'bg-white dark:bg-[#18202d] border-slate-300 dark:border-[#202c3e] hover:border-slate-400 dark:hover:border-[#2f3d56] text-slate-700 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 shadow-xs'
                      }`}
                      title={name}
                    >
                      <Icon className="w-4 h-4 mb-1 flex-shrink-0" />
                      <span className="text-[9px] truncate w-full text-center font-mono opacity-80">
                        {name}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">
                Nie znaleziono pasujących ikon Lucide.
              </div>
            )}
          </div>
        )}

      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#1c2534] text-[11px] font-mono text-slate-500">
        <span>Wybrana ikona: <strong className="text-slate-800 dark:text-slate-200">{selectedIcon || 'Brak (Domyślna)'}</strong></span>
        {onClose && (
          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Zamknij
          </Button>
        )}
      </div>
    </div>
  );

  // If onClose is passed, wrap in Modal popup dialog
  if (onClose) {
    return (
      <Modal title="Katalog Oficjalnych Ikon Homelabu" onClose={onClose} maxWidth="max-w-4xl">
        {content}
      </Modal>
    );
  }

  return content;
}
