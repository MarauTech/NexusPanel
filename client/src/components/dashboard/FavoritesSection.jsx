import React from 'react';
import { Star } from 'lucide-react';
import ServiceCard from './ServiceCard';

export default function FavoritesSection({ services, favorites, gridGap = '12', onFavoriteToggle, onSelectService }) {
  const items = services || favorites || [];
  if (!items || items.length === 0) return null;

  return (
    <section className="space-y-2">
      {/* Header: ULUBIONE (count) ─── */}
      <div className="flex items-center justify-between gap-3 select-none py-1.5 border-b border-[#1c2434]">
        <div className="flex items-center gap-2">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Ulubione
          </h2>
          <span className="text-[11px] font-mono text-slate-500">
            ({items.length})
          </span>
        </div>
      </div>

      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
          gap: `${gridGap}px`
        }}
        className="pt-1"
      >
        {items.map(service => (
          <ServiceCard 
            key={service.id} 
            service={service} 
            onFavoriteToggle={onFavoriteToggle}
            onSelectService={onSelectService}
          />
        ))}
      </div>
    </section>
  );
}
