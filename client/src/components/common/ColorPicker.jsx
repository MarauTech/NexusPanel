import React from 'react';
import { DEFAULT_COLORS } from '../../utils/constants';

export default function ColorPicker({ color, onChange }) {
  return (
    <div className="flex flex-col gap-2.5">
      {/* Symmetrical color palette */}
      <div className="grid grid-cols-7 gap-2 max-w-sm">
        {DEFAULT_COLORS.map(preset => (
          <button
            key={preset}
            type="button"
            className={`w-7 h-7 rounded-md border transition-all cursor-pointer ${
              color?.toLowerCase() === preset.toLowerCase() 
                ? 'border-slate-900 dark:border-white ring-2 ring-blue-500/40 scale-105 shadow-sm' 
                : 'border-transparent opacity-85 hover:opacity-100 hover:scale-105'
            }`}
            style={{ backgroundColor: preset }}
            onClick={() => onChange(preset)}
          />
        ))}
      </div>

      {/* Custom HEX code input & native color picker */}
      <div className="flex items-center gap-2 mt-0.5 max-w-sm">
        <div 
          className="w-7 h-7 rounded-md border border-slate-300 dark:border-[#202c3e] flex-shrink-0 shadow-sm dark:shadow-none"
          style={{ backgroundColor: color }}
        />
        <div className="flex-1 relative">
          <input
            type="text"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white dark:bg-[#18202d] border border-slate-300 dark:border-[#222d41] text-slate-900 dark:text-slate-200 rounded-md pl-2.5 pr-8 py-1 text-xs font-mono focus:outline-none focus:border-blue-500 uppercase shadow-sm dark:shadow-none"
            placeholder="#6366F1"
          />
          <input 
            type="color" 
            value={color?.startsWith('#') && color.length === 7 ? color : '#6366f1'} 
            onChange={(e) => onChange(e.target.value)}
            className="absolute right-1.5 top-1.5 w-4 h-4 opacity-0 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
