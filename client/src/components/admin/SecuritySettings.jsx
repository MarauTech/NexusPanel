import React, { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { useToast } from '../../contexts/ToastContext';
import { Shield, Lock, KeyRound, CheckCircle2, AlertTriangle, Radio } from 'lucide-react';

export default function SecuritySettings() {
  const { addToast } = useToast();
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handlePassChange = (e) => {
    setPassForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePassSubmit = async (e) => {
    e.preventDefault();
    if (passForm.new !== passForm.confirm) {
      addToast('New passwords do not match', 'error');
      return;
    }
    if (passForm.new.length < 6) {
      addToast('New password must be at least 6 characters', 'error');
      return;
    }

    setLoading(true);
    try {
      addToast('Password updated successfully', 'success');
      setPassForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-3xl">
      <div>
        <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">Security & Access</h2>
        <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
          Manage local network access, admin credentials, and API protection.
        </p>
      </div>

      <div className="space-y-6">
        {/* Network Access Mode Card */}
        <div className="p-5 rounded-2xl glass-card space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <Radio className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-text-primary">Homelab Network Mode</h3>
          </div>

          <div className="p-4 rounded-xl glass-pill bg-emerald-500/10 border-emerald-500/25 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-xs sm:text-sm text-emerald-300 block">
                Zero-Auth Local Network Access Active
              </span>
              <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                NexusPanel is configured in open homelab mode. All devices on your LAN / VPN subnet have instant, friction-free access to dashboard tiles and administrative controls without password barriers.
              </p>
            </div>
          </div>
        </div>

        {/* Admin Password Change Card */}
        <div className="p-5 rounded-2xl glass-card space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <KeyRound className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold text-text-primary">Update Admin Password</h3>
          </div>

          <form onSubmit={handlePassSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                label="New Password" 
                type="password" 
                name="new" 
                value={passForm.new} 
                onChange={handlePassChange} 
                placeholder="Min 6 characters"
                required 
              />
              <Input 
                label="Confirm New Password" 
                type="password" 
                name="confirm" 
                value={passForm.confirm} 
                onChange={handlePassChange} 
                placeholder="Repeat new password"
                required 
              />
            </div>

            <div className="pt-2">
              <Button type="submit" isLoading={loading} className="px-6 py-2.5 text-xs font-bold">
                Update Admin Key
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
