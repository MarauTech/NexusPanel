import React, { useState, useMemo } from 'react';
import { useServices } from '../hooks/useServices';
import { useCategories } from '../hooks/useCategories';
import { useSettings } from '../hooks/useSettings';
import { useLanguage } from '../contexts/LanguageContext';
import EmptyState from '../components/dashboard/EmptyState';
import FavoritesSection from '../components/dashboard/FavoritesSection';
import CategorySection from '../components/dashboard/CategorySection';
import GlobalStatusStrip from '../components/dashboard/GlobalStatusStrip';
import SystemOverviewWidget from '../components/dashboard/SystemOverviewWidget';
import ProxmoxOverviewWidget from '../components/dashboard/ProxmoxOverviewWidget';
import RecentActivityWidget from '../components/dashboard/RecentActivityWidget';
import SkeletonCard from '../components/common/SkeletonCard';
import ServiceForm from '../components/admin/ServiceForm';
import NetworkDiscoveryModal from '../components/scanner/NetworkDiscoveryModal';
import { LayoutGrid, Star, Plus, Radar, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import Button from '../components/common/Button';

export default function Dashboard() {
  const { services, loading: servicesLoading, refresh: refreshServices } = useServices();
  const { categories, loading: categoriesLoading } = useCategories();
  const { settings } = useSettings();
  const { t } = useLanguage();
  
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'online' | 'offline' | 'issues'
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  // Transform flat API data into structured format for components
  const enrichedServices = useMemo(() => {
    return services.map(svc => ({
      ...svc,
      category: svc.category_id ? { 
        id: svc.category_id, 
        name: svc.category_name || t('dashboard.other_services', 'Inne') 
      } : null,
      status: svc.health_status || 'unknown',
      openInNewTab: svc.open_new_tab === 1 || svc.open_new_tab === true,
    }));
  }, [services, t]);

  // Real-time filtering by category, status & search query
  const filteredServicesList = useMemo(() => {
    let list = enrichedServices.filter(s => s.enabled !== 0 && s.enabled !== false);
    
    // Status filter
    if (statusFilter === 'online') {
      list = list.filter(s => s.health_status === 'online');
    } else if (statusFilter === 'offline') {
      list = list.filter(s => s.health_status === 'offline');
    } else if (statusFilter === 'issues') {
      list = list.filter(s => s.health_status === 'offline' || s.health_status === 'degraded');
    }

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
  }, [enrichedServices, searchQuery, statusFilter]);

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
          category: { id: svc.category_id, name: svc.category_name || 'Category', color: svc.color || '#6366f1' },
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
      <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1920px] mx-auto space-y-6">
        <div className="h-14 rounded-2xl glass-card animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </div>
          <div className="lg:col-span-4 space-y-4">
            <div className="h-48 rounded-2xl glass-card animate-pulse" />
            <div className="h-36 rounded-2xl glass-card animate-pulse" />
          </div>
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 w-full max-w-[1920px] mx-auto animate-in fade-in duration-200">
      
      {/* 1. Sleek Startpage Speed-Dial Hero Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-1 border-b border-black/[0.05] dark:border-white/[0.06] pb-3">
        {/* Title / Subtitle */}
        <div className="text-left">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {settings?.user_name ? `${t('dashboard.greeting', 'Witaj')}, ${settings.user_name}` : t('dashboard.welcome', 'Witaj w NexusPanel')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            {t('dashboard.subtitle', 'Twój szybki ekran startowy — przechodź natychmiast do swoich aplikacji i usług.')}
          </p>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
          <Button
            variant="secondary"
            icon={Radar}
            onClick={() => setIsScanModalOpen(true)}
            className="flex-1 sm:flex-none glass-card hover:border-accent/40 text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            {t('dashboard.btn_scan', 'Skanuj sieć LAN')}
          </Button>

          <Button
            icon={Plus}
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-none shadow-md shadow-accent/25 text-xs font-bold text-white bg-accent hover:bg-accent-hover"
          >
            {t('dashboard.add_app', 'Dodaj aplikację')}
          </Button>
        </div>
      </div>

      {/* 2. Compact Global Status Strip */}
      <GlobalStatusStrip services={enrichedServices} />

      {/* 3. 2-Column Responsive Layout: Left ~68% Services & Categories, Right ~32% System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full pt-1">
        
        {/* ============================================
            LEFT COLUMN: FILTERS, FAVORITES & CATEGORIES
            ============================================ */}
        <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 space-y-5 min-w-0">
          
          {/* Dual Filter Bar: Category Tabs + Status Chips */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
            {/* Category Filter Capsules */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full sm:w-auto">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex-shrink-0 ${
                  selectedFilter === 'all'
                    ? 'bg-accent text-white shadow-md shadow-accent/25 scale-[1.02]'
                    : 'glass-pill text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{t('dashboard.all_services', 'Wszystko')}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                  {enrichedServices.filter(s => s.enabled !== 0).length}
                </span>
              </button>

              {favorites.length > 0 && (
                <button
                  onClick={() => setSelectedFilter('favorites')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex-shrink-0 ${
                    selectedFilter === 'favorites'
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-[1.02]'
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex-shrink-0 ${
                    selectedFilter === String(category.id)
                      ? 'bg-accent text-white shadow-md shadow-accent/25 scale-[1.02]'
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex-shrink-0 ${
                    selectedFilter === 'other'
                      ? 'bg-accent text-white shadow-md shadow-accent/25 scale-[1.02]'
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

            {/* Right: Quick Status Chips */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] text-[11px] self-end sm:self-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                  statusFilter === 'all' 
                    ? 'bg-black/[0.08] dark:bg-white/15 text-slate-900 dark:text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                {t('filter.all_statuses', 'Wszystkie')}
              </button>
              <button
                onClick={() => setStatusFilter('online')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold transition-all ${
                  statusFilter === 'online' 
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                    : 'text-slate-500 hover:text-emerald-500'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Online
              </button>
              <button
                onClick={() => setStatusFilter('offline')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold transition-all ${
                  statusFilter === 'offline' 
                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30' 
                    : 'text-slate-500 hover:text-rose-500'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Offline
              </button>
              <button
                onClick={() => setStatusFilter('issues')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold transition-all ${
                  statusFilter === 'issues' 
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30' 
                    : 'text-slate-500 hover:text-amber-500'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Problemy
              </button>
            </div>
          </div>

          {/* Pinned Favorites Section */}
          {showFavorites && (
            <FavoritesSection 
              favorites={favorites} 
              onFavoriteToggle={handleFavoriteToggle}
            />
          )}

          {/* Categorized Service Sections */}
          {filteredCategories.map(({ category, services: catServices }) => (
            <CategorySection
              key={category.id}
              category={category}
              services={catServices}
              onFavoriteToggle={handleFavoriteToggle}
            />
          ))}

          {/* Uncategorized Services Section */}
          {showOther && (
            <CategorySection
              category={{ 
                id: 'other', 
                name: t('dashboard.other_services', 'Inne usługi'), 
                icon: 'folder', 
                color: '#6366f1' 
              }}
              services={other}
              onFavoriteToggle={handleFavoriteToggle}
            />
          )}

          {/* Filter Empty State */}
          {filteredCategories.length === 0 && !showFavorites && !showOther && (
            <div className="p-8 text-center glass-card rounded-2xl space-y-2">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                {t('filter.no_results', 'Brak usług spełniających wybrane filtry')}
              </p>
              <button
                onClick={() => { setSelectedFilter('all'); setStatusFilter('all'); }}
                className="text-xs text-accent font-bold hover:underline"
              >
                {t('filter.reset', 'Zresetuj filtry')}
              </button>
            </div>
          )}
        </div>

        {/* ============================================
            RIGHT COLUMN: DASHBOARD STATUS / SYSTEM OVERVIEW
            ============================================ */}
        <div className="lg:col-span-4 xl:col-span-4 2xl:col-span-3 space-y-4 lg:sticky lg:top-5">
          <SystemOverviewWidget 
            services={enrichedServices} 
            onRefreshServices={refreshServices} 
          />
          <ProxmoxOverviewWidget />
          <RecentActivityWidget services={enrichedServices} />
        </div>

      </div>

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
