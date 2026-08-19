import React, { useState } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { 
  Settings, Palette, LayoutGrid, Tags, Shield, Download, FolderTree, Menu, X, ArrowLeft, Server
} from 'lucide-react';
import { Link } from 'react-router-dom';
import GeneralSettings from '../components/admin/GeneralSettings';
import AppearanceSettings from '../components/admin/AppearanceSettings';
import ServiceManager from '../components/admin/ServiceManager';
import CategoryManager from '../components/admin/CategoryManager';
import TagManager from '../components/admin/TagManager';
import SecuritySettings from '../components/admin/SecuritySettings';
import BackupSettings from '../components/admin/BackupSettings';
import ProxmoxSettings from '../components/admin/ProxmoxSettings';

const tabs = [
  { id: 'general', label: 'Ogólne', icon: Settings, path: 'general' },
  { id: 'appearance', label: 'Wygląd i Motywy', icon: Palette, path: 'appearance' },
  { id: 'proxmox', label: 'Węzeł Proxmox VE', icon: Server, path: 'proxmox' },
  { id: 'services', label: 'Zarządzanie Usługami', icon: LayoutGrid, path: 'services' },
  { id: 'categories', label: 'Kategorie', icon: FolderTree, path: 'categories' },
  { id: 'tags', label: 'Tagi', icon: Tags, path: 'tags' },
  { id: 'security', label: 'Bezpieczeństwo i Dostęp', icon: Shield, path: 'security' },
  { id: 'backup', label: 'Kopia Zapasowa i Reset', icon: Download, path: 'backup' }
];

export default function Admin() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-140px)] gap-6">
        
        {/* Mobile nav toggle */}
        <div className="md:hidden p-4 rounded-2xl glass-card flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <Settings className="w-5 h-5 text-accent" />
            <span>Menu Ustawień</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="p-2 rounded-xl glass-pill text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Apple Style Glass Sidebar (Navigation Dock) */}
        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-64 flex-shrink-0 space-y-3`}>
          <div className="p-3 rounded-[24px] glass-card space-y-1 shadow-xl border border-black/[0.08] dark:border-white/10">
            <div className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Preferencje
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
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 font-medium text-xs sm:text-sm ${
                    isActive 
                      ? 'bg-accent text-white shadow-md shadow-accent/25 font-bold scale-[1.02]' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Quick Back to Dashboard Button */}
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-[18px] glass-pill text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all hover:scale-[1.02]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Wróć do Pulpitu</span>
          </Link>
        </div>

        {/* Content Pane in iOS Liquid Glass Card */}
        <div className="flex-1 overflow-x-hidden">
          <div className="glass-card rounded-[28px] p-6 sm:p-8 min-h-full shadow-2xl transition-all duration-300 border border-black/[0.08] dark:border-white/10">
            <Routes>
              <Route path="/" element={<Navigate to="general" replace />} />
              <Route path="general" element={<GeneralSettings />} />
              <Route path="appearance" element={<AppearanceSettings />} />
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
