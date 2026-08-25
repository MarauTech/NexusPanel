import React, { useState } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { 
  Settings, Palette, LayoutGrid, Tags, Shield, Download, FolderTree, Menu, X, ArrowLeft, Server
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useServices } from '../hooks/useServices';
import GeneralSettings from '../components/admin/GeneralSettings';
import AppearanceSettings from '../components/admin/AppearanceSettings';
import ServiceManager from '../components/admin/ServiceManager';
import CategoryManager from '../components/admin/CategoryManager';
import TagManager from '../components/admin/TagManager';
import SecuritySettings from '../components/admin/SecuritySettings';
import BackupSettings from '../components/admin/BackupSettings';
import ProxmoxSettings from '../components/admin/ProxmoxSettings';
import WidgetManager from '../components/admin/WidgetManager';

export default function Admin() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();
  const { services, loading: servicesLoading } = useServices();

  // SECURITY / UX GUARD: If dashboard is in empty setup state, do not allow direct access to /admin
  if (!servicesLoading && services.length === 0) {
    return <Navigate to="/" replace />;
  }

  const tabs = [
    { id: 'general', label: t('admin.tab_general', 'Ogólne'), icon: Settings, path: 'general' },
    { id: 'appearance', label: t('admin.tab_appearance', 'Wygląd i Motywy'), icon: Palette, path: 'appearance' },
    { id: 'widgets', label: t('admin.tab_widgets', 'Widżety Homelab'), icon: LayoutGrid, path: 'widgets' },
    { id: 'proxmox', label: t('admin.tab_proxmox', 'Węzeł Proxmox VE'), icon: Server, path: 'proxmox' },
    { id: 'services', label: t('admin.tab_services', 'Zarządzanie Usługami'), icon: LayoutGrid, path: 'services' },
    { id: 'categories', label: t('admin.tab_categories', 'Kategorie'), icon: FolderTree, path: 'categories' },
    { id: 'tags', label: t('admin.tab_tags', 'Tagi'), icon: Tags, path: 'tags' },
    { id: 'security', label: t('admin.tab_security', 'Bezpieczeństwo i Dostęp'), icon: Shield, path: 'security' },
    { id: 'backup', label: t('admin.tab_backup', 'Kopia Zapasowa i Reset'), icon: Download, path: 'backup' }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-[1920px] mx-auto animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-140px)] gap-5">
        
        {/* Mobile nav toggle */}
        <div className="md:hidden p-3.5 rounded-lg bg-white dark:bg-[#141b27] border border-slate-200 dark:border-[#1d2635] flex items-center justify-between shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2 font-semibold text-sm text-slate-800 dark:text-slate-200">
            <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{t('admin.title', 'Menu Ustawień')}</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="p-1.5 rounded-md bg-slate-100 dark:bg-[#18202d] border border-slate-300 dark:border-[#222d41] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Technical Sysadmin Sidebar */}
        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-60 flex-shrink-0 space-y-3`}>
          <div className="p-2 rounded-lg bg-white dark:bg-[#141b27] border border-slate-200 dark:border-[#1d2635] space-y-1 shadow-sm dark:shadow-none transition-colors">
            <div className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-[#1c2534] mb-1">
              {t('admin.preferences', 'Preferencje')}
            </div>
            
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = location.pathname.includes(`/admin/${tab.path}`) || 
                (tab.path === 'general' && (location.pathname === '/admin' || location.pathname === '/admin/'));
              
              return (
                <NavLink
                  key={tab.id}
                  to={tab.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-xs font-medium ${
                    isActive 
                      ? 'bg-slate-200 dark:bg-[#1c2534] text-slate-900 dark:text-white border border-slate-300 dark:border-[#2b394f]' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#18202d] border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Quick Back to Dashboard Button */}
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white hover:bg-slate-100 dark:bg-[#141b27] dark:hover:bg-[#18202d] border border-slate-200 dark:border-[#1d2635] text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white text-xs font-medium transition-colors shadow-sm dark:shadow-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('admin.back_to_dashboard', 'Wróć do Pulpitu')}</span>
          </Link>
        </div>

        {/* Content Pane */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-[#141b27] border border-slate-200 dark:border-[#1d2635] rounded-lg p-5 sm:p-6 min-h-full shadow-sm dark:shadow-none transition-colors">
            <Routes>
              <Route path="/" element={<Navigate to="general" replace />} />
              <Route path="general" element={<GeneralSettings />} />
              <Route path="appearance" element={<AppearanceSettings />} />
              <Route path="widgets" element={<WidgetManager />} />
              <Route path="proxmox" element={<ProxmoxSettings />} />
              <Route path="services" element={<ServiceManager />} />
              <Route path="categories" element={<CategoryManager />} />
              <Route path="tags" element={<TagManager />} />
              <Route path="security" element={<SecuritySettings />} />
              <Route path="backup" element={<BackupSettings />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}
