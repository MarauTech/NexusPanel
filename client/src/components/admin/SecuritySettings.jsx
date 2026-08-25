import React, { useState } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Shield, Lock, KeyRound, CheckCircle2, AlertTriangle, Radio } from 'lucide-react';

export default function SecuritySettings() {
  const { addToast } = useToast();
  const { t } = useLanguage();
  const [passForm, setPassForm] = useState({ current: '', new: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handlePassChange = (e) => {
    setPassForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePassSubmit = async (e) => {
    e.preventDefault();
    if (passForm.new !== passForm.confirm) {
      addToast(t('security.pass_mismatch', 'Wprowadzone hasła nie są identyczne'), 'error');
      return;
    }
    if (passForm.new.length < 12) {
      addToast(t('security.pass_too_short', 'Nowe hasło musi zawierać co najmniej 12 znaków'), 'error');
      return;
    }

    setLoading(true);
    try {
      await api.auth.changePassword({
        currentPassword: passForm.current,
        newPassword: passForm.new
      });
      addToast(t('security.pass_success', 'Hasło zostało pomyślnie zaktualizowane'), 'success');
      setPassForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      addToast(err.response?.data?.error || t('common.error', 'Nie udało się zmienić hasła'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200 max-w-3xl">
      <div className="pb-2 border-b border-slate-200 dark:border-[#1c2534]">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
          {t('security.title', 'Bezpieczeństwo i Dostęp')}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {t('security.subtitle', 'Zarządzaj dostępem w sieci lokalnej, uprawnieniami administratora i zabezpieczeniami API.')}
        </p>
      </div>

      <div className="space-y-5">
        {/* Network Access Mode Card */}
        <div className="p-4 sm:p-5 rounded-lg bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1d2635] space-y-3.5 shadow-sm dark:shadow-none transition-colors">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-[#1c2534]">
            <Radio className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {t('security.zero_auth_title', 'Lokalny tryb sieci homelab')}
            </h3>
          </div>

          <div className="p-3.5 rounded-lg bg-white dark:bg-[#18202d] border border-emerald-500/30 flex items-start gap-3 shadow-sm dark:shadow-none">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-xs text-emerald-600 dark:text-emerald-400 block">
                {t('security.zero_auth_badge', 'Tryb Zero-Auth aktywny (Otwarty dostęp w sieci LAN)')}
              </span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                {t('security.zero_auth_desc', 'NexusPanel działa w zaufanym trybie homelab. Urządzenia w Twojej sieci lokalnej oraz VPN mają bezpośredni, wygodny dostęp do pulpitu i ustawień bez uciążliwego logowania hasłem.')}
              </p>
            </div>
          </div>
        </div>

        {/* Admin Password Change Card */}
        <div className="p-4 sm:p-5 rounded-lg bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1d2635] space-y-4 shadow-sm dark:shadow-none transition-colors">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-[#1c2534]">
            <KeyRound className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {t('security.change_password', 'Zmień hasło administratora')}
            </h3>
          </div>

          <form onSubmit={handlePassSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                label={t('security.new_password', 'Nowe hasło (min. 12 znaków)')} 
                type="password" 
                name="new" 
                value={passForm.new} 
                onChange={handlePassChange} 
                placeholder="Min. 12 znaków"
                required 
              />
              <Input 
                label={t('security.confirm_password', 'Powtórz nowe hasło')} 
                type="password" 
                name="confirm" 
                value={passForm.confirm} 
                onChange={handlePassChange} 
                placeholder="Wpisz ponownie nowe hasło"
                required 
              />
            </div>

            <div className="pt-1">
              <Button type="submit" isLoading={loading} className="px-5 py-2 text-xs font-medium">
                {t('security.btn_update_pass', 'Zapisz nowe hasło')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
