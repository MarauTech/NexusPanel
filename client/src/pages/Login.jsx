import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { ShieldCheck, ArrowLeft, Lock } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirectUrl = searchParams.get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(username, password);
      navigate(redirectUrl);
    } catch (err) {
      setError(err.response?.data?.error || t('login.invalid_credentials', 'Nieprawidłowa nazwa użytkownika lub hasło'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4 relative overflow-hidden">
      {/* Background aurora */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-600/15 to-transparent blur-[120px] animate-aurora-1" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tr from-cyan-500/15 via-blue-600/15 to-transparent blur-[120px] animate-aurora-2" />
      </div>

      <div className="w-full max-w-md glass-card rounded-[28px] shadow-2xl p-6 sm:p-8 relative z-10 border border-black/[0.08] dark:border-white/10 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-14 h-14 bg-accent/15 border border-accent/30 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <Lock className="w-7 h-7 text-accent" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('login.title', 'Logowanie')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('login.subtitle', 'Zaloguj się, aby uzyskać dostęp do panelu administracyjnego')}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('login.username', 'Nazwa użytkownika')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
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
            className="w-full py-3 text-xs sm:text-sm font-bold shadow-lg shadow-accent/25"
            isLoading={loading}
          >
            {t('login.submit', 'Zaloguj się ➔')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('login.back_to_dashboard', 'Wróć do Pulpitu')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
