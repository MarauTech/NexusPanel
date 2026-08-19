import React from 'react';
import { useSettings } from '../../hooks/useSettings';

export default function SkeletonCard() {
  const { settings } = useSettings();
  const style = settings?.tile_style || 'default';

  if (style === 'compact') {
    return (
      <div className="bg-bg-card border border-border rounded-xl p-3 flex items-center gap-3 animate-pulse">
        <div className="w-10 h-10 bg-bg-secondary rounded-lg flex-shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-bg-secondary rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (style === 'detailed') {
    return (
      <div className="bg-bg-card border border-border rounded-xl p-5 flex flex-col h-[160px] animate-pulse">
        <div className="flex items-start gap-4 mb-3">
          <div className="w-10 h-10 bg-bg-secondary rounded-lg flex-shrink-0" />
          <div className="flex-1 pt-1">
            <div className="h-5 bg-bg-secondary rounded w-3/4 mb-2" />
            <div className="h-3 bg-bg-secondary rounded w-1/4" />
          </div>
        </div>
        <div className="space-y-2 mt-auto">
          <div className="h-3 bg-bg-secondary rounded w-full" />
          <div className="h-3 bg-bg-secondary rounded w-5/6" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 flex items-center gap-4 animate-pulse">
      <div className="w-10 h-10 bg-bg-secondary rounded-lg flex-shrink-0" />
      <div className="flex-1">
        <div className="h-4 bg-bg-secondary rounded w-2/3 mb-2" />
        <div className="h-3 bg-bg-secondary rounded w-1/2" />
      </div>
    </div>
  );
}
