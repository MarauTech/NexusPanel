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
      <header className="w-full px-4 sm:px-8 lg:px-12 pt-4 pb-2 border-b border-[#18202d] bg-[#0b0f17]/90 backdrop-blur-sm sticky top-0 z-30">
        <div className="w-full flex items-center justify-between gap-4">
          
          {/* Left: Minimal Logo & Title */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0 select-none">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="w-5 h-5 rounded object-contain" />
            ) : (
              <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white">
                <Hexagon className="w-3 h-3" />
              </div>
            )}
            <span className="font-semibold text-sm tracking-tight text-slate-200 group-hover:text-white transition-colors">
              {settings?.dashboard_name || 'NexusPanel'}
            </span>
          </Link>

          {/* Right: Technical Action Buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Quick Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#141b27] hover:bg-[#1c2534] text-slate-400 hover:text-slate-200 border border-[#1d2635] text-xs font-mono transition-colors"
              title={t('header.search', 'Wyszukiwarka (Ctrl+K)')}
            >
              <Search className="w-3 h-3 text-slate-400" />
              <span className="hidden sm:inline text-slate-300">{t('header.spotlight', 'Szukaj')}</span>
              <kbd className="text-[10px] bg-[#1c2534] px-1 py-0.2 rounded text-slate-500 font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#141b27] hover:bg-[#1c2534] text-slate-400 hover:text-slate-200 border border-[#1d2635] text-xs font-mono transition-colors"
              title={language === 'pl' ? 'Switch to English' : 'Przełącz na Polski'}
            >
              <Globe className="w-3 h-3 text-slate-400" />
              <span>{language.toUpperCase()}</span>
            </button>

            {/* Kiosk Mode */}
            <Link
              to="/kiosk"
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#141b27] hover:bg-[#1c2534] text-slate-400 hover:text-slate-200 border border-[#1d2635] text-xs font-mono transition-colors"
              title="Kiosk Mode"
            >
              <Tv className="w-3 h-3 text-slate-400" />
              <span className="hidden md:inline">Kiosk</span>
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded bg-[#141b27] hover:bg-[#1c2534] text-slate-400 hover:text-slate-200 border border-[#1d2635] transition-colors"
              title={theme === 'dark' ? 'Tryb jasny' : 'Tryb ciemny'}
            >
              {theme === 'dark' ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3 text-blue-400" />}
            </button>

            {/* Admin / Dashboard Toggle */}
            {isAdmin ? (
              <Link
                to="/"
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
              >
                <LayoutDashboard className="w-3 h-3" />
                <span className="hidden sm:inline">{t('header.dashboard', 'Pulpit')}</span>
              </Link>
            ) : (
              <Link
                to="/admin"
                className="flex items-center gap-1 px-2 py-1 rounded bg-[#141b27] hover:bg-[#1c2534] text-slate-400 hover:text-slate-200 border border-[#1d2635] text-xs transition-colors"
                title={t('header.settings', 'Ustawienia')}
              >
                <Settings className="w-3 h-3" />
                <span className="hidden sm:inline">{t('header.settings', 'Ustawienia')}</span>
              </Link>
            )}

            {/* Logout / Login */}
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="p-1.5 rounded bg-[#141b27] hover:bg-rose-900/20 text-slate-400 hover:text-rose-400 border border-[#1d2635] transition-colors"
                title={t('header.logout', 'Wyloguj się')}
              >
                <LogOut className="w-3 h-3" />
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                title={t('header.login', 'Zaloguj się')}
              >
                <Lock className="w-3 h-3" />
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
