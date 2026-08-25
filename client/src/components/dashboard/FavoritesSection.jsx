import React from 'react';
import { Star } from 'lucide-react';
import ServiceCard from './ServiceCard';

export default function FavoritesSection({ services, favorites, gridGap = '14', onFavoriteToggle }) {
  const items = services || favorites || [];
  if (!items || items.length === 0) return null;

  return (
    <section className="space-y-2.5">
      {/* Header: ULUBIONE (count) ─── */}
      <div className="flex items-center justify-between gap-3 select-none py-1.5 border-b border-amber-500/20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0">
            <Star className="w-3.5 h-3.5 fill-current" />
          </div>

          <div className="flex items-center gap-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-300">
              Ulubione
            </h2>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 font-mono">
              {items.length}
            </span>
          </div>
        </div>
      </div>

      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
          gap: `${gridGap}px`
        }}
        className="transition-all duration-300 animate-in fade-in-50 pt-1"
      >
        {items.map(service => (
          <ServiceCard key={service.id} service={service} onFavoriteToggle={onFavoriteToggle} />
        ))}
      </div>
    </section>
  );
}
