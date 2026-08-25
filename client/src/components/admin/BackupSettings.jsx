import React, { useRef, useState } from 'react';
import { Download, Upload, AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';

export default function BackupSettings() {
  const { addToast } = useToast();
  const { t } = useLanguage();
  const fileInputRef = useRef(null);

  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [confirmImport, setConfirmImport] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [parsedData, setParsedData] = useState(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await api.backup.exportBackup();
      const backupJson = JSON.stringify(response.data, null, 2);
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `nexuspanel-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      addToast(t('common.saved', 'Kopia zapasowa została pomyślnie wyeksportowana'), 'success');
    } catch (err) {
      addToast(t('common.error', 'Nie udało się wyeksportować kopii zapasowej'), 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (!json.categories || !json.services || !json.settings) {
          addToast(t('empty.import_invalid', 'Nieprawidłowa struktura pliku kopii zapasowej.'), 'error');
          return;
        }
        setParsedData(json);
        setConfirmImport(file);
      } catch (err) {
        addToast(t('empty.import_invalid', 'Wybrany plik nie jest prawidłowym plikiem JSON'), 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const executeImport = async () => {
    if (!parsedData) return;
    setImporting(true);
    try {
      await api.backup.importBackup(parsedData);
      addToast(t('empty.import_success', 'Kopia zapasowa została pomyślnie przywrócona. Przeładowywanie...'), 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 1200);
    } catch (err) {
      addToast(err.response?.data?.error || t('common.error', 'Błąd importu kopii zapasowej'), 'error');
    } finally {
      setImporting(false);
      setConfirmImport(null);
      setParsedData(null);
    }
  };

  const executeFactoryReset = async () => {
    setResetting(true);
    try {
      const res = await api.backup.factoryReset();
      addToast(res.data?.message || t('backup.reset_title', 'Przywrócono ustawienia fabryczne!'), 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 1200);
    } catch (err) {
      addToast(err.response?.data?.error || t('common.error', 'Błąd podczas przywracania ustawień fabrycznych'), 'error');
    } finally {
      setResetting(false);
      setShowResetConfirm(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="pb-2 border-b border-[#1c2534]">
        <h2 className="text-base sm:text-lg font-semibold text-slate-100 tracking-tight">
          {t('backup.title', 'Kopia Zapasowa i Reset')}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {t('backup.subtitle', 'Eksportuj konfigurację do pliku, przywracaj kopie zapasowe lub zresetuj NexusPanel do stanu fabrycznego.')}
        </p>
      </div>
      
      <div className="max-w-3xl space-y-5">
        
        {/* 1. Export Section */}
        <section className="p-4 sm:p-5 bg-[#111622] border border-[#1d2635] rounded-lg">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-md bg-[#192231] border border-[#222d41] text-blue-400 flex items-center justify-center flex-shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                {t('backup.export_title', 'Eksportuj konfigurację')}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('backup.export_desc', 'Pobierz plik JSON zawierający wszystkie Twoje usługi, kategorie, tagi oraz ustawienia wyglądu. Hasła i konta użytkowników nie są eksportowane.')}
              </p>
              <div className="pt-1">
                <Button variant="secondary" onClick={handleExport} isLoading={exporting} icon={Download} size="sm">
                  {t('backup.btn_export', 'Pobierz kopię zapasową (.json)')}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Import Section */}
        <section className="p-4 sm:p-5 bg-[#111622] border border-[#1d2635] rounded-lg">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-md bg-[#192231] border border-[#222d41] text-amber-400 flex items-center justify-center flex-shrink-0">
              <Upload className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                {t('backup.import_title', 'Importuj konfigurację')}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('backup.import_desc', 'Przywróć układ i usługi z wcześniej pobranego pliku JSON kopii zapasowej NexusPanel.')}
              </p>
              <div className="p-2.5 bg-[#18202d] border border-amber-500/25 rounded-md flex items-start gap-2.5 text-amber-300 text-xs font-mono">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-400" />
                <span>{t('backup.import_warning', 'Uwaga: Import kopii zastąpi obecne usługi, kategorie i motyw zawartością pliku.')}</span>
              </div>
              
              <input 
                type="file" 
                accept=".json,application/json" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
              />
              <div className="pt-1">
                <Button 
                  variant="secondary" 
                  onClick={() => fileInputRef.current?.click()} 
                  isLoading={importing} 
                  icon={Upload}
                  size="sm"
                >
                  {t('backup.btn_import', 'Wybierz plik kopii (.json)')}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Factory Reset (Danger Zone) */}
        <section className="p-4 sm:p-5 bg-[#111622] border border-rose-500/30 rounded-lg">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-md bg-rose-500/10 border border-rose-500/25 text-rose-400 flex items-center justify-center flex-shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-2.5">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                  {t('backup.reset_title', 'Przywrócenie ustawień fabrycznych')}
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-rose-500/10 text-rose-400 border border-rose-500/25">
                  {t('backup.reset_danger_zone', 'Strefa niebezpieczna')}
                </span>
              </div>
              
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('backup.reset_desc', 'Całkowicie czyści bazę danych i przywraca NexusPanel do stanu czystej instalacji. Wszystkie usługi, kategorie, tagi i personalizacje zostaną trwale usunięte.')}
              </p>

              <div className="pt-1">
                <Button 
                  variant="danger" 
                  onClick={() => setShowResetConfirm(true)} 
                  isLoading={resetting} 
                  icon={Trash2}
                  size="sm"
                >
                  {t('backup.btn_reset', 'Przywróć ustawienia fabryczne ⚠️')}
                </Button>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Import Confirmation Dialog */}
      {confirmImport && (
        <ConfirmDialog
          title={t('backup.confirm_import_title', 'Potwierdź import kopii zapasowej')}
          message={t('backup.confirm_import_msg', `Czy na pewno chcesz zaimportować plik "${confirmImport.name}"? Zastąpi to obecne usługi i kategorie zawartością z pliku.`).replace('{file}', confirmImport.name)}
          confirmText={t('backup.confirm_import_btn', 'Importuj kopię')}
          onConfirm={executeImport}
          onCancel={() => {
            setConfirmImport(null);
            setParsedData(null);
          }}
        />
      )}

      {/* Factory Reset Confirmation Dialog */}
      {showResetConfirm && (
        <ConfirmDialog
          title={t('backup.confirm_reset_title', '⚠️ Przywrócić ustawienia fabryczne?')}
          message={t('backup.confirm_reset_msg', 'Czy na pewno chcesz całkowicie zresetować aplikację? Wszystkie dodane kafelki, kategorie i ustawienia zostaną bezpowrotnie usunięte, a aplikacja powróci do ekranu powitalnego nowej instalacji.')}
          confirmText={t('backup.confirm_reset_btn', 'Tak, zresetuj wszystko')}
          confirmVariant="danger"
          onConfirm={executeFactoryReset}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  );
}
