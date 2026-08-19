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
      setTestResult({ success: true, message: res.data.message || 'Connected to Proxmox VE API successfully!' });
      addToast('Proxmox API connection verified', 'success');
    } catch (err) {
      setTestResult({ success: false, message: err.response?.data?.error || err.message || 'Failed to connect to Proxmox API' });
      addToast('Proxmox API test failed', 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(formData);
      addToast('Proxmox VE settings saved successfully', 'success');
    } catch (err) {
      addToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-text-secondary animate-pulse">Loading settings...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-3xl">
      <div>
        <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">Proxmox VE Integration</h2>
        <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
          Connect your Proxmox Virtual Environment node to display live CPU/RAM/Storage gauges and LXC container telemetry in NexusPanel.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Enable Integration Card */}
        <div className="p-5 rounded-2xl glass-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#e57000] flex items-center justify-center text-white shadow-md">
                <BrandIcon name="proxmox" color="#ffffff" className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">Enable Proxmox VE Telemetry</h3>
                <p className="text-xs text-text-secondary">Fetches live metrics and container statuses every 10 seconds</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="proxmox_enabled"
                checked={formData.proxmox_enabled === 'true'}
                onChange={handleChange}
                className="w-5 h-5 rounded accent-accent"
              />
            </label>
          </div>
        </div>

        {/* API Credentials */}
        <div className="p-5 rounded-2xl glass-card space-y-4">
          <h3 className="text-sm font-bold text-text-primary border-b border-white/10 pb-2">
            Node & API Token Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Proxmox Host / IP"
                name="proxmox_host"
                value={formData.proxmox_host}
                onChange={handleChange}
                placeholder="192.168.1.10 or pve.homelab.local"
                helperText="Leave empty for Demo Simulator Mode"
              />
            </div>
            <Input
              label="API Port"
              name="proxmox_port"
              value={formData.proxmox_port}
              onChange={handleChange}
              placeholder="8006"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Node Name"
              name="proxmox_node"
              value={formData.proxmox_node}
              onChange={handleChange}
              placeholder="pve (or pve-node01)"
            />
            <Input
              label="API Token ID"
              name="proxmox_token_id"
              value={formData.proxmox_token_id}
              onChange={handleChange}
              placeholder="root@pam!nexuspanel"
            />
          </div>

          <Input
            label="API Token Secret (UUID)"
            name="proxmox_token_secret"
            type="password"
            value={formData.proxmox_token_secret}
            onChange={handleChange}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          />

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="proxmox_verify_ssl"
                checked={formData.proxmox_verify_ssl === 'true'}
                onChange={handleChange}
                className="rounded accent-accent"
              />
              <span className="text-xs font-semibold text-text-primary">
                Enforce Strict SSL Certificate Verification (Disable if using self-signed certs)
              </span>
            </label>
          </div>
        </div>

        {/* Test Result Banner */}
        {testResult && (
          <div className={`p-4 rounded-2xl glass-card flex items-start gap-3 border ${
            testResult.success 
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' 
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}>
            {testResult.success ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            <div className="text-xs font-semibold">
              {testResult.message}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={handleTestConnection} isLoading={testing}>
            Test Connection
          </Button>
          <Button type="submit" isLoading={saving}>
            Save Proxmox Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
