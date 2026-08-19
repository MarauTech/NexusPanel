import React, { useRef, useState } from 'react';
import { Download, Upload, AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

export default function BackupSettings() {
  const { addToast } = useToast();
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
      addToast('Kopia zapasowa została pomyślnie wyeksportowana', 'success');
    } catch (err) {
      addToast('Nie udało się wyeksportować kopii zapasowej', 'error');
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
          addToast('Nieprawidłowa struktura pliku kopii zapasowej.', 'error');
          return;
        }
        setParsedData(json);
        setConfirmImport(file);
      } catch (err) {
        addToast('Wybrany plik nie jest prawidłowym plikiem JSON', 'error');
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
      addToast('Kopia zapasowa została pomyślnie przywrócona. Przeładowywanie...', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 1200);
    } catch (err) {
      addToast(err.response?.data?.error || 'Błąd importu kopii zapasowej', 'error');
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
      addToast(res.data?.message || 'Przywrócono ustawienia fabryczne!', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 1200);
    } catch (err) {
      addToast(err.response?.data?.error || 'Błąd podczas przywracania ustawień fabrycznych', 'error');
    } finally {
      setResetting(false);
      setShowResetConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Kopia Zapasowa i Reset</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Eksportuj konfigurację do pliku, przywracaj kopie zapasowe lub zresetuj NexusPanel do stanu fabrycznego.
        </p>
      </div>
      
      <div className="max-w-3xl space-y-6">
        
        {/* 1. Export Section */}
        <section className="p-6 glass-card border border-black/[0.08] dark:border-white/10 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center flex-shrink-0 shadow-md">
              <Download className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Eksportuj konfigurację</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Pobierz plik JSON zawierający wszystkie Twoje usługi, kategorie, tagi oraz ustawienia wyglądu. Hasła i konta użytkowników nie są eksportowane.
              </p>
              <Button onClick={handleExport} isLoading={exporting} icon={Download} size="sm">
                Pobierz kopię zapasową (.json)
              </Button>
            </div>
          </div>
        </section>

        {/* 2. Import Section */}
        <section className="p-6 glass-card border border-black/[0.08] dark:border-white/10 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center flex-shrink-0 shadow-md">
              <Upload className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Importuj konfigurację</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Przywróć układ i usługi z wcześniej pobranego pliku JSON kopii zapasowej NexusPanel.
              </p>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-amber-700 dark:text-amber-300 text-xs">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                <span>Uwaga: Import kopii zastąpi obecne usługi, kategorie i motyw zawartością pliku.</span>
              </div>
              
              <input 
                type="file" 
                accept=".json,application/json" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
              />
              <Button 
                variant="secondary" 
                onClick={() => fileInputRef.current?.click()} 
                isLoading={importing} 
                icon={Upload}
                size="sm"
              >
                Wybierz plik kopii (.json)
              </Button>
            </div>
          </div>
        </section>

        {/* 3. Factory Reset (Danger Zone) */}
        <section className="p-6 glass-card border border-rose-500/30 bg-gradient-to-b from-rose-500/10 via-transparent to-transparent rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center flex-shrink-0 shadow-md border border-rose-500/30">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-rose-600 dark:text-rose-300">Przywrócenie ustawień fabrycznych</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  Strefa niebezpieczna
                </span>
              </div>
              
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Całkowicie czyści bazę danych i przywraca NexusPanel do stanu czystej instalacji. Wszystkie usługi, kategorie, tagi i personalizacje zostaną trwale usunięte.
              </p>

              <Button 
                variant="danger" 
                onClick={() => setShowResetConfirm(true)} 
                isLoading={resetting} 
                icon={Trash2}
                size="sm"
                className="shadow-lg shadow-rose-500/20"
              >
                Przywróć ustawienia fabryczne ⚠️
              </Button>
            </div>
          </div>
        </section>

      </div>

      {/* Import Confirmation Dialog */}
      {confirmImport && (
        <ConfirmDialog
          title="Potwierdź import kopii zapasowej"
          message={`Czy na pewno chcesz zaimportować plik "${confirmImport.name}"? Zastąpi to obecne usługi i kategorie zawartością z pliku.`}
          confirmText="Importuj kopię"
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
          title="⚠️ Przywrócić ustawienia fabryczne?"
          message="Czy na pewno chcesz całkowicie zresetować aplikację? Wszystkie dodane kafelki, kategorie i ustawienia zostaną bezpowrotnie usunięte, a aplikacja powróci do ekranu powitalnego nowej instalacji."
          confirmText="Tak, zresetuj wszystko"
          confirmVariant="danger"
          onConfirm={executeFactoryReset}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </div>
  );
}
