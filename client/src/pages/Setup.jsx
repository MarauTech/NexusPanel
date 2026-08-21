import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { Rocket, Globe, CheckCircle2, ArrowRight } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function Setup() {
  const { language, setLanguage, t } = useLanguage();
  const [step, setStep] = useState(1); // 1: Language Selection, 2: Account Creation
  const [selectedLang, setSelectedLang] = useState(language || 'pl');

  const [formData, setFormData] = useState({
    username: 'admin',
    password: '',
    confirmPassword: '',
    dashboardName: 'NexusPanel'
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleLanguageSelect = (lang) => {
    setSelectedLang(lang);
    setLanguage(lang);
  };

  const handleLanguageNext = () => {
    setLanguage(selectedLang);
    setStep(2);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      addToast(t('setup.passwords_mismatch', 'Hasła nie są identyczne'), 'error');
      return;
    }
    if (formData.password.length < 6) {
      addToast(t('setup.password_too_short', 'Hasło musi mieć co najmniej 6 znaków'), 'error');
      return;
    }
    setLoading(true);
    try {
      await api.auth.setup({
        username: formData.username,
        password: formData.password,
        dashboardName: formData.dashboardName
      });
      await api.settings.updateSettings({ language: selectedLang });
      await login(formData.username, formData.password);
      addToast(t('setup.success', 'Konfiguracja zakończona pomyślnie!'), 'success');
      navigate('/');
    } catch (err) {
      addToast(t('common.error', 'Nie udało się zakończyć konfiguracji'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-secondary p-4 select-none">
      <div className="w-full max-w-md bg-bg-card rounded-[28px] shadow-2xl border border-border p-6 sm:p-8 transition-all animate-in fade-in zoom-in-95 duration-300">
        
        {/* =========================================================
            STEP 1: LANGUAGE SELECTION (WYBÓR JĘZYKA)
           ========================================================= */}
        {step === 1 ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-accent/15 border border-accent/30 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Globe className="w-7 h-7 text-accent" />
              </div>
              <h1 className="text-2xl font-black text-text-primary tracking-tight">
                {selectedLang === 'pl' ? 'Wybierz język' : 'Choose Language'}
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-xs">
                {selectedLang === 'pl' 
                  ? 'Wybierz preferowany język interfejsu panelu.' 
                  : 'Select your preferred interface language.'}
              </p>
            </div>

            {/* Language Cards */}
            <div className="grid grid-cols-1 gap-3">
              <div
                onClick={() => handleLanguageSelect('pl')}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedLang === 'pl'
                    ? 'bg-accent/15 border-accent shadow-md ring-2 ring-accent/30 scale-[1.02]'
                    : 'bg-black/[0.02] dark:bg-white/[0.02] border-border hover:border-accent/40'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-2xl">🇵🇱</span>
                  <div className="text-left">
                    <span className="font-extrabold text-sm text-text-primary block">Polski</span>
                    <span className="text-[11px] text-text-secondary">Polski interfejs językowy</span>
                  </div>
                </div>
                {selectedLang === 'pl' && (
                  <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                )}
              </div>

              <div
                onClick={() => handleLanguageSelect('en')}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                  selectedLang === 'en'
                    ? 'bg-accent/15 border-accent shadow-md ring-2 ring-accent/30 scale-[1.02]'
                    : 'bg-black/[0.02] dark:bg-white/[0.02] border-border hover:border-accent/40'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-2xl">🇬🇧</span>
                  <div className="text-left">
                    <span className="font-extrabold text-sm text-text-primary block">English</span>
                    <span className="text-[11px] text-text-secondary">English interface language</span>
                  </div>
                </div>
                {selectedLang === 'en' && (
                  <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                )}
              </div>
            </div>

            <Button
              onClick={handleLanguageNext}
              className="w-full py-3 text-sm font-bold shadow-lg shadow-accent/25"
            >
              {selectedLang === 'pl' ? 'Dalej ➔' : 'Continue ➔'}
            </Button>
          </div>
        ) : (
          /* =========================================================
             STEP 2: ADMINISTRATOR ACCOUNT SETUP
             ========================================================= */
          <div>
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="w-14 h-14 bg-accent/15 border border-accent/30 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
                <Rocket className="w-7 h-7 text-accent" />
              </div>
              <h1 className="text-2xl font-black text-text-primary tracking-tight">
                {t('setup.welcome_title', 'Witaj w NexusPanel')}
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                {t('setup.welcome_subtitle', "Skonfigurujmy Twoje pierwsze konto administratora.")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t('setup.dashboard_name', 'Nazwa Dashboardu')}
                name="dashboardName"
                value={formData.dashboardName}
                onChange={handleChange}
                placeholder={t('setup.dashboard_name_placeholder', 'np. NexusPanel Homelab')}
                required
              />

              <Input
                label={t('setup.username', 'Nazwa użytkownika')}
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />

              <Input
                label={t('setup.password', 'Hasło (min. 6 znaków)')}
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />

              <Input
                label={t('setup.confirm_password', 'Potwierdź hasło')}
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="text-xs"
                >
                  {t('common.back', 'Wstecz')}
                </Button>

                <Button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold shadow-lg shadow-accent/25"
                  isLoading={loading}
                >
                  {t('setup.btn_create', 'Utwórz konto i rozpocznij ➔')}
                </Button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
