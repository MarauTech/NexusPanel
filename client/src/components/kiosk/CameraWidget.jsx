import React, { useState, useEffect } from 'react';
import { Camera, Settings, Maximize2, RefreshCw, AlertCircle, Sparkles, X } from 'lucide-react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { useSettings } from '../../hooks/useSettings';
import { useToast } from '../../contexts/ToastContext';

export default function CameraWidget({ overrideUrl, title = 'Kamera CCTV' }) {
  const { settings, updateSettings } = useSettings();
  const { addToast } = useToast();

  const cameraName = settings?.camera_name || title;
  const cameraUrl = overrideUrl || settings?.camera_url || '';
  const cameraInterval = parseInt(settings?.camera_interval || '3', 10);
  const isEnabled = settings?.camera_enabled === 'true';

  const [currentSrc, setCurrentSrc] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [formData, setFormData] = useState({
    camera_name: cameraName,
    camera_url: cameraUrl,
    camera_interval: String(cameraInterval),
    camera_enabled: isEnabled ? 'true' : 'false'
  });

  // Auto-refresh snapshot
  useEffect(() => {
    if (!cameraUrl) {
      setCurrentSrc('');
      return;
    }

    const refreshImage = () => {
      setHasError(false);
      const separator = cameraUrl.includes('?') ? '&' : '?';
      setCurrentSrc(`${cameraUrl}${separator}_t=${Date.now()}`);
    };

    refreshImage();
    const interval = setInterval(refreshImage, Math.max(1, cameraInterval) * 1000);
    return () => clearInterval(interval);
  }, [cameraUrl, cameraInterval]);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      await updateSettings(formData);
      addToast('Ustawienia kamery zostały zapisane', 'success');
      setIsConfigOpen(false);
    } catch (err) {
      addToast('Nie udało się zapisać ustawień kamery', 'error');
    }
  };

  const handleManualRefresh = () => {
    if (!cameraUrl) return;
    setIsRefreshing(true);
    const separator = cameraUrl.includes('?') ? '&' : '?';
    setCurrentSrc(`${cameraUrl}${separator}_t=${Date.now()}`);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="p-4 sm:p-5 rounded-[24px] glass-card border border-black/[0.08] dark:border-white/10 space-y-3 shadow-xl relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/10">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white truncate">
            {cameraName}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          {cameraUrl && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-rose-500/15 text-rose-500 border border-rose-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              LIVE
            </span>
          )}

          {cameraUrl && (
            <button
              onClick={() => setIsFullscreenOpen(true)}
              className="p-1.5 rounded-xl glass-pill text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Powiększ obraz"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => {
              setFormData({
                camera_name: settings?.camera_name || 'Kamera CCTV',
                camera_url: settings?.camera_url || '',
                camera_interval: settings?.camera_interval || '3',
                camera_enabled: settings?.camera_enabled || 'true'
              });
              setIsConfigOpen(true);
            }}
            className="p-1.5 rounded-xl glass-pill text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Konfiguruj kamerę"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Snapshot Preview Window */}
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/50 border border-black/[0.1] dark:border-white/10 flex items-center justify-center group">
        {cameraUrl && !hasError ? (
          <>
            <img
              src={currentSrc}
              alt={cameraName}
              onError={() => setHasError(true)}
              className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
              onClick={() => setIsFullscreenOpen(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3 text-white text-xs">
              <span className="font-bold">{cameraName}</span>
              <span className="text-[10px] font-mono text-slate-300">Odświeżanie: {cameraInterval}s</span>
            </div>
          </>
        ) : (
          <div className="text-center p-6 space-y-2">
            <Camera className="w-8 h-8 text-slate-500 mx-auto opacity-60" />
            <div>
              <p className="text-xs font-bold text-slate-400">
                {hasError ? 'Błąd ładowania obrazu z kamery' : 'Brak skonfigurowanej kamery'}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {hasError ? 'Sprawdź adres URL i dostępność sieci' : 'Kliknij ikonę koła zębatego, aby podać link snapshotu'}
              </p>
            </div>
            <button
              onClick={() => setIsConfigOpen(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-accent/20 text-accent hover:bg-accent hover:text-white transition-all cursor-pointer"
            >
              + Skonfiguruj kamerę
            </button>
          </div>
        )}
      </div>

      {/* Fullscreen Camera Modal */}
      {isFullscreenOpen && cameraUrl && (
        <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8 animate-in fade-in select-none">
          <div className="flex items-center justify-between text-white pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <Camera className="w-6 h-6 text-accent" />
              <div>
                <h2 className="text-lg font-black">{cameraName}</h2>
                <span className="text-xs text-slate-400 font-mono">Podgląd na żywo · Odświeżanie co {cameraInterval}s</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleManualRefresh}
                className="p-2.5 rounded-2xl glass-pill text-white hover:text-accent transition-all cursor-pointer"
                title="Odśwież teraz"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setIsFullscreenOpen(false)}
                className="p-2.5 rounded-2xl glass-pill text-white hover:text-rose-400 transition-all cursor-pointer"
                title="Zamknij"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center my-4 overflow-hidden rounded-3xl border border-white/10 bg-black">
            <img
              src={currentSrc}
              alt={cameraName}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl"
            />
          </div>

          <div className="text-center text-xs text-slate-500 font-mono">
            Dotknij dowolnego miejsca lub naciśnij Esc, aby zamknąć podgląd
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {isConfigOpen && (
        <Modal title="Konfiguracja Podglądu Kamery / Drukarki 3D" onClose={() => setIsConfigOpen(false)}>
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <Input
              label="Nazwa kamery / urządzenia *"
              value={formData.camera_name}
              onChange={e => setFormData(prev => ({ ...prev, camera_name: e.target.value }))}
              placeholder="np. Kamera Wejście, Drukarka 3D BambuLab, Frigate"
              required
            />

            <Input
              label="Adres URL Snapshotu (JPEG / MJPEG / Stream) *"
              value={formData.camera_url}
              onChange={e => setFormData(prev => ({ ...prev, camera_url: e.target.value }))}
              placeholder="np. http://192.168.1.50/snap.jpg lub http://192.168.1.60:8080/?action=snapshot"
              helper="Obsługuje bezpośrednie linki do obrazów z kamer IP, OctoPrint, PrusaLink, Home Assistant czy Frigate."
            />

            <Input
              label="Częstotliwość odświeżania (sekundy)"
              type="number"
              min="1"
              max="60"
              value={formData.camera_interval}
              onChange={e => setFormData(prev => ({ ...prev, camera_interval: e.target.value }))}
              helper="Domyślnie: 3 sekundy (dla płynnego podglądu bez przeciążania sieci)."
            />

            <div className="flex justify-end gap-2 pt-4 border-t border-black/[0.06] dark:border-white/10">
              <Button type="button" variant="ghost" onClick={() => setIsConfigOpen(false)}>
                Anuluj
              </Button>
              <Button type="submit">
                Zapisz kamerę
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
