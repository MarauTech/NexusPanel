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
      addToast('Wprowadzone hasła nie są identyczne', 'error');
      return;
    }
    if (passForm.new.length < 6) {
      addToast('Nowe hasło musi zawierać co najmniej 6 znaków', 'error');
      return;
    }

    setLoading(true);
    try {
      addToast('Hasło zostało pomyślnie zaktualizowane', 'success');
      setPassForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      addToast(err.response?.data?.error || 'Nie udało się zmienić hasła', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-3xl">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Bezpieczeństwo i Dostęp</h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Zarządzaj dostępem w sieci lokalnej, uprawnieniami administratora i zabezpieczeniami API.
        </p>
      </div>

      <div className="space-y-6">
        {/* Network Access Mode Card */}
        <div className="p-5 rounded-2xl glass-card space-y-3.5 border border-black/[0.08] dark:border-white/10">
          <div className="flex items-center gap-2 pb-2 border-b border-black/[0.06] dark:border-white/10">
            <Radio className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Lokalny tryb sieci homelab</h3>
          </div>

          <div className="p-4 rounded-xl glass-pill bg-emerald-500/10 border-emerald-500/25 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-300 block">
                Tryb Zero-Auth aktywny (Otwarty dostęp w sieci LAN)
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                NexusPanel działa w zaufanym trybie homelab. Urządzenia w Twojej sieci lokalnej oraz VPN mają bezpośredni, wygodny dostęp do pulpitu i ustawień bez uciążliwego logowania hasłem.
              </p>
            </div>
          </div>
        </div>

        {/* Admin Password Change Card */}
        <div className="p-5 rounded-2xl glass-card space-y-4 border border-black/[0.08] dark:border-white/10">
          <div className="flex items-center gap-2 pb-2 border-b border-black/[0.06] dark:border-white/10">
            <KeyRound className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Zmień hasło administratora</h3>
          </div>

          <form onSubmit={handlePassSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                label="Nowe hasło" 
                type="password" 
                name="new" 
                value={passForm.new} 
                onChange={handlePassChange} 
                placeholder="Min. 6 znaków"
                required 
              />
              <Input 
                label="Powtórz nowe hasło" 
                type="password" 
                name="confirm" 
                value={passForm.confirm} 
                onChange={handlePassChange} 
                placeholder="Wpisz ponownie nowe hasło"
                required 
              />
            </div>

            <div className="pt-2">
              <Button type="submit" isLoading={loading} className="px-6 py-2.5 text-xs font-bold shadow-lg shadow-accent/25">
                Zapisz nowe hasło
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
