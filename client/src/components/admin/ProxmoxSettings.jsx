import React, { useState, useEffect } from 'react';
import { useSettings } from '../../hooks/useSettings';
import Input from '../common/Input';
import Button from '../common/Button';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';
import { Server, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Layers, Cpu, HardDrive } from 'lucide-react';
import BrandIcon from '../common/BrandIcon';

export default function ProxmoxSettings() {
  const { settings, updateSettings, loading } = useSettings();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    proxmox_enabled: 'false',
    proxmox_host: '',
    proxmox_port: '8006',
    proxmox_node: 'pve',
    proxmox_token_id: '',
    proxmox_token_secret: '',
    proxmox_verify_ssl: 'false'
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        proxmox_enabled: settings.proxmox_enabled || 'false',
        proxmox_host: settings.proxmox_host || '',
        proxmox_port: settings.proxmox_port || '8006',
        proxmox_node: settings.proxmox_node || 'pve',
        proxmox_token_id: settings.proxmox_token_id || '',
        proxmox_token_secret: settings.proxmox_token_secret || '',
        proxmox_verify_ssl: settings.proxmox_verify_ssl || 'false'
      });
    }
  }, [settings]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 'true' : 'false') : value
    }));
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.proxmox.testConnection({
        host: formData.proxmox_host,
        port: formData.proxmox_port,
        node: formData.proxmox_node,
        token_id: formData.proxmox_token_id,
        token_secret: formData.proxmox_token_secret,
        verify_ssl: formData.proxmox_verify_ssl
      });
      setTestResult({ success: true, message: res.data.message || 'Pomyślnie połączono z API Proxmox VE!' });
      addToast('Połączenie z Proxmox VE zostało zweryfikowane', 'success');
    } catch (err) {
      setTestResult({ success: false, message: err.response?.data?.error || err.message || 'Nie udało się połączyć z Proxmox API' });
      addToast('Test połączenia Proxmox nie powiódł się', 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(formData);
      addToast('Zapisano ustawienia integracji z Proxmox VE', 'success');
    } catch (err) {
      addToast('Błąd podczas zapisywania ustawień', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Ładowanie ustawień...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-3xl">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Integracja z Proxmox VE</h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Podłącz swój węzeł Proxmox VE, aby wyświetlać telemetrię CPU/RAM/Dysk oraz stan kontenerów LXC i maszyn VM.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Enable Integration Card */}
        <div className="p-5 rounded-2xl glass-card space-y-4 border border-black/[0.08] dark:border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#e57000] flex items-center justify-center text-white shadow-md">
                <BrandIcon name="proxmox" color="#ffffff" className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Włącz telemetrię Proxmox VE</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Pobiera metryki i statusy maszyn w czasie rzeczywistym</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="proxmox_enabled"
                checked={formData.proxmox_enabled === 'true'}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
            </label>
          </div>
        </div>

        {/* Proxmox API Credentials Card */}
        <div className="p-5 rounded-2xl glass-card space-y-4 border border-black/[0.08] dark:border-white/10">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-black/[0.06] dark:border-white/10">
            Dane węzła i Token API Proxmox
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Adres IP / Host Proxmox"
                name="proxmox_host"
                value={formData.proxmox_host}
                onChange={handleChange}
                placeholder="np. 192.168.1.10 lub pve.homelab.local"
              />
            </div>
            <div>
              <Input
                label="Port API"
                name="proxmox_port"
                value={formData.proxmox_port}
                onChange={handleChange}
                placeholder="8006"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nazwa węzła (Node)"
              name="proxmox_node"
              value={formData.proxmox_node}
              onChange={handleChange}
              placeholder="pve (lub maciek)"
            />
            <Input
              label="Token ID"
              name="proxmox_token_id"
              value={formData.proxmox_token_id}
              onChange={handleChange}
              placeholder="root@pam!nexuspanel"
            />
          </div>

          <div>
            <Input
              label="Token Secret (UUID)"
              name="proxmox_token_secret"
              type="password"
              value={formData.proxmox_token_secret}
              onChange={handleChange}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              name="proxmox_verify_ssl"
              checked={formData.proxmox_verify_ssl === 'true'}
              onChange={handleChange}
              className="w-4 h-4 rounded accent-accent"
            />
            <span>Weryfikuj certyfikat SSL (Odznacz, jeśli używasz certyfikatu self-signed)</span>
          </label>
        </div>

        {/* Test Result Feedback */}
        {testResult && (
          <div className={`p-4 rounded-2xl border ${
            testResult.success 
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-300' 
              : 'bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-300'
          } flex items-center gap-3 text-xs`}>
            {testResult.success ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <span className="font-semibold">{testResult.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleTestConnection}
            isLoading={testing}
            disabled={!formData.proxmox_host || !formData.proxmox_token_id}
            className="text-xs font-bold"
          >
            Testuj połączenie
          </Button>

          <Button
            type="submit"
            isLoading={saving}
            className="px-6 py-2.5 shadow-lg shadow-accent/25 text-xs font-bold"
          >
            Zapisz ustawienia Proxmox
          </Button>
        </div>
      </form>
    </div>
  );
}
