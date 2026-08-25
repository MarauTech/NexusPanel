import React, { useState, useEffect } from 'react';
import { Server, Wifi, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';
import { getServerUrl, setServerUrl } from '../../services/api';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';

export default function ServerConfigModal({ isOpen, onClose, onConnected }) {
  const [urlInput, setUrlInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: boolean, version?: string, latency?: number, error?: string }
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const current = getServerUrl();
      setUrlInput(current || (window.location.origin.startsWith('http') && !window.location.origin.includes('localhost:') ? window.location.origin : 'http://192.168.10.96:3000'));
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const testConnection = async (targetUrl) => {
    let clean = (targetUrl || urlInput).trim().replace(/\/+$/, '');
    if (!clean) return;
    if (!/^https?:\/\//i.test(clean)) {
      clean = 'http://' + clean;
    }

    setTesting(true);
    setTestResult(null);

    const startTime = Date.now();
    try {
      const res = await axios.get(`${clean}/api/health`, {
        timeout: 6000,
        headers: { 'Cache-Control': 'no-cache' }
      });
      const latency = Date.now() - startTime;

      if (res.data && (res.data.status === 'ok' || res.status === 200)) {
        setTestResult({
          success: true,
          version: res.data.version || '1.0.0',
          latency
        });
        return true;
      } else {
        throw new Error('Odpowiedź serwera nie jest poprawnym statusem NexusPanel');
      }
    } catch (err) {
      let errorMsg = err.message;
      if (err.code === 'ECONNABORTED') errorMsg = 'Przekroczono limit czasu (Timeout 6s)';
      else if (err.response?.status) errorMsg = `Błąd HTTP ${err.response.status}`;
      else if (err.message.includes('Network Error')) errorMsg = 'Brak odpowiedzi z serwera (sprawdź IP, port 3000 oraz połączenie z siecią Wi-Fi / VPN)';

      setTestResult({
        success: false,
        error: errorMsg
      });
      return false;
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    let clean = urlInput.trim().replace(/\/+$/, '');
    if (!clean) {
      addToast('Wprowadź adres serwera', 'error');
      return;
    }
    if (!/^https?:\/\//i.test(clean)) {
      clean = 'http://' + clean;
    }

    setServerUrl(clean);
    addToast(`Zapisano serwer: ${clean}`, 'success');
    if (onConnected) onConnected(clean);
    if (onClose) onClose();
  };

  return (
    <Modal title="Konfiguracja Serwera NexusPanel" onClose={onClose} maxWidth="max-w-md">
      <form onSubmit={handleSave} className="space-y-4">
        <div className="text-slate-600 dark:text-slate-400 text-xs space-y-1">
          <p>
            Podaj adres IP lub domenę instancji serwera <strong>NexusPanel</strong>, z którą ma łączyć się aplikacja.
          </p>
          <p className="text-[11px] font-mono text-slate-500">
            Przykład: <code>http://192.168.10.96:3000</code> lub <code>https://nexus.twojadomena.pl</code>
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-800 dark:text-slate-300 mb-1.5">
            Adres serwera (URL) *
          </label>
          <div className="relative">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="http://192.168.1.100:3000"
              className="w-full bg-white dark:bg-[#18202d] border border-slate-300 dark:border-[#222d41] focus:border-blue-500 text-slate-900 dark:text-slate-100 rounded-md pl-3 pr-24 py-2 text-xs font-mono focus:outline-none shadow-xs"
              required
              autoFocus
            />
            <button
              type="button"
              onClick={() => testConnection(urlInput)}
              disabled={testing || !urlInput.trim()}
              className="absolute inset-y-1 right-1 px-2.5 bg-slate-100 dark:bg-[#151c28] hover:bg-slate-200 dark:hover:bg-[#1e2738] border border-slate-300 dark:border-[#212c3e] text-slate-800 dark:text-slate-200 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
            >
              {testing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3 text-blue-500" />}
              <span>{testing ? 'Test...' : 'Testuj'}</span>
            </button>
          </div>
        </div>

        {/* Test Result Banner */}
        {testResult && (
          <div className={`p-3 rounded-lg border text-xs animate-in fade-in ${
            testResult.success 
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}>
            {testResult.success ? (
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Połączenie z serwerem udane!</div>
                  <div className="text-[11px] font-mono opacity-90 mt-0.5">
                    Wersja NexusPanel: v{testResult.version} · Ping: {testResult.latency} ms
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Nie udało się połączyć</div>
                  <div className="text-[11px] font-mono opacity-90 mt-0.5">
                    {testResult.error}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-[#1c2534]">
          {onClose && (
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs">
              Anuluj
            </Button>
          )}
          <Button type="submit" variant="primary" size="sm" className="text-xs font-semibold">
            Zapisz i Połącz
          </Button>
        </div>
      </form>
    </Modal>
  );
}
