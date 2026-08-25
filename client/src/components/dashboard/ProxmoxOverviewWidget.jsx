import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { Server, Box, Cpu, HardDrive, Database, ExternalLink, Settings } from 'lucide-react';

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
      } catch (e) {
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
    return null; // Don't clutter UI if Proxmox VE is not configured by user
  }

  const containers = lxcData?.containers || [];
  const runningLxc = containers.filter(c => c.status === 'running').length;
  const totalLxc = containers.length;

  return (
    <div className="rounded-2xl glass-card border border-black/[0.08] dark:border-white/[0.08] p-4 sm:p-5 space-y-3.5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-black/[0.05] dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold text-xs">
            PVE
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Proxmox VE ({nodeData.node || 'Node'})
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">v{nodeData.pveVersion || '8.x'}</span>
          </div>
        </div>

        <Link
          to="/admin/proxmox"
          className="p-1 rounded-lg hover:bg-black/[0.06] dark:hover:bg-white/[0.08] text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all"
          title={t('admin.proxmox', 'Ustawienia Proxmox')}
        >
          <Settings className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Resource Metrics */}
      <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
        {/* CPU */}
        <div className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.05]">
          <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 text-[10px] mb-0.5">
            <Cpu className="w-3 h-3 text-indigo-400" /> CPU
          </div>
          <span className="font-bold font-mono text-slate-900 dark:text-white text-xs">
            {nodeData.cpu?.usagePercent || 0}%
          </span>
        </div>

        {/* RAM */}
        <div className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.05]">
          <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 text-[10px] mb-0.5">
            <HardDrive className="w-3 h-3 text-purple-400" /> RAM
          </div>
          <span className="font-bold font-mono text-slate-900 dark:text-white text-xs">
            {nodeData.memory?.percent || 0}%
          </span>
        </div>

        {/* Storage */}
        <div className="p-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.05]">
          <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 text-[10px] mb-0.5">
            <Database className="w-3 h-3 text-emerald-400" /> Dysk
          </div>
          <span className="font-bold font-mono text-slate-900 dark:text-white text-xs">
            {nodeData.storage?.percent || 0}%
          </span>
        </div>
      </div>

      {/* LXC Containers Summary */}
      {totalLxc > 0 && (
        <div className="pt-2 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 text-[11px]">
            <Box className="w-3.5 h-3.5 text-accent" /> Kontenery LXC
          </span>
          <span className="font-bold font-mono text-slate-800 dark:text-slate-200 text-[11px]">
            <span className="text-emerald-500">{runningLxc}</span> / {totalLxc} aktywne
          </span>
        </div>
      )}
    </div>
  );
}
