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

      const items = res.data?.discovered || [];
      if (res.data?.netInfo) {
        setNetInfo(res.data.netInfo);
      }
      setDiscovered(items);
      // Pre-select all discovered items by default
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
      <div className="space-y-5">
        
        {/* Banner with radar explanation & detected subnet info */}
        <div className="p-4 rounded-2xl glass-card border border-white/20 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-white shadow-lg shadow-accent/25 flex-shrink-0">
                <Radar className={`w-6 h-6 ${scanning ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-text-primary">
                  {scanning ? 'Wyszukiwanie usług w sieci LAN...' : `Znaleziono ${discovered.length} usług`}
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Automatycznie bada porty Proxmox, Home Assistant, Docker, NAS, Plex, Grafana itp.
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => runScan()}
              isLoading={scanning}
              className="flex-shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              <span>Skanuj ponownie</span>
            </Button>
          </div>

          {/* Subnet & Gateway Live Badge */}
          {netInfo && (
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/10 text-xs">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl glass-pill font-mono font-bold text-text-primary">
                <Network className="w-3.5 h-3.5 text-accent" />
                <span>Podsieć: <strong className="text-accent">{netInfo.subnet}</strong></span>
              </span>

              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl glass-pill font-mono font-bold text-text-primary">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Brama / Router: <strong className="text-emerald-400">{netInfo.gatewayIp}</strong></span>
              </span>

              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl glass-pill font-mono font-bold text-text-primary">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span>Twój IP: <strong className="text-purple-400">{netInfo.localIp}</strong></span>
              </span>
            </div>
          )}
        </div>

        {/* Custom Host / Subnet IP input */}
        <form onSubmit={handleCustomScan} className="flex gap-2">
          <input
            type="text"
            value={customIp}
            onChange={(e) => setCustomIp(e.target.value)}
            placeholder={netInfo ? `np. ${netInfo.subnetPrefix}10, ${netInfo.subnetPrefix}20 (lub wpisz inny adres)` : 'np. 192.168.10.10, 192.168.1.10'}
            className="flex-1 bg-black/40 border border-white/10 text-white placeholder:text-slate-500 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:border-accent"
          />
          <Button type="submit" variant="secondary" size="sm" isLoading={scanning}>
            Skanuj IP
          </Button>
        </form>

        {/* Select All Bar */}
        {discovered.length > 0 && (
          <div className="flex items-center justify-between px-1 text-xs">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 font-bold text-accent hover:underline"
            >
              {selectedIds.size === discovered.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              <span>{selectedIds.size === discovered.length ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}</span>
            </button>

            <span className="text-text-secondary font-mono font-bold">
              Wybrano {selectedIds.size} z {discovered.length}
            </span>
          </div>
        )}

        {/* Discovered Items List */}
        <div className="space-y-2.5 max-h-[48vh] overflow-y-auto custom-scrollbar pr-1">
          {scanning ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-text-secondary font-medium">Błyskawiczne badanie podsieci i otwartych portów w Twoim homelabie...</p>
            </div>
          ) : discovered.length === 0 ? (
            <div className="p-8 text-center glass-card rounded-2xl text-xs text-text-secondary">
              Nie wykryto otwartych portów homelabu. Wpisz powyżej adres IP swojego serwera lub dodaj usługę ręcznie.
            </div>
          ) : (
            discovered.map((item) => {
              const isChecked = selectedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`p-3.5 rounded-2xl glass-card flex items-center justify-between gap-3 cursor-pointer transition-all duration-200 border ${
                    isChecked 
                      ? 'border-accent/50 bg-accent/10 shadow-md shadow-accent/15 scale-[1.01]' 
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
                        isChecked ? 'bg-accent text-white' : 'border border-white/20 glass-pill'
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>

                    <div 
                      className="w-10 h-10 rounded-[12px] flex items-center justify-center text-white flex-shrink-0 shadow-md relative overflow-hidden"
                      style={{ backgroundColor: item.color || '#6366f1' }}
                    >
                      <BrandIcon name={item.icon} color="#ffffff" className="w-5 h-5 relative z-10" fallbackText={item.name} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-text-primary truncate">{item.name}</span>
                        {item.custom_badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-white/10 text-text-primary">
                            {item.custom_badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-text-secondary font-mono truncate block mt-0.5">
                        {item.url} · <span className="text-accent">{item.category_name}</span>
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 flex-shrink-0 font-mono">
                    ● {item.responseTime || 8}ms
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <Button variant="ghost" onClick={onClose}>
            Zamknij
          </Button>

          <Button
            onClick={handleAddSelected}
            isLoading={saving}
            disabled={selectedIds.size === 0}
            className="px-6 py-2.5 shadow-lg shadow-accent/25"
          >
            Dodaj wybrane ({selectedIds.size}) do ekranu startowego 🚀
          </Button>
        </div>

      </div>
    </Modal>
  );
}
