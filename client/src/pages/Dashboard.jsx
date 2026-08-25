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
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 w-full max-w-[1920px] mx-auto animate-in fade-in duration-200">
      
      {/* 1. Sleek Technical Hero Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-[#1c2534]">
        {/* Title / Subtitle */}
        <div className="text-left">
          <h1 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            {settings?.user_name ? `${t('dashboard.greeting', 'Witaj')}, ${settings.user_name}` : t('dashboard.welcome', 'Witaj w NexusPanel')}
          </h1>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
          <Button
            variant="secondary"
            size="sm"
            icon={Radar}
            onClick={() => setIsScanModalOpen(true)}
          >
            {t('dashboard.btn_scan', 'Skanuj sieć LAN')}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() => setIsAddModalOpen(true)}
          >
            {t('dashboard.add_app', 'Dodaj aplikację')}
          </Button>
        </div>
      </div>

      {/* 2. Compact Global Status Strip */}
      <div className="mb-2">
        <GlobalStatusStrip services={enrichedServices} />
      </div>

      {/* 3. 2-Column Responsive Layout: Left ~68% Services & Categories, Right ~32% System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start w-full pt-1">
        
        {/* ============================================
            LEFT COLUMN: FILTERS, FAVORITES & CATEGORIES
            ============================================ */}
        <div className="lg:col-span-8 xl:col-span-8 2xl:col-span-9 space-y-4 min-w-0">
          
          {/* Dual Filter Bar: Category Tabs + Status Chips */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 w-full sm:w-auto">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex-shrink-0 cursor-pointer ${
                  selectedFilter === 'all'
                    ? 'bg-slate-200 dark:bg-[#1c2534] text-slate-900 dark:text-white border border-slate-300 dark:border-[#2b394f]'
                    : 'bg-white dark:bg-[#141b27] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-[#1d2635]'
                }`}
              >
                <LayoutGrid className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                <span>{t('dashboard.all_services', 'Wszystko')}</span>
                <span className="text-[10px] font-mono text-slate-500">
                  {enrichedServices.filter(s => s.enabled !== 0).length}
                </span>
              </button>

              {favorites.length > 0 && (
                <button
                  onClick={() => setSelectedFilter('favorites')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex-shrink-0 cursor-pointer ${
                    selectedFilter === 'favorites'
                      ? 'bg-amber-100 dark:bg-[#1c2534] text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30'
                      : 'bg-white dark:bg-[#141b27] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-[#1d2635]'
                  }`}
                >
                  <Star className="w-3 h-3 fill-amber-400/20 text-amber-500 dark:text-amber-400" />
                  <span>{t('dashboard.favorites', 'Ulubione')}</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {favorites.length}
                  </span>
                </button>
              )}

              {categorized.map(({ category, services: catServices }) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedFilter(String(category.id))}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex-shrink-0 cursor-pointer ${
                    selectedFilter === String(category.id)
                      ? 'bg-slate-200 dark:bg-[#1c2534] text-slate-900 dark:text-white border border-slate-300 dark:border-[#2b394f]'
                      : 'bg-white dark:bg-[#141b27] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-[#1d2635]'
                  }`}
                >
                  <span>{category.name}</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {catServices.length}
                  </span>
                </button>
              ))}

              {other.length > 0 && (
                <button
                  onClick={() => setSelectedFilter('other')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex-shrink-0 cursor-pointer ${
                    selectedFilter === 'other'
                      ? 'bg-slate-200 dark:bg-[#1c2534] text-slate-900 dark:text-white border border-slate-300 dark:border-[#2b394f]'
                      : 'bg-white dark:bg-[#141b27] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-[#1d2635]'
                  }`}
                >
                  <span>{t('dashboard.other_services', 'Inne')}</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {other.length}
                  </span>
                </button>
              )}
            </div>

            {/* Right: Quick Status Chips */}
            <div className="flex items-center gap-1 p-0.5 rounded-md bg-white dark:bg-[#141b27] border border-slate-200 dark:border-[#1d2635] text-[11px] font-mono self-end sm:self-auto shadow-sm">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                  statusFilter === 'all' 
                    ? 'bg-slate-200 dark:bg-[#1c2534] text-slate-900 dark:text-white' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t('filter.all_statuses', 'Wszystkie')}
              </button>
              <button
                onClick={() => setStatusFilter('online')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                  statusFilter === 'online' 
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                Online
              </button>
              <button
                onClick={() => setStatusFilter('offline')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                  statusFilter === 'offline' 
                    ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
                Offline
              </button>
              <button
                onClick={() => setStatusFilter('issues')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                  statusFilter === 'issues' 
                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
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
