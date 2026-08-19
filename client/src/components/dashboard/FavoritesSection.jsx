import React from 'react';
import { Star } from 'lucide-react';
import ServiceCard from './ServiceCard';

export default function FavoritesSection({ services, favorites, gridCols = '4', gridGap = '16', onFavoriteToggle }) {
  const items = services || favorites || [];
  if (!items || items.length === 0) return null;

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(280px, 1fr))`,
    gap: `${gridGap}px`,
  };

  return (
    <section className="space-y-3">
      {/* Minimalist Clean Favorites Header */}
      <div className="flex items-center gap-2.5 select-none py-1">
        <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0">
          <Star className="w-3.5 h-3.5 fill-current" />
        </div>

        <div className="flex items-center gap-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-300">
            Przypięte Ulubione
          </h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300">
            {items.length}
          </span>
        </div>

        <div className="flex-1 h-[1px] bg-amber-500/20 ml-2" />
      </div>

      <div style={gridStyle} className="transition-all duration-300">
        {items.map(service => (
          <ServiceCard key={service.id} service={service} onFavoriteToggle={onFavoriteToggle} />
        ))}
      </div>
    </section>
  );
}
