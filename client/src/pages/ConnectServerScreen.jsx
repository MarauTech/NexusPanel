import React, { useState, useEffect } from 'react';
import { 
  Hexagon, Globe, Server, Wifi, Lock, ShieldCheck, 
  CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, UserCheck 
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getServerUrl, setServerUrl } from '../services/api';
import axios from 'axios';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useToast } from '../contexts/ToastContext';

export default function ConnectServerScreen({ onConnected }) {
  const { language, setLanguage, t } = useLanguage();
  const { login, checkAuth } = useAuth();
  const { addToast } = useToast();

  // Wizard state: 1 = Server IP Config, 2 = Admin Login / Setup
  const [step, setStep] = useState(1);
  
  // Step 1: Server URL
  const [serverInput, setServerInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success, version, latency, setupCompleted, error }
  
  // Step 2: Auth Credentials
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dashboardName, setDashboardName] = useState('NexusPanel');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const saved = getServerUrl();
    if (saved) {
      setServerInput(saved);
      // Auto test saved server
      testConnection(saved, true);
    } else {
      // Default to common homelab IP
      setServerInput('http://192.168.10.96:3000');
    }
  }, []);

  const testConnection = async (targetUrl, isAuto = false) => {
    let clean = (targetUrl || serverInput).trim().replace(/\/+$/, '');
    if (!clean) return;
    if (!/^https?:\/\//i.test(clean)) {
      clean = 'http://' + clean;
    }

    setTesting(true);
    setTestResult(null);

    const startTime = Date.now();
    try {
      // 1. Health probe
      const healthRes = await axios.get(`${clean}/api/health`, {
        timeout: 6000,
        headers: { 'Cache-Control': 'no-cache' }
      });
      const latency = Date.now() - startTime;

      // 2. Auth status probe
      let isSetup = true;
      try {
        const statusRes = await axios.get(`${clean}/api/auth/status`, { timeout: 5000 });
        isSetup = Boolean(statusRes.data?.setupCompleted);
      } catch (e) {
        // fallback
      }

      setTestResult({
        success: true,
        version: healthRes.data?.version || '1.0.0',
        latency,
        setupCompleted: isSetup,
        cleanUrl: clean
      });

      // Save valid server URL immediately
      setServerUrl(clean);

      if (!isAuto) {
        addToast('Połączono z serwerem NexusPanel!', 'success');
      }
      return true;
    } catch (err) {
      let errorMsg = 'Nie można nawiązać połączenia z serwerem.';
      if (err.code === 'ECONNABORTED') errorMsg = 'Przekroczono limit czasu (Timeout 6s). Serwer nie odpowiada.';
      else if (err.message?.includes('Network Error')) errorMsg = 'Błąd sieci. Sprawdź, czy telefon jest w tej samej sieci Wi-Fi/VPN co serwer oraz czy port 3000 jest otwarty.';
      else if (err.response?.status) errorMsg = `Serwer zwrócił kod błędu HTTP ${err.response.status}.`;

      setTestResult({
        success: false,
        error: errorMsg
      });
      return false;
    } finally {
      setTesting(false);
    }
  };

  const handleProceedToAuth = (e) => {
    e.preventDefault();
    if (!testResult?.success) {
      testConnection(serverInput);
      return;
    }
    setStep(2);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      const serverUrl = testResult?.cleanUrl || getServerUrl();
      setServerUrl(serverUrl);

      if (testResult?.setupCompleted === false) {
        // First-time setup on fresh instance
        if (password !== confirmPassword) {
          throw new Error('Hasła nie są identyczne');
        }
        if (password.length < 6) {
          throw new Error('Hasło musi mieć co najmniej 6 znaków');
        }

        const setupRes = await axios.post(`${serverUrl}/api/auth/setup`, {
          username,
          password,
          dashboard_name: dashboardName
        });

        if (setupRes.data?.token) {
          localStorage.setItem('nexuspanel_token', setupRes.data.token);
        }
      } else {
        // Standard admin login
        await login(username, password);
      }

      await checkAuth();
      addToast('Zalogowano pomyślnie!', 'success');
      if (onConnected) onConnected();
    } catch (err) {
      setAuthError(err.response?.data?.error || err.message || 'Błąd uwierzytelniania');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 p-4 sm:p-6 select-none relative overflow-y-auto">
      
      {/* Background Accent glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[380px] sm:w-[550px] h-[380px] sm:h-[550px] rounded-full bg-blue-600/10 blur-[130px]" />
      </div>

      <div className="w-full max-w-md bg-[#111622] rounded-xl border border-[#1d2635] shadow-2xl p-5 sm:p-7 relative z-10 space-y-5 animate-in fade-in duration-200">
        
        {/* Header: Logo & Language Switcher */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1c2534]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Hexagon className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block">NexusPanel Mobile</span>
              <span className="text-[10px] font-mono text-slate-400 block">Homelab Infrastructure Client</span>
            </div>
          </div>

          {/* 1. WYBÓR JĘZYKA (Step 1 requirement) */}
          <div className="flex items-center gap-1 bg-[#18202d] border border-[#222d41] p-0.5 rounded-md text-xs font-mono">
            <button
              type="button"
              onClick={() => setLanguage('pl')}
              className={`px-2 py-1 rounded font-bold transition-colors cursor-pointer ${
                language === 'pl' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Język Polski"
            >
              PL 🇵🇱
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded font-bold transition-colors cursor-pointer ${
                language === 'en' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="English Language"
            >
              EN 🇬🇧
            </button>
          </div>
        </div>

        {/* =========================================================
            KROK 1: PODAJ ADRES IP / DOMENĘ SERWERA
            ========================================================= */}
        {step === 1 && (
          <form onSubmit={handleProceedToAuth} className="space-y-4 animate-in fade-in duration-150">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-blue-400" />
                <span>1. {t('connect.server_address_title', 'Podaj adres serwera NexusPanel')}</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-1">
                {t('connect.server_address_desc', 'Wpisz adres IP w sieci lokalnej (np. z portem 3000) lub własną domenę.')}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('connect.server_url_label', 'Adres URL instancji *')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={serverInput}
                  onChange={(e) => {
                    setServerInput(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="http://192.168.10.96:3000"
                  className="w-full bg-[#18202d] border border-[#222d41] focus:border-blue-500 text-slate-100 placeholder:text-slate-500 rounded-md pl-3 pr-24 py-2.5 text-xs font-mono focus:outline-none shadow-xs"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => testConnection(serverInput)}
                  disabled={testing || !serverInput.trim()}
                  className="absolute inset-y-1 right-1 px-2.5 bg-[#151c28] hover:bg-[#1e2738] border border-[#212c3e] text-slate-200 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                >
                  {testing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3 text-blue-400" />}
                  <span>{testing ? 'Test...' : 'Testuj'}</span>
                </button>
              </div>
            </div>

            {/* Live Connection Test Feedback */}
            {testResult && (
              <div className={`p-3 rounded-lg border text-xs animate-in fade-in ${
                testResult.success 
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800 text-rose-300'
              }`}>
                {testResult.success ? (
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Serwer odpowiada poprawnie!</div>
                      <div className="text-[11px] font-mono text-emerald-400/90 mt-0.5">
                        Wersja: v{testResult.version} · Ping: {testResult.latency} ms
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Brak połączenia z serwerem</div>
                      <div className="text-[11px] font-mono text-rose-300/90 mt-0.5">
                        {testResult.error}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Szybkie podpowiedzi IP */}
            <div className="text-[11px] text-slate-400 space-y-1">
              <span className="text-slate-500 font-mono text-[10px] uppercase">Przykłady adresów:</span>
              <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                {['http://192.168.10.96:3000', 'http://192.168.1.100:3000', 'http://10.0.0.50:3000'].map(ip => (
                  <button
                    key={ip}
                    type="button"
                    onClick={() => {
                      setServerInput(ip);
                      testConnection(ip);
                    }}
                    className="px-2 py-0.5 bg-[#18202d] border border-[#222d41] hover:border-blue-500 text-slate-300 rounded cursor-pointer transition-colors"
                  >
                    {ip}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 text-xs font-bold justify-center"
              isLoading={testing}
            >
              {testResult?.success ? 'Dalej: Logowanie ➔' : 'Sprawdź i Połącz ➔'}
            </Button>
          </form>
        )}

        {/* =========================================================
            KROK 2: LOGOWANIE JAKO ADMINISTRATOR
            ========================================================= */}
        {step === 2 && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 animate-in fade-in duration-150">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-blue-400" />
                  <span>2. {testResult?.setupCompleted === false ? 'Utwórz konto Administratora' : 'Logowanie do NexusPanel'}</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[10px] text-blue-400 hover:underline font-mono cursor-pointer"
                >
                  Zmień IP
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                Połączono z: <strong>{testResult?.cleanUrl}</strong>
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-lg text-xs font-semibold text-center animate-in fade-in">
                {authError}
              </div>
            )}

            {testResult?.setupCompleted === false && (
              <Input
                label="Nazwa Twojego panelu"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                placeholder="NexusPanel"
                required
              />
            )}

            <Input
              label="Nazwa użytkownika (Admin)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
              autoComplete="username"
              autoFocus
            />

            <Input
              label="Hasło"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={testResult?.setupCompleted === false ? 'new-password' : 'current-password'}
            />

            {testResult?.setupCompleted === false && (
              <Input
                label="Potwierdź hasło"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
            )}

            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
                className="text-xs"
              >
                Wróć
              </Button>

              <Button
                type="submit"
                variant="primary"
                className="flex-1 py-2.5 text-xs font-bold justify-center"
                isLoading={authLoading}
              >
                {testResult?.setupCompleted === false ? 'Utwórz i Uruchom ➔' : 'Zaloguj się do panelu ➔'}
              </Button>
            </div>
          </form>
        )}

      </div>

      <div className="text-center text-[10px] font-mono text-slate-500 mt-4 relative z-10">
        NexusPanel Android Client v1.0.0 · MarauTech Homelab
      </div>
    </div>
  );
}
