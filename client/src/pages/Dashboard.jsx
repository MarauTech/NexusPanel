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
import ServiceDetailsDrawer from '../components/dashboard/ServiceDetailsDrawer';
import NetworkDiscoveryModal from '../components/scanner/NetworkDiscoveryModal';
import WidgetGrid from '../components/widgets/WidgetGrid';
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
  const [selectedServiceForDrawer, setSelectedServiceForDrawer] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

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
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-5 w-full max-w-[1920px] mx-auto animate-in fade-in duration-200">
      
      {/* 1. Sleek Technical Hero Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-300 dark:border-[#1c2534]">
        {/* Title / Subtitle */}
        <div className="text-left">
          <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {settings?.user_name ? `${t('dashboard.greeting', 'Witaj')}, ${settings.user_name}` : t('dashboard.welcome', 'Witaj w NexusPanel')}
          </h1>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="secondary"
            size="sm"
            icon={Radar}
            onClick={() => setIsScanModalOpen(true)}
            className="flex-1 sm:flex-initial justify-center text-xs"
          >
            {t('dashboard.btn_scan', 'Skanuj sieć LAN')}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-initial justify-center text-xs"
          >
            {t('dashboard.add_app', 'Dodaj aplikację')}
          </Button>
        </div>
      </div>

      {/* 2. Homelab Widgets Grid */}
      <WidgetGrid />

      {/* 3. Compact Global Status Strip */}
      <div className="mb-1">
        <GlobalStatusStrip services={enrichedServices} />
      </div>

      {/* 4. 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start w-full pt-1">
        
        {/* ============================================
            LEFT COLUMN: FILTERS, FAVORITES & CATEGORIES
            ============================================ */}
        <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 space-y-4 min-w-0">
          
          {/* Dual Filter Bar: Category Tabs + Status Chips */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
            {/* Category Filter Tabs (Scrollable on touch/small screens) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 w-full md:w-auto -mx-1 px-1 sm:mx-0 sm:px-0">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all flex-shrink-0 cursor-pointer shadow-xs ${
                  selectedFilter === 'all'
                    ? 'bg-slate-900 text-white font-semibold border border-slate-900 dark:bg-[#1c2534] dark:text-white dark:border-[#2b394f]'
                    : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium border border-slate-300 dark:bg-[#141b27] dark:text-slate-400 dark:hover:text-slate-200 dark:border-[#1d2635]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{t('dashboard.all_services', 'Wszystko')}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  selectedFilter === 'all' ? 'bg-slate-800 text-slate-200 dark:bg-slate-800' : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-[#1c2534] dark:text-slate-400 dark:border-transparent'
                }`}>
                  {enrichedServices.filter(s => s.enabled !== 0).length}
                </span>
              </button>

              {favorites.length > 0 && (
                <button
                  onClick={() => setSelectedFilter('favorites')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all flex-shrink-0 cursor-pointer shadow-xs ${
                    selectedFilter === 'favorites'
                      ? 'bg-amber-500 text-white font-semibold border border-amber-600 dark:bg-[#1c2534] dark:text-amber-400 dark:border-amber-500/30'
                      : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium border border-slate-300 dark:bg-[#141b27] dark:text-slate-400 dark:hover:text-slate-200 dark:border-[#1d2635]'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${selectedFilter === 'favorites' ? 'fill-white' : 'fill-amber-400/20 text-amber-500'}`} />
                  <span>{t('dashboard.favorites', 'Ulubione')}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    selectedFilter === 'favorites' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-[#1c2534] dark:text-slate-400 dark:border-transparent'
                  }`}>
                    {favorites.length}
                  </span>
                </button>
              )}

              {categorized.map(({ category, services: catServices }) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedFilter(String(category.id))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all flex-shrink-0 cursor-pointer shadow-xs ${
                    selectedFilter === String(category.id)
                      ? 'bg-slate-900 text-white font-semibold border border-slate-900 dark:bg-[#1c2534] dark:text-white dark:border-[#2b394f]'
                      : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium border border-slate-300 dark:bg-[#141b27] dark:text-slate-400 dark:hover:text-slate-200 dark:border-[#1d2635]'
                  }`}
                >
                  <span>{category.name}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    selectedFilter === String(category.id) ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-[#1c2534] dark:text-slate-400 dark:border-transparent'
                  }`}>
                    {catServices.length}
                  </span>
                </button>
              ))}

              {other.length > 0 && (
                <button
                  onClick={() => setSelectedFilter('other')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all flex-shrink-0 cursor-pointer shadow-xs ${
                    selectedFilter === 'other'
                      ? 'bg-slate-900 text-white font-semibold border border-slate-900 dark:bg-[#1c2534] dark:text-white dark:border-[#2b394f]'
                      : 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium border border-slate-300 dark:bg-[#141b27] dark:text-slate-400 dark:hover:text-slate-200 dark:border-[#1d2635]'
                  }`}
                >
                  <span>{t('dashboard.other_services', 'Inne')}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    selectedFilter === 'other' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-[#1c2534] dark:text-slate-400 dark:border-transparent'
                  }`}>
                    {other.length}
                  </span>
                </button>
              )}
            </div>

            {/* Right: Quick Status Chips */}
            <div className="flex items-center gap-1 p-0.5 rounded-md bg-white dark:bg-[#141b27] border border-slate-300 dark:border-[#1d2635] text-[11px] font-mono w-full md:w-auto overflow-x-auto no-scrollbar shadow-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`flex-1 md:flex-initial text-center px-2.5 py-1 rounded font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === 'all' 
                    ? 'bg-slate-200 text-slate-900 font-bold dark:bg-[#1c2534] dark:text-white' 
                    : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-slate-200'
                }`}
              >
                {t('filter.all_statuses', 'Wszystkie')}
              </button>
              <button
                onClick={() => setStatusFilter('online')}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-1 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === 'online' 
                    ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30' 
                    : 'text-slate-700 dark:text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:text-emerald-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                Online
              </button>
              <button
                onClick={() => setStatusFilter('offline')}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-1 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === 'offline' 
                    ? 'bg-rose-100 text-rose-800 font-bold border border-rose-300 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30' 
                    : 'text-slate-700 dark:text-slate-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:text-rose-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-600 dark:bg-rose-400" />
                Offline
              </button>
              <button
                onClick={() => setStatusFilter('issues')}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-1 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === 'issues' 
                    ? 'bg-amber-100 text-amber-800 font-bold border border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30' 
                    : 'text-slate-700 dark:text-slate-400 hover:text-amber-700 hover:bg-amber-50 dark:hover:text-amber-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400" />
                Problemy
              </button>
            </div>
          </div>

          {/* Pinned Favorites Section */}
          {showFavorites && (
            <FavoritesSection 
              favorites={favorites} 
              onFavoriteToggle={handleFavoriteToggle}
              onSelectService={(svc) => {
                setSelectedServiceForDrawer(svc);
                setIsDrawerOpen(true);
              }}
            />
          )}

          {/* Categorized Service Sections */}
          {filteredCategories.map(({ category, services: catServices }) => (
            <CategorySection
              key={category.id}
              category={category}
              services={catServices}
              onFavoriteToggle={handleFavoriteToggle}
              onSelectService={(svc) => {
                setSelectedServiceForDrawer(svc);
                setIsDrawerOpen(true);
              }}
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
              onSelectService={(svc) => {
                setSelectedServiceForDrawer(svc);
                setIsDrawerOpen(true);
              }}
            />
          )}

          {/* Filter Empty State */}
          {filteredCategories.length === 0 && !showFavorites && !showOther && (
            <div className="p-8 text-center bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#1d2635] rounded-lg space-y-2">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {t('filter.no_results', 'Brak usług spełniających wybrane filtry')}
              </p>
              <button
                onClick={() => { setSelectedFilter('all'); setStatusFilter('all'); }}
                className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
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

      {/* Service Details Drawer */}
      {isDrawerOpen && selectedServiceForDrawer && (
        <ServiceDetailsDrawer
          service={selectedServiceForDrawer}
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setSelectedServiceForDrawer(null);
          }}
          onRefresh={refreshServices}
          onEdit={(svc) => {
            setEditingService(svc);
          }}
          onDelete={() => {
            refreshServices();
          }}
          onFavoriteToggle={handleFavoriteToggle}
        />
      )}

      {/* Edit Service Modal */}
      {editingService && (
        <ServiceForm
          service={editingService}
          onClose={() => setEditingService(null)}
          onSuccess={() => {
            setEditingService(null);
            refreshServices();
          }}
        />
      )}

      {/* Add Service Modal */}
      {isAddModalOpen && (
        <ServiceForm
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            refreshServices();
          }}
        />
      )}

      {/* Network Discovery Modal */}
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
