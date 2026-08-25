import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Hexagon, Search, Sun, Moon, Settings, LayoutDashboard, 
  Tv, Globe, LogOut, Lock, Menu, X, Server 
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../hooks/useSettings';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import SearchModal from '../search/SearchModal';
import ServerConfigModal from '../common/ServerConfigModal';
import { getServerUrl } from '../../services/api';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSettings();
  const { language, setLanguage, t } = useLanguage();
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [serverModalOpen, setServerModalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const toggleLanguage = () => {
    const nextLang = language === 'pl' ? 'en' : 'pl';
    setLanguage(nextLang);
  };

  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      <header className="w-full px-3.5 sm:px-6 lg:px-10 py-2.5 sm:py-3 border-b border-slate-300 dark:border-[#18202d] bg-white dark:bg-[#0b0f17] sticky top-0 z-30 transition-colors">
        <div className="w-full flex items-center justify-between gap-3">
          
          {/* Left: Minimal Logo & Title */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0 select-none">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="w-5 h-5 rounded object-contain" />
            ) : (
              <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white">
                <Hexagon className="w-3.5 h-3.5" />
              </div>
            )}
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate max-w-[180px] sm:max-w-none">
              {settings?.dashboard_name || 'NexusPanel'}
            </span>
          </Link>

          {/* Desktop Toolbar (Hidden on Mobile < md) */}
          <div className="hidden md:flex items-center gap-1.5 flex-shrink-0 text-xs">
            {/* Quick Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 dark:bg-[#141b27] dark:hover:bg-[#1c2534] dark:text-slate-400 dark:hover:text-slate-200 dark:border-[#1d2635] transition-colors cursor-pointer shadow-xs"
              title={t('header.search', 'Wyszukiwarka (Ctrl+K)')}
            >
              <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="font-medium">{t('header.spotlight', 'Szukaj')}</span>
              <kbd className="text-[10px] bg-slate-200 text-slate-600 dark:bg-[#1c2534] dark:text-slate-500 px-1 py-0.2 rounded font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 dark:bg-[#141b27] dark:hover:bg-[#1c2534] dark:text-slate-400 dark:hover:text-slate-200 dark:border-[#1d2635] font-mono transition-colors cursor-pointer shadow-xs"
              title={language === 'pl' ? 'Switch to English' : 'Przełącz na Polski'}
            >
              <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="font-semibold">{language.toUpperCase()}</span>
            </button>

            {/* Kiosk Mode */}
            <Link
              to="/kiosk"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 dark:bg-[#141b27] dark:hover:bg-[#1c2534] dark:text-slate-400 dark:hover:text-slate-200 dark:border-[#1d2635] transition-colors shadow-xs"
              title="Tryb Kiosk / Pełnoekranowy"
            >
              <Tv className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Kiosk</span>
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 dark:bg-[#141b27] dark:hover:bg-[#1c2534] dark:text-slate-400 dark:hover:text-slate-200 dark:border-[#1d2635] transition-colors cursor-pointer shadow-xs"
              title={theme === 'dark' ? 'Tryb jasny' : 'Tryb ciemny'}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-600" />}
            </button>

            {/* Admin / Dashboard Toggle */}
            {isAdmin ? (
              <Link
                to="/"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors shadow-xs"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{t('header.dashboard', 'Pulpit')}</span>
              </Link>
            ) : (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 dark:bg-[#141b27] dark:hover:bg-[#1c2534] dark:text-slate-400 dark:hover:text-slate-200 dark:border-[#1d2635] transition-colors font-medium shadow-xs"
                title={t('header.settings', 'Ustawienia')}
              >
                <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>{t('header.settings', 'Ustawienia')}</span>
              </Link>
            )}

            {/* Server Connection */}
            <button
              onClick={() => setServerModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 dark:bg-[#141b27] dark:hover:bg-[#1c2534] dark:text-slate-400 dark:hover:text-slate-200 dark:border-[#1d2635] transition-colors cursor-pointer shadow-xs"
              title="Konfiguracja adresu serwera NexusPanel"
            >
              <Server className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-mono text-[11px] hidden xl:inline">{getServerUrl() ? getServerUrl().replace(/^https?:\/\//, '') : 'Serwer'}</span>
            </button>

            {/* Logout / Login */}
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="p-2 rounded bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-300 dark:bg-[#141b27] dark:hover:bg-rose-900/20 dark:text-slate-400 dark:hover:text-rose-400 dark:border-[#1d2635] transition-colors cursor-pointer shadow-xs"
                title={t('header.logout', 'Wyloguj się')}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shadow-xs"
                title={t('header.login', 'Zaloguj się')}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{t('header.login', 'Zaloguj')}</span>
              </Link>
            )}
          </div>

          {/* Mobile Right Controls: Search + Theme + Hamburger Menu */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-md bg-slate-100 active:bg-slate-200 text-slate-700 border border-slate-300 dark:bg-[#141b27] dark:text-slate-300 dark:border-[#1d2635] cursor-pointer shadow-xs"
              title={t('header.search', 'Szukaj')}
              aria-label="Szukaj"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-md bg-slate-100 active:bg-slate-200 text-slate-700 border border-slate-300 dark:bg-[#141b27] dark:text-slate-300 dark:border-[#1d2635] cursor-pointer shadow-xs"
              title={theme === 'dark' ? 'Tryb jasny' : 'Tryb ciemny'}
              aria-label="Zmień motyw"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-600" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-md bg-slate-100 active:bg-slate-200 text-slate-700 border border-slate-300 dark:bg-[#141b27] dark:text-slate-300 dark:border-[#1d2635] cursor-pointer shadow-xs"
              title="Menu"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-3 pb-2 border-t border-slate-200 dark:border-[#18202d] mt-2.5 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              {isAdmin ? (
                <Link
                  to="/"
                  className="flex items-center justify-center gap-2 p-2.5 rounded-md bg-blue-600 text-white font-bold text-center"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>{t('header.dashboard', 'Pulpit')}</span>
                </Link>
              ) : (
                <Link
                  to="/admin"
                  className="flex items-center justify-center gap-2 p-2.5 rounded-md bg-slate-100 dark:bg-[#141b27] border border-slate-300 dark:border-[#1d2635] text-slate-800 dark:text-slate-200 font-bold text-center"
                >
                  <Settings className="w-4 h-4" />
                  <span>{t('header.settings', 'Ustawienia')}</span>
                </Link>
              )}

              <Link
                to="/kiosk"
                className="flex items-center justify-center gap-2 p-2.5 rounded-md bg-slate-100 dark:bg-[#141b27] border border-slate-300 dark:border-[#1d2635] text-slate-800 dark:text-slate-200 text-center"
              >
                <Tv className="w-4 h-4" />
                <span>Tryb Kiosk</span>
              </Link>
            </div>

            {/* Mobile Server Connection Button */}
            <button
              onClick={() => { setMobileMenuOpen(false); setServerModalOpen(true); }}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-md bg-slate-100 dark:bg-[#141b27] border border-slate-300 dark:border-[#1d2635] text-slate-800 dark:text-slate-200 text-xs font-mono"
            >
              <Server className="w-4 h-4 text-blue-500" />
              <span>Serwer: <strong>{getServerUrl() ? getServerUrl().replace(/^https?:\/\//, '') : 'Domyślny (LAN)'}</strong></span>
            </button>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                onClick={toggleLanguage}
                className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-md bg-slate-100 dark:bg-[#141b27] border border-slate-300 dark:border-[#1d2635] text-slate-800 dark:text-slate-200 text-xs font-mono"
              >
                <Globe className="w-4 h-4" />
                <span>Język: <strong>{language.toUpperCase()}</strong></span>
              </button>

              {isAuthenticated ? (
                <button
                  onClick={logout}
                  className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-md bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-xs font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('header.logout', 'Wyloguj')}</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-md bg-blue-600 text-white text-xs font-bold"
                >
                  <Lock className="w-4 h-4" />
                  <span>{t('header.login', 'Zaloguj')}</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
      
      {searchOpen && (
        <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      )}

      {serverModalOpen && (
        <ServerConfigModal 
          isOpen={serverModalOpen} 
          onClose={() => setServerModalOpen(false)}
          onConnected={() => window.location.reload()}
        />
      )}
    </>
  );
}
