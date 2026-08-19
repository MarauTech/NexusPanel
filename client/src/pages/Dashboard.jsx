import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useServices } from '../hooks/useServices';
import { useCategories } from '../hooks/useCategories';
import { useSettings } from '../hooks/useSettings';
import { useLanguage } from '../contexts/LanguageContext';
import EmptyState from '../components/dashboard/EmptyState';
import FavoritesSection from '../components/dashboard/FavoritesSection';
import CategorySection from '../components/dashboard/CategorySection';
import SkeletonCard from '../components/common/SkeletonCard';
import ServiceForm from '../components/admin/ServiceForm';
import NetworkDiscoveryModal from '../components/scanner/NetworkDiscoveryModal';
import { LayoutGrid, Star, Plus, Radar } from 'lucide-react';
import Button from '../components/common/Button';

export default function Dashboard() {
  const { services, loading: servicesLoading, refresh: refreshServices } = useServices();
  const { categories, loading: categoriesLoading } = useCategories();
  const { settings } = useSettings();
  const { t } = useLanguage();
  
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  const searchInputRef = useRef(null);

  // Global Ctrl+K shortcut focus search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Transform flat API data into structured format for components
  const enrichedServices = useMemo(() => {
    return services.map(svc => ({
      ...svc,
      category: svc.category_id ? { 
        id: svc.category_id, 
        name: svc.category_name || 'Bez kategorii' 
      } : null,
      status: svc.health_status || 'unknown',
      openInNewTab: svc.open_new_tab === 1 || svc.open_new_tab === true,
    }));
  }, [services]);

  // Real-time filtering by search query & categories
  const filteredServicesList = useMemo(() => {
    let list = enrichedServices.filter(s => s.enabled !== 0 && s.enabled !== false);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => 
        s.name.toLowerCase().includes(q) ||
        (s.url && s.url.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.category_name && s.category_name.toLowerCase().includes(q)) ||
        (s.custom_badge && s.custom_badge.toLowerCase().includes(q)) ||
        (Array.isArray(s.tags) && s.tags.some(t => (typeof t === 'string' ? t : t.name).toLowerCase().includes(q)))
      );
    }
    return list;
  }, [enrichedServices, searchQuery]);

  const { favorites, categorized, other } = useMemo(() => {
    const favs = [];
    const catMap = {};
    const oth = [];

    categories.forEach(cat => {
      catMap[cat.id] = { category: cat, services: [] };
    });

    filteredServicesList.forEach(svc => {
      if (svc.favorite === 1 || svc.favorite === true) favs.push(svc);

      if (svc.category_id && catMap[svc.category_id]) {
        catMap[svc.category_id].services.push(svc);
      } else if (svc.category_id) {
        catMap[svc.category_id] = {
          category: { id: svc.category_id, name: svc.category_name || 'Kategoria', color: svc.color || '#6366f1' },
          services: [svc]
        };
      } else {
        oth.push(svc);
      }
    });

    const populatedCategories = Object.values(catMap).filter(item => item.services.length > 0);

    return { 
      favorites: favs, 
      categorized: populatedCategories, 
      other: oth 
    };
  }, [filteredServicesList, categories]);

  const handleFavoriteToggle = () => {
    refreshServices();
  };

  if (servicesLoading || categoriesLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        <div className="h-16 rounded-[24px] glass-card animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <>
        <EmptyState 
          onRefresh={refreshServices} 
          onOpenScanner={() => setIsScanModalOpen(true)}
          onOpenAddModal={() => setIsAddModalOpen(true)}
        />
        {isScanModalOpen && (
          <NetworkDiscoveryModal
            onClose={() => setIsScanModalOpen(false)}
            onSuccess={() => {
              setIsScanModalOpen(false);
              refreshServices();
            }}
          />
        )}
        {isAddModalOpen && (
          <ServiceForm
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={() => {
              setIsAddModalOpen(false);
              refreshServices();
            }}
          />
        )}
      </>
    );
  }

  // Filter categories based on segment capsule selection
  const filteredCategories = selectedFilter === 'all' 
    ? categorized 
    : selectedFilter === 'favorites' 
      ? [] 
      : categorized.filter(c => String(c.category.id) === String(selectedFilter));

  const showFavorites = (selectedFilter === 'all' || selectedFilter === 'favorites') && favorites.length > 0;
  const showOther = (selectedFilter === 'all' || selectedFilter === 'other') && other.length > 0;

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      
      {/* 1. Sleek Startpage Speed-Dial Hero Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-2 border-b border-black/[0.05] dark:border-white/[0.06] pb-4">
        
        {/* Title / Subtitle with High-Contrast Theming */}
        <div className="text-left">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {settings?.user_name ? `Witaj, ${settings.user_name}` : t('dashboard.welcome', 'Witaj w NexusPanel')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium">
            {t('dashboard.subtitle', 'Twój szybki ekran startowy — przechodź natychmiast do swoich aplikacji i usług.')}
          </p>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap sm:flex-nowrap">
          <Button
            variant="secondary"
            icon={Radar}
            onClick={() => setIsScanModalOpen(true)}
            className="flex-1 sm:flex-none glass-card hover:border-accent/40 text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            Skanuj sieć LAN ⚡
          </Button>

          <Button
            icon={Plus}
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-none shadow-lg shadow-accent/25 text-xs font-bold text-white bg-accent hover:bg-accent-hover"
          >
            {t('dashboard.add_app', '+ Dodaj aplikację')}
          </Button>
        </div>
      </div>

      {/* 2. Segmented Category Filter Capsule Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 flex-shrink-0 ${
            selectedFilter === 'all'
              ? 'bg-accent text-white shadow-lg shadow-accent/25 scale-[1.02]'
              : 'glass-pill text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>{t('dashboard.all_services', 'Wszystkie aplikacje')}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
            {enrichedServices.filter(s => s.enabled !== 0).length}
          </span>
        </button>

        {favorites.length > 0 && (
          <button
            onClick={() => setSelectedFilter('favorites')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 flex-shrink-0 ${
              selectedFilter === 'favorites'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25 scale-[1.02]'
                : 'glass-pill text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{t('dashboard.favorites', 'Ulubione')}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
              {favorites.length}
            </span>
          </button>
        )}

        {categorized.map(({ category, services: catServices }) => (
          <button
            key={category.id}
            onClick={() => setSelectedFilter(String(category.id))}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 flex-shrink-0 ${
              selectedFilter === String(category.id)
                ? 'bg-accent text-white shadow-lg shadow-accent/25 scale-[1.02]'
                : 'glass-pill text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>{category.name}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
              {catServices.length}
            </span>
          </button>
        ))}

        {other.length > 0 && (
          <button
            onClick={() => setSelectedFilter('other')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 flex-shrink-0 ${
              selectedFilter === 'other'
                ? 'bg-accent text-white shadow-lg shadow-accent/25 scale-[1.02]'
                : 'glass-pill text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>{t('dashboard.other_services', 'Inne')}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
              {other.length}
            </span>
          </button>
        )}
      </div>

      {/* 3. Favorites Section (if any & selected) */}
      {showFavorites && (
        <FavoritesSection 
          favorites={favorites} 
          gridCols={settings?.grid_columns || '4'}
          gridGap={settings?.grid_gap || '16'}
          onFavoriteToggle={handleFavoriteToggle}
        />
      )}

      {/* 4. Categorized Service Sections */}
      {filteredCategories.map(({ category, services: catServices }) => (
        <CategorySection
          key={category.id}
          category={category}
          services={catServices}
          gridCols={settings?.grid_columns || '4'}
          gridGap={settings?.grid_gap || '16'}
          onFavoriteToggle={handleFavoriteToggle}
        />
      ))}

      {/* 5. Uncategorized Services Section */}
      {showOther && (
        <CategorySection
          category={{ 
            id: 'other', 
            name: t('dashboard.other_services', 'Inne usługi'), 
            icon: 'folder', 
            color: '#6366f1' 
          }}
          services={other}
          gridCols={settings?.grid_columns || '4'}
          gridGap={settings?.grid_gap || '16'}
          onFavoriteToggle={handleFavoriteToggle}
        />
      )}

      {/* Modal Dialogs */}
      {isAddModalOpen && (
        <ServiceForm
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            refreshServices();
          }}
        />
      )}

      {isScanModalOpen && (
        <NetworkDiscoveryModal
          onClose={() => setIsScanModalOpen(false)}
          onSuccess={() => {
            setIsScanModalOpen(false);
            refreshServices();
          }}
        />
      )}

    </div>
  );
}
