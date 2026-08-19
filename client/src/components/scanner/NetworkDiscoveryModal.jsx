import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import BrandIcon from '../common/BrandIcon';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Radar, Sparkles, CheckCircle2, Search, ArrowRight, 
  Layers, Globe, CheckSquare, Square, RefreshCw, Cpu, Network, Shield
} from 'lucide-react';

export default function NetworkDiscoveryModal({ onClose, onSuccess }) {
  const { addToast } = useToast();
  const { t } = useLanguage();

  const [scanning, setScanning] = useState(true);
  const [discovered, setDiscovered] = useState([]);
  const [netInfo, setNetInfo] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [customIp, setCustomIp] = useState('');

  const runScan = async (hosts = []) => {
    setScanning(true);
    try {
      let res;
      if (hosts.length > 0) {
        res = await api.scanner.scanCustom(hosts);
      } else {
        res = await api.scanner.discover();
      }

      const rawItems = res.data?.discovered || [];
      // Filter loopbacks
      const items = rawItems.filter(item => item.host !== '127.0.0.1' && item.host !== 'localhost');

      if (res.data?.netInfo) {
        setNetInfo(res.data.netInfo);
      }
      setDiscovered(items);
      setSelectedIds(new Set(items.map(item => item.id)));
      
      if (items.length > 0) {
        addToast(`Znaleziono ${items.length} usług w podsieci ${res.data?.netInfo?.subnetPrefix || 'LAN'}!`, 'success');
      } else {
        addToast('Brak aktywnych portów. Możesz wpisać adres IP ręcznie.', 'info');
      }
    } catch (err) {
      addToast('Błąd skanowania: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    runScan();
  }, []);

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === discovered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(discovered.map(d => d.id)));
    }
  };

  const handleCustomScan = (e) => {
    e.preventDefault();
    if (!customIp.trim()) return;
    const ips = customIp.split(',').map(s => s.trim()).filter(Boolean);
    runScan(ips);
  };

  const handleAddSelected = async () => {
    const toAdd = discovered.filter(d => selectedIds.has(d.id));
    if (toAdd.length === 0) {
      addToast('Wybierz co najmniej jedną usługę do dodania', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await api.scanner.addBatch(toAdd);
      addToast(res.data?.message || `Pomyślnie dodano ${toAdd.length} usług do pulpitu!`, 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      addToast('Nie udało się zapisać usług: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal 
      title="Kreator Konfiguracji i Skaner Sieci LAN" 
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        
        {/* Banner with radar explanation & detected subnet info */}
        <div className="p-4 rounded-2xl glass-card border border-black/[0.08] dark:border-white/20 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white shadow-md flex-shrink-0">
                <Radar className={`w-5 h-5 ${scanning ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  {scanning ? 'Skanowanie podsieci LAN w toku...' : `Znaleziono ${discovered.length} aktywnych usług`}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Bada porty Proxmox, Home Assistant, Docker, Portainer, NAS, Plex, Grafana itp.
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              isLoading={scanning}
              onClick={() => runScan()}
              className="text-xs"
            >
              Skanuj ponownie
            </Button>
          </div>

          {netInfo && (
            <div className="flex items-center gap-2 pt-1 flex-wrap text-xs">
              <span className="px-2.5 py-1 rounded-xl glass-pill font-mono text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Network className="w-3 h-3 text-accent" />
                Podsieć: <b className="text-slate-900 dark:text-white">{netInfo.subnet}</b>
              </span>
              <span className="px-2.5 py-1 rounded-xl glass-pill font-mono text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-emerald-500" />
                Brama: <b className="text-slate-900 dark:text-white">{netInfo.gatewayIp}</b>
              </span>
              <span className="px-2.5 py-1 rounded-xl glass-pill font-mono text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-purple-400" />
                Twój IP: <b className="text-slate-900 dark:text-white">{netInfo.localIp}</b>
              </span>
            </div>
          )}
        </div>

        {/* Custom target scan input */}
        <form onSubmit={handleCustomScan} className="flex gap-2">
          <input
            type="text"
            value={customIp}
            onChange={(e) => setCustomIp(e.target.value)}
            placeholder="np. 192.168.10.10, 192.168.10.20 (lub wpisz inny adres IP)"
            className="flex-1 bg-black/[0.03] dark:bg-black/40 border border-black/[0.1] dark:border-white/15 focus:border-accent rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          <Button type="submit" variant="secondary" size="sm" isLoading={scanning}>
            Skanuj IP
          </Button>
        </form>

        {/* Action bar: Select all / Selected count */}
        {discovered.length > 0 && (
          <div className="flex items-center justify-between px-1 text-xs">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 font-bold text-accent hover:underline cursor-pointer"
            >
              {selectedIds.size === discovered.length ? (
                <>
                  <CheckSquare className="w-4 h-4" />
                  <span>Odznacz wszystkie</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4" />
                  <span>Zaznacz wszystkie</span>
                </>
              )}
            </button>
            <span className="font-semibold text-slate-500 dark:text-slate-400">
              Wybrano: <b className="text-slate-900 dark:text-white">{selectedIds.size}</b> z {discovered.length}
            </span>
          </div>
        )}

        {/* Discovered items list (Compact, balanced) */}
        <div className="max-h-[42vh] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {scanning && discovered.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-accent mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Badałem urządzenia w sieci LAN...</p>
            </div>
          ) : discovered.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-black/[0.1] dark:border-white/10 rounded-2xl">
              <p className="text-sm font-bold text-slate-900 dark:text-white">Nie wykryto aktywnych portów w podsieci</p>
              <p className="text-xs text-slate-400 mt-1">Użyj pola powyżej, aby przeskanować konkretny adres IP hosta.</p>
            </div>
          ) : (
            discovered.map((item) => {
              const isSelected = selectedIds.has(item.id);
              const color = item.color || '#6366f1';

              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer border ${
                    isSelected 
                      ? 'bg-accent/10 border-accent/40 shadow-sm' 
                      : 'glass-card border-black/[0.06] dark:border-white/[0.08] hover:border-accent/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="w-4 h-4 rounded accent-accent pointer-events-none flex-shrink-0"
                  />

                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm text-white relative overflow-hidden"
                    style={{ backgroundColor: color }}
                  >
                    <BrandIcon name={item.icon} color="#ffffff" className="w-4 h-4 relative z-10" fallbackText={item.name} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {item.name}
                      </span>
                      {item.custom_badge && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-accent/15 text-accent">
                          {item.custom_badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      <span className="truncate">{item.url}</span>
                      <span className="text-slate-400">·</span>
                      <span className="font-sans text-[10px] text-accent truncate">{item.category_name}</span>
                    </div>
                  </div>

                  {item.responseTime && (
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                      ● {item.responseTime}ms
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer with confirmation button */}
        <div className="flex items-center justify-between pt-3 border-t border-black/[0.06] dark:border-white/10">
          <Button variant="ghost" onClick={onClose}>
            Anuluj
          </Button>

          <Button
            onClick={handleAddSelected}
            isLoading={saving}
            disabled={selectedIds.size === 0}
            className="px-6 py-2.5 shadow-lg shadow-accent/25 text-xs font-bold"
          >
            Dodaj wybrane ({selectedIds.size}) do pulpitu ➔
          </Button>
        </div>

      </div>
    </Modal>
  );
}
