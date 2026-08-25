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
      <header className="w-full px-4 sm:px-8 lg:px-12 pt-5 pb-2">
        <div className="w-full flex items-center justify-between gap-4 transition-all duration-300">
          
          {/* Left: Minimal Clean Logo & Title with High-Contrast Typography */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0 select-none">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="w-7 h-7 rounded-lg object-contain" />
            ) : (
              <div 
                className="w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105" 
                style={{ 
                  background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
                }}
              >
                <Hexagon className="w-3.5 h-3.5" />
              </div>
            )}
            <span className="font-black text-base tracking-tight text-slate-900 dark:text-white group-hover:text-accent transition-colors">
              {settings?.dashboard_name || 'NexusPanel'}
            </span>
          </Link>

          {/* Right: Clean Minimal Action Buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Quick Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all text-xs font-medium border border-black/[0.06] dark:border-white/10"
              title={t('header.search', 'Wyszukiwarka (Ctrl+K)')}
            >
              <Search className="w-3.5 h-3.5 text-accent" />
              <span className="hidden sm:inline">{t('header.spotlight', 'Szukaj')}</span>
              <kbd className="text-[10px] bg-black/[0.06] dark:bg-white/10 px-1 py-0.2 rounded text-slate-500 dark:text-slate-400 font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Language Switcher (PL / EN) */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all text-xs font-bold font-mono border border-black/[0.06] dark:border-white/10 cursor-pointer"
              title={language === 'pl' ? 'Przełącz na język angielski (English)' : 'Przełącz na język polski (Polski)'}
            >
              <Globe className="w-3.5 h-3.5 text-accent" />
              <span>{language.toUpperCase()}</span>
            </button>

            {/* Kiosk Mode Button */}
            <Link
              to="/kiosk"
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all text-xs font-medium border border-black/[0.06] dark:border-white/10"
              title="Tryb Kiosk / Panel ścienny"
            >
              <Tv className="w-3.5 h-3.5 text-accent" />
              <span className="hidden md:inline">Kiosk</span>
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all border border-black/[0.06] dark:border-white/10"
              title={theme === 'dark' ? 'Przełącz na tryb jasny' : 'Przełącz na tryb ciemny'}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
            </button>

            {/* Settings Link */}
            {isAdmin ? (
              <Link
                to="/"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-md shadow-accent/25 transition-all"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('header.dashboard', 'Pulpit')}</span>
              </Link>
            ) : (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.08] dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all text-xs font-medium border border-black/[0.06] dark:border-white/10"
                title={t('header.settings', 'Ustawienia')}
              >
                <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:rotate-45 transition-transform" />
                <span className="hidden sm:inline">{t('header.settings', 'Ustawienia')}</span>
              </Link>
            )}

            {/* Login / Logout Button */}
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] hover:bg-red-500/10 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 text-xs font-medium border border-black/[0.06] dark:border-white/10 transition-all cursor-pointer"
                title={t('header.logout', 'Wyloguj się')}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-bold shadow-md shadow-accent/25 transition-all"
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
