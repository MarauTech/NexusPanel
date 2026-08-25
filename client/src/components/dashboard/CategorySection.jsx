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

export default function CategorySection({ category, services, gridGap = '12', onFavoriteToggle, onSelectService }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!services || services.length === 0) return null;

  const CategoryIcon = getLucideIcon(category.icon) || Folder;

  const total = services.length;
  const online = services.filter(s => s.health_status === 'online').length;
  const degraded = services.filter(s => s.health_status === 'degraded').length;
  const offline = services.filter(s => s.health_status === 'offline').length;

  return (
    <section className="space-y-2">
      {/* Technical Discreet Category Header: MEDIA — 3 ONLINE ─── [▼] */}
      <div 
        className="flex items-center justify-between gap-3 cursor-pointer select-none py-1.5 border-b border-[#1c2434] group hover:border-[#2b384e] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsExpanded(!isExpanded); }}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2 min-w-0">
          <CategoryIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-300 transition-colors flex-shrink-0" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors truncate">
            {category.name}
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            ({total})
          </span>
        </div>

        {/* Right: Technical Live Status (e.g. 3 ONLINE) + Chevron */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
            {offline === 0 && degraded === 0 ? (
              <span className="text-emerald-400 font-medium">
                {online}/{total} ONLINE
              </span>
            ) : (
              <div className="flex items-center gap-2">
                {online > 0 && <span className="text-emerald-400">{online} on</span>}
                {degraded > 0 && <span className="text-amber-400">{degraded} deg</span>}
                {offline > 0 && <span className="text-rose-400">{offline} off</span>}
              </div>
            )}
          </div>

          <div className="text-slate-500 group-hover:text-slate-300 transition-colors">
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </div>
        </div>
      </div>

      {/* Grid of Clean Technical Cards */}
      {isExpanded && (
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 250px), 1fr))',
            gap: `${gridGap}px`
          }}
          className="pt-1"
        >
          {services.map(service => (
            <ServiceCard 
              key={service.id} 
              service={service} 
              onFavoriteToggle={onFavoriteToggle}
              onSelectService={onSelectService}
            />
          ))}
        </div>
      )}
    </section>
  );
}
