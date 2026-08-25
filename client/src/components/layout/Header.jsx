import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Hexagon, Search, Sun, Moon, Settings, LayoutDashboard, Tv, Globe, LogOut, Lock } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSettings } from '../../hooks/useSettings';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import SearchModal from '../search/SearchModal';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSettings();
  const { language, setLanguage, t } = useLanguage();
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

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

  const toggleLanguage = () => {
    const nextLang = language === 'pl' ? 'en' : 'pl';
    setLanguage(nextLang);
  };

  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      <header className="w-full px-4 sm:px-8 lg:px-12 py-3 border-b border-slate-200 dark:border-[#18202d] bg-white dark:bg-[#0b0f17] sticky top-0 z-30 transition-colors">
        <div className="w-full flex items-center justify-between gap-4">
          
          {/* Left: Minimal Logo & Title */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0 select-none">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="w-5 h-5 rounded object-contain" />
            ) : (
              <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white">
                <Hexagon className="w-3.5 h-3.5" />
              </div>
            )}
            <span className="font-semibold text-sm tracking-tight text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
              {settings?.dashboard_name || 'NexusPanel'}
            </span>
          </Link>

          {/* Right: Clean, Unified Sysadmin Toolbar */}
          <div className="flex items-center gap-1.5 flex-shrink-0 text-xs">
            {/* Quick Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 dark:bg-[#141b27] dark:hover:bg-[#1c2534] dark:text-slate-400 dark:hover:text-slate-200 dark:border-[#1d2635] transition-colors"
              title={t('header.search', 'Wyszukiwarka (Ctrl+K)')}
            >
              <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline font-medium">{t('header.spotlight', 'Szukaj')}</span>
              <kbd className="text-[10px] bg-slate-200 text-slate-600 dark:bg-[#1c2534] dark:text-slate-500 px-1 py-0.2 rounded font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 dark:bg-[#141b27] dark:hover:bg-[#1c2534] dark:text-slate-400 dark:hover:text-slate-200 dark:border-[#1d2635] font-mono transition-colors"
              title={language === 'pl' ? 'Switch to English' : 'Przełącz na Polski'}
            >
              <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="font-semibold">{language.toUpperCase()}</span>
            </button>

            {/* Kiosk Mode */}
            <Link
              to="/kiosk"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 dark:bg-[#141b27] dark:hover:bg-[#1c2534] dark:text-slate-400 dark:hover:text-slate-200 dark:border-[#1d2635] transition-colors"
              title="Tryb Kiosk / Pełnoekranowy"
            >
              <Tv className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden md:inline">Kiosk</span>
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 dark:bg-[#141b27] dark:hover:bg-[#1c2534] dark:text-slate-400 dark:hover:text-slate-200 dark:border-[#1d2635] transition-colors"
              title={theme === 'dark' ? 'Tryb jasny' : 'Tryb ciemny'}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-600" />}
            </button>

            {/* Admin / Dashboard Toggle */}
            {isAdmin ? (
              <Link
                to="/"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('header.dashboard', 'Pulpit')}</span>
              </Link>
            ) : (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-300 dark:bg-[#141b27] dark:hover:bg-[#1c2534] dark:text-slate-400 dark:hover:text-slate-200 dark:border-[#1d2635] transition-colors"
                title={t('header.settings', 'Ustawienia')}
              >
                <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="hidden sm:inline">{t('header.settings', 'Ustawienia')}</span>
              </Link>
            )}

            {/* Logout / Login */}
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="p-2 rounded bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-300 dark:bg-[#141b27] dark:hover:bg-rose-900/20 dark:text-slate-400 dark:hover:text-rose-400 dark:border-[#1d2635] transition-colors"
                title={t('header.logout', 'Wyloguj się')}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
                title={t('header.login', 'Zaloguj się')}
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('header.login', 'Zaloguj')}</span>
              </Link>
            )}
          </div>
        </div>
      </header>
      
      {searchOpen && (
        <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      )}
    </>
  );
}
