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

export default function CategorySection({ category, services, gridCols = '4', gridGap = '16', onFavoriteToggle }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!services || services.length === 0) return null;

  const CategoryIcon = getLucideIcon(category.icon) || Folder;
  const catColor = category.color || '#6366f1';

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(320px, 1fr))`,
    gap: `${gridGap}px`,
  };

  return (
    <section className="space-y-3">
      {/* Minimalist Clean Category Header */}
      <div 
        className="flex items-center gap-2.5 cursor-pointer group select-none py-1"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div 
          className="w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:scale-105 flex-shrink-0"
          style={{ 
            backgroundColor: `${catColor}20`,
            color: catColor
          }}
        >
          <CategoryIcon className="w-3.5 h-3.5" />
        </div>

        <div className="flex items-center gap-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors">
            {category.name}
          </h2>
          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-white/[0.06] text-slate-400">
            {services.length}
          </span>
        </div>

        <div className="flex-1 h-[1px] bg-white/[0.06] ml-2" />

        <div className="p-1 text-slate-500 group-hover:text-slate-300 transition-colors">
          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
      </div>

      {/* Grid of Minimalist Cards */}
      {isExpanded && (
        <div style={gridStyle} className="transition-all duration-300 animate-in fade-in-50 duration-200">
          {services.map(service => (
            <ServiceCard key={service.id} service={service} onFavoriteToggle={onFavoriteToggle} />
          ))}
        </div>
      )}
    </section>
  );
}
