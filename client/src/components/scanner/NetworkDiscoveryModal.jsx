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
        <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1d2635] space-y-3 shadow-sm dark:shadow-none transition-colors">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-[#192231] border border-slate-200 dark:border-[#222d41] text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                <Radar className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {scanning ? 'Skanowanie podsieci LAN w toku...' : `Znaleziono ${discovered.length} aktywnych usług`}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
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
              className="text-xs font-medium"
            >
              Skanuj ponownie
            </Button>
          </div>

          {netInfo && (
            <div className="flex items-center gap-2 pt-1 flex-wrap text-xs">
              <span className="px-2 py-0.5 rounded bg-white dark:bg-[#18202d] border border-slate-200 dark:border-[#222d41] font-mono text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-sm dark:shadow-none">
                <Network className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                Podsieć: <b className="text-slate-900 dark:text-slate-100">{netInfo.subnet}</b>
              </span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-[#18202d] border border-slate-200 dark:border-[#222d41] font-mono text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-sm dark:shadow-none">
                <Globe className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Brama: <b className="text-slate-900 dark:text-slate-100">{netInfo.gatewayIp}</b>
              </span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-[#18202d] border border-slate-200 dark:border-[#222d41] font-mono text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shadow-sm dark:shadow-none">
                <Cpu className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                Twój IP: <b className="text-slate-900 dark:text-slate-100">{netInfo.localIp}</b>
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
            className="flex-1 bg-white dark:bg-[#18202d] border border-slate-300 dark:border-[#222d41] focus:border-blue-500 rounded-md px-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono focus:outline-none shadow-sm dark:shadow-none"
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
              className="flex items-center gap-1.5 font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white cursor-pointer"
            >
              {selectedIds.size === discovered.length ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Odznacz wszystkie</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                  <span>Zaznacz wszystkie</span>
                </>
              )}
            </button>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Wybrano: <b className="text-slate-900 dark:text-slate-100">{selectedIds.size}</b> z {discovered.length}
            </span>
          </div>
        )}

        {/* Discovered items list (Compact, balanced) */}
        <div className="max-h-[42vh] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
          {scanning && discovered.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Badam urządzenia w sieci LAN...</p>
            </div>
          ) : discovered.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-300 dark:border-[#1d2635] bg-slate-50 dark:bg-[#111622] rounded-lg">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Nie wykryto aktywnych portów w podsieci</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Użyj pola powyżej, aby przeskanować konkretny adres IP hosta.</p>
            </div>
          ) : (
            discovered.map((item) => {
              const isSelected = selectedIds.has(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors cursor-pointer border shadow-sm dark:shadow-none ${
                    isSelected 
                      ? 'bg-slate-100 dark:bg-[#18202d] border-blue-500/50' 
                      : 'bg-white dark:bg-[#111622] border-slate-200 dark:border-[#1d2635] hover:border-slate-300 dark:hover:border-[#2b394f]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="w-4 h-4 rounded accent-blue-600 dark:accent-blue-500 pointer-events-none flex-shrink-0"
                  />

                  <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-[#192231] border border-slate-200 dark:border-[#222d41] flex items-center justify-center flex-shrink-0">
                    <BrandIcon name={item.icon} className="w-4 h-4" fallbackText={item.name} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs text-slate-900 dark:text-slate-100 truncate">
                        {item.name}
                      </span>
                      {item.custom_badge && (
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#18202d] border border-slate-200 dark:border-[#222d41] text-slate-600 dark:text-slate-400">
                          {item.custom_badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                      <span className="truncate">{item.url}</span>
                      <span className="text-slate-400 dark:text-slate-600">·</span>
                      <span className="font-sans text-[10px] text-slate-700 dark:text-slate-300 truncate">{item.category_name}</span>
                    </div>
                  </div>

                  {item.responseTime && (
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex-shrink-0">
                      ● {item.responseTime}ms
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer with confirmation button */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-[#1c2534]">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Anuluj
          </Button>

          <Button
            onClick={handleAddSelected}
            isLoading={saving}
            size="sm"
            disabled={selectedIds.size === 0}
            className="px-5 py-1.5 text-xs font-medium"
          >
            Dodaj wybrane ({selectedIds.size}) do pulpitu ➔
          </Button>
        </div>

      </div>
    </Modal>
  );
}
