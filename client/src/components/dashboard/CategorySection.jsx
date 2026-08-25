import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Folder } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import ServiceCard from './ServiceCard';

function getLucideIcon(iconName) {
  if (!iconName) return null;
  if (LucideIcons[iconName]) return LucideIcons[iconName];
  const pascal = iconName.replace(/(^|[-_])(\w)/g, (_, __, c) => c.toUpperCase());
  return LucideIcons[pascal] || null;
}

export default function CategorySection({ category, services, gridGap = '14', onFavoriteToggle }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!services || services.length === 0) return null;

  const CategoryIcon = getLucideIcon(category.icon) || Folder;
  const catColor = category.color || '#6366f1';

  const total = services.length;
  const online = services.filter(s => s.health_status === 'online').length;
  const degraded = services.filter(s => s.health_status === 'degraded').length;
  const offline = services.filter(s => s.health_status === 'offline').length;
  const unknown = total - (online + degraded + offline);

  const isAllOnline = offline === 0 && degraded === 0 && (online + unknown === total);

  return (
    <section className="space-y-2.5">
      {/* Category Header: MEDIA — 3/3 ONLINE ─── [▼] */}
      <div 
        className="flex items-center justify-between gap-3 cursor-pointer group select-none py-1.5 border-b border-black/[0.06] dark:border-white/[0.06] hover:border-accent/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsExpanded(!isExpanded); }}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div 
            className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-105 flex-shrink-0"
            style={{ 
              backgroundColor: `${catColor}20`,
              color: catColor
            }}
          >
            <CategoryIcon className="w-3.5 h-3.5" />
          </div>

          <div className="flex items-center gap-2 truncate">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate">
              {category.name}
            </h2>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-black/[0.04] dark:bg-white/[0.08] text-slate-500 dark:text-slate-400 font-mono">
              {total}
            </span>
          </div>
        </div>

        {/* Right: Live Category Status (e.g. 3/3 ONLINE) + Chevron */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold">
            {isAllOnline ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {online > 0 ? `${online}/${total} ONLINE` : `${total} AKTYWNE`}
              </span>
            ) : (
              <div className="flex items-center gap-2">
                {online > 0 && <span className="text-emerald-500">{online} on</span>}
                {degraded > 0 && <span className="text-amber-500">{degraded} deg</span>}
                {offline > 0 && <span className="text-rose-500">{offline} off</span>}
              </div>
            )}
          </div>

          <div className="p-1 text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-transform duration-200">
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </div>
        </div>
      </div>

      {/* Grid of Balanced Cards */}
      {isExpanded && (
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
            gap: `${gridGap}px`
          }}
          className="transition-all duration-300 animate-in fade-in-50 pt-1"
        >
          {services.map(service => (
            <ServiceCard key={service.id} service={service} onFavoriteToggle={onFavoriteToggle} />
          ))}
        </div>
      )}
    </section>
  );
}
