import React from 'react';
import { DEFAULT_COLORS } from '../../utils/constants';

export default function ColorPicker({ color, onChange }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Symmetrical 2-row x 7-column color palette */}
      <div className="grid grid-cols-7 gap-2.5 max-w-sm">
        {DEFAULT_COLORS.map(preset => (
          <button
            key={preset}
            type="button"
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-all cursor-pointer ${
              color?.toLowerCase() === preset.toLowerCase() 
                ? 'border-slate-900 dark:border-white shadow-lg scale-110 ring-2 ring-accent/40' 
                : 'border-transparent hover:scale-105 opacity-90 hover:opacity-100'
            }`}
            style={{ backgroundColor: preset }}
            onClick={() => onChange(preset)}
          />
        ))}
      </div>

      {/* Custom HEX code input & native color picker */}
      <div className="flex items-center gap-2.5 mt-1 max-w-sm">
        <div 
          className="w-9 h-9 rounded-xl border border-black/[0.1] dark:border-white/20 shadow-inner flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <div className="flex-1 relative">
          <input
            type="text"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-black/[0.03] dark:bg-black/40 border border-black/[0.1] dark:border-white/15 text-slate-900 dark:text-white rounded-xl pl-3 pr-10 py-2 text-xs font-mono focus:outline-none focus:border-accent uppercase"
            placeholder="#6366F1"
          />
          <input 
            type="color" 
            value={color?.startsWith('#') && color.length === 7 ? color : '#6366f1'} 
            onChange={(e) => onChange(e.target.value)}
            className="absolute right-2 top-2 w-5 h-5 opacity-0 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
