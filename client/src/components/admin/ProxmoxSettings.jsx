import React, { useState, useEffect } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { useLanguage } from '../../contexts/LanguageContext';
import Input from '../common/Input';
import Button from '../common/Button';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';
import { Server, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Layers, Cpu, HardDrive } from 'lucide-react';
import BrandIcon from '../common/BrandIcon';

export default function ProxmoxSettings() {
  const { settings, updateSettings, loading } = useSettings();
  const { t } = useLanguage();
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
      setTestResult({ success: true, message: res.data.message || t('proxmox.test_success', 'Pomyślnie połączono z API Proxmox VE!') });
      addToast(t('proxmox.test_success', 'Połączenie z Proxmox VE zostało zweryfikowane'), 'success');
    } catch (err) {
      setTestResult({ success: false, message: err.response?.data?.error || err.message || t('proxmox.test_error', 'Nie udało się połączyć z Proxmox API') });
      addToast(t('proxmox.test_error', 'Test połączenia Proxmox nie powiódł się'), 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(formData);
      addToast(t('proxmox.saved', 'Zapisano ustawienia integracji z Proxmox VE'), 'success');
    } catch (err) {
      addToast(t('common.error', 'Błąd podczas zapisywania ustawień'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">{t('common.loading', 'Ładowanie ustawień...')}</div>;

  return (
    <div className="space-y-5 animate-in fade-in duration-200 max-w-3xl">
      <div className="pb-2 border-b border-slate-200 dark:border-[#1c2534]">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
          {t('proxmox.title', 'Integracja z Proxmox VE')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {t('proxmox.subtitle', 'Podłącz swój węzeł Proxmox VE, aby wyświetlać telemetrię CPU/RAM/Dysk oraz stan kontenerów LXC i maszyn VM.')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Enable Integration Card */}
        <div className="p-4 sm:p-5 rounded-lg bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1d2635] space-y-4 shadow-sm dark:shadow-none transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-white dark:bg-[#192231] border border-slate-200 dark:border-[#222d41] flex items-center justify-center flex-shrink-0 text-orange-500 dark:text-orange-400 shadow-sm dark:shadow-none">
                <BrandIcon name="proxmox" color="#e57000" className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {t('proxmox.enable_title', 'Włącz telemetrię Proxmox VE')}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t('proxmox.enable_desc', 'Pobiera metryki i statusy maszyn w czasie rzeczywistym')}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="proxmox_enabled"
                checked={formData.proxmox_enabled === 'true'}
                onChange={handleChange}
                className="w-4 h-4 rounded accent-blue-600 dark:accent-blue-500 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Proxmox API Credentials Card */}
        <div className="p-4 sm:p-5 rounded-lg bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1d2635] space-y-4 shadow-sm dark:shadow-none transition-colors">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-200 dark:border-[#1c2534]">
            {t('proxmox.creds_title', 'Dane węzła i Token API Proxmox')}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label={t('proxmox.host_label', 'Adres IP / Host Proxmox')}
                name="proxmox_host"
                value={formData.proxmox_host}
                onChange={handleChange}
                placeholder="np. 192.168.1.10 lub pve.homelab.local"
              />
            </div>
            <div>
              <Input
                label={t('proxmox.port_label', 'Port API')}
                name="proxmox_port"
                value={formData.proxmox_port}
                onChange={handleChange}
                placeholder="8006"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('proxmox.node_label', 'Nazwa węzła (Node)')}
              name="proxmox_node"
              value={formData.proxmox_node}
              onChange={handleChange}
              placeholder="pve"
            />
            <Input
              label={t('proxmox.token_id_label', 'Token ID')}
              name="proxmox_token_id"
              value={formData.proxmox_token_id}
              onChange={handleChange}
              placeholder="root@pam!nexuspanel"
            />
          </div>

          <div>
            <Input
              label={t('proxmox.token_secret_label', 'Token Secret (UUID)')}
              name="proxmox_token_secret"
              type="password"
              value={formData.proxmox_token_secret}
              onChange={handleChange}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              name="proxmox_verify_ssl"
              checked={formData.proxmox_verify_ssl === 'true'}
              onChange={handleChange}
              className="w-4 h-4 rounded accent-blue-600 dark:accent-blue-500 cursor-pointer"
            />
            <span>{t('proxmox.verify_ssl_label', 'Weryfikuj certyfikat SSL (Odznacz, jeśli używasz certyfikatu self-signed)')}</span>
          </label>
        </div>

        {/* Test Result Feedback */}
        {testResult && (
          <div className={`p-3 rounded-lg border text-xs flex items-center gap-2.5 font-mono ${
            testResult.success 
              ? 'bg-emerald-50 dark:bg-[#18202d] border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400' 
              : 'bg-rose-50 dark:bg-[#18202d] border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-400'
          }`}>
            {testResult.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span className="font-medium">{testResult.message}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          <Button
            type="button"
            variant="secondary"
            onClick={handleTestConnection}
            isLoading={testing}
            disabled={!formData.proxmox_host || !formData.proxmox_token_id}
            className="text-xs font-medium"
          >
            {t('proxmox.test_btn', 'Testuj połączenie')}
          </Button>

          <Button
            type="submit"
            isLoading={saving}
            className="px-5 py-2 text-xs font-medium"
          >
            {t('proxmox.save_btn', 'Zapisz ustawienia Proxmox')}
          </Button>
        </div>
      </form>
    </div>
  );
}
