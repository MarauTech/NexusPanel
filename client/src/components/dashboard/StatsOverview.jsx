import React from 'react';
import { Activity, CheckCircle2, AlertTriangle, XCircle, FolderTree, Plus, Sparkles, Server } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StatsOverview({ services = [], categories = [] }) {
  const total = services.length;
  const online = services.filter(s => s.health_status === 'online').length;
  const degraded = services.filter(s => s.health_status === 'degraded').length;
  const offline = services.filter(s => s.health_status === 'offline').length;

  return (
    <div className="relative overflow-hidden rounded-[24px] glass-card p-5 sm:p-6 transition-all duration-300">
      {/* Specular top light streak */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left: iOS Control Center Headline */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 relative overflow-hidden flex-shrink-0">
            {/* Top glass gloss reflection */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-black/10 pointer-events-none" />
            <Activity className="w-6 h-6 animate-pulse relative z-10" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-extrabold text-text-primary tracking-tight">Homelab Central</h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 backdrop-blur-md shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Hub
              </span>
            </div>
            <p className="text-xs text-text-secondary mt-0.5 font-medium">
              <strong className="text-text-primary">{total}</strong> self-hosted services running across <strong className="text-text-primary">{categories.length}</strong> categories
            </p>
          </div>
        </div>

        {/* Center/Right: Apple Glass Metric Capsules */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Online Glass Chip */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl glass-pill bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/80">Online</span>
              <span className="text-sm font-extrabold text-emerald-300 mt-0.5">{online}</span>
            </div>
          </div>

          {/* Degraded Glass Chip */}
          {degraded > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl glass-pill bg-amber-500/10 border-amber-500/25 text-amber-400 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              <div className="flex flex-col leading-none">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500/80">Slow</span>
                <span className="text-sm font-extrabold text-amber-300 mt-0.5">{degraded}</span>
              </div>
            </div>
          )}

          {/* Offline Glass Chip */}
          {offline > 0 && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl glass-pill bg-rose-500/10 border-rose-500/25 text-rose-400 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]" />
              <div className="flex flex-col leading-none">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500/80">Offline</span>
                <span className="text-sm font-extrabold text-rose-300 mt-0.5">{offline}</span>
              </div>
            </div>
          )}

          {/* Categories Pill */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl glass-pill text-text-secondary shadow-sm">
            <FolderTree className="w-4 h-4 text-accent" />
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-bold uppercase tracking-wider">Categories</span>
              <span className="text-sm font-extrabold text-text-primary mt-0.5">{categories.length}</span>
            </div>
          </div>

          {/* Manage Services Button */}
          <Link
            to="/admin/services"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-accent to-accent-hover text-white font-bold text-xs shadow-lg shadow-accent/25 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] ml-auto lg:ml-2 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/10 pointer-events-none" />
            <Plus className="w-4 h-4 relative z-10" />
            <span className="relative z-10">Add / Edit</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
