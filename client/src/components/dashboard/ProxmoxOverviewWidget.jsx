import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { Settings } from 'lucide-react';

export default function ProxmoxOverviewWidget() {
  const { t } = useLanguage();
  const [nodeData, setNodeData] = useState(null);
  const [lxcData, setLxcData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchProxmox = async () => {
      setLoading(true);
      try {
        const [nodeRes, lxcRes] = await Promise.all([
          api.proxmox.getNodeStatus().catch(() => ({ data: { configured: false } })),
          api.proxmox.getLxcStatus().catch(() => ({ data: { containers: [] } }))
        ]);
        if (isMounted) {
          setNodeData(nodeRes.data);
          setLxcData(lxcRes.data);
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProxmox();
    const interval = setInterval(fetchProxmox, 45000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!nodeData || !nodeData.configured || !nodeData.enabled) {
    return null;
  }

  const containers = lxcData?.containers || [];
  const runningLxc = containers.filter(c => c.status === 'running').length;
  const totalLxc = containers.length;

  return (
    <div className="rounded-lg bg-[#141b27] border border-[#1d2635] p-4 space-y-3 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1c2534]">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            PROXMOX VE ({nodeData.node || 'Node'})
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">v{nodeData.pveVersion || '8.x'}</span>
        </div>

        <Link
          to="/admin/proxmox"
          className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
          title={t('admin.proxmox', 'Ustawienia Proxmox')}
        >
          <Settings className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Resource Metrics */}
      <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono">
        <div className="p-2 rounded bg-[#18202d] border border-[#202c3e]">
          <span className="text-slate-500 text-[10px] block">CPU</span>
          <span className="font-semibold text-slate-200 text-xs">
            {nodeData.cpu?.usagePercent || 0}%
          </span>
        </div>

        <div className="p-2 rounded bg-[#18202d] border border-[#202c3e]">
          <span className="text-slate-500 text-[10px] block">RAM</span>
          <span className="font-semibold text-slate-200 text-xs">
            {nodeData.memory?.percent || 0}%
          </span>
        </div>

        <div className="p-2 rounded bg-[#18202d] border border-[#202c3e]">
          <span className="text-slate-500 text-[10px] block">DYSK</span>
          <span className="font-semibold text-slate-200 text-xs">
            {nodeData.storage?.percent || 0}%
          </span>
        </div>
      </div>

      {/* LXC Containers Summary */}
      {totalLxc > 0 && (
        <div className="pt-2 border-t border-[#1c2534] flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Kontenery LXC:</span>
          <span className="text-slate-200 font-medium">
            <span className="text-emerald-400">{runningLxc}</span>/{totalLxc} aktywne
          </span>
        </div>
      )}
    </div>
  );
}
