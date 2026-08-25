import React, { useState } from 'react';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

export default function WidgetCard({ 
  title, 
  icon: Icon, 
  badge, 
  badgeColor = 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  onRefresh, 
  loading = false, 
  children,
  className = '' 
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`bg-bg-card rounded-2xl border border-border/80 shadow-md hover:shadow-lg transition-all overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-black/[0.02] dark:bg-white/[0.02]">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent flex-shrink-0">
              <Icon className="w-3.5 h-3.5" />
            </div>
          )}
          <h3 className="font-bold text-xs sm:text-sm text-text-primary tracking-tight truncate">
            {title}
          </h3>
          {badge && (
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
              title="Odśwież dane"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent' : ''}`} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title={collapsed ? "Rozwiń" : "Zwiń"}
          >
            {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="p-4 flex-1 flex flex-col justify-between animate-in fade-in duration-200">
          {children}
        </div>
      )}
    </div>
  );
}
