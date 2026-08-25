import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getServerUrl } from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import ServerConfigModal from '../components/common/ServerConfigModal';
import { Hexagon, Lock, Server, Globe, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [serverModalOpen, setServerModalOpen] = useState(false);
  
  const { login, checkAuth } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirectUrl = searchParams.get('redirect') || '/';
  const currentServer = getServerUrl();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(username, password);
      await checkAuth();
      navigate(redirectUrl);
    } catch (err) {
      setError(err.response?.data?.error || t('login.invalid_credentials', 'Nieprawidłowa nazwa użytkownika lub hasło'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4 relative overflow-hidden select-none">
      
      {/* Background Subtle Technical Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[380px] sm:w-[500px] h-[380px] sm:h-[500px] rounded-full bg-blue-600/10 blur-[130px]" />
      </div>

      <div className="w-full max-w-md bg-[#111622] rounded-xl border border-[#1d2635] shadow-2xl p-5 sm:p-7 relative z-10 space-y-5 animate-in fade-in duration-200">
        
        {/* Header: Logo, Title & Language Toggle */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1c2534]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Hexagon className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block">NexusPanel</span>
              <span className="text-[10px] font-mono text-slate-400 block">{t('login.title', 'Logowanie do panelu')}</span>
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-[#18202d] border border-[#222d41] p-0.5 rounded-md text-xs font-mono">
            <button
              type="button"
              onClick={() => setLanguage('pl')}
              className={`px-2 py-1 rounded font-bold transition-colors cursor-pointer ${
                language === 'pl' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              PL 🇵🇱
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded font-bold transition-colors cursor-pointer ${
                language === 'en' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN 🇬🇧
            </button>
          </div>
        </div>

        {/* Server Indicator Pill */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#18202d] border border-[#222d41] text-xs font-mono">
          <div className="flex items-center gap-2 min-w-0">
            <Server className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span className="truncate text-slate-300">
              {currentServer ? currentServer.replace(/^https?:\/\//, '') : 'Instancja lokalna (LAN)'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setServerModalOpen(true)}
            className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold hover:underline cursor-pointer flex-shrink-0 ml-2"
          >
            Zmień IP
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-lg text-xs font-semibold text-center animate-in fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('login.username', 'Nazwa użytkownika (Admin)')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            autoFocus
          />

          <Input
            label={t('login.password', 'Hasło')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full py-2.5 text-xs font-bold justify-center"
            isLoading={loading}
          >
            {t('login.submit', 'Zaloguj się do panelu ➔')}
          </Button>
        </form>

      </div>

      {serverModalOpen && (
        <ServerConfigModal
          isOpen={serverModalOpen}
          onClose={() => setServerModalOpen(false)}
          onConnected={() => window.location.reload()}
        />
      )}
    </div>
  );
}
