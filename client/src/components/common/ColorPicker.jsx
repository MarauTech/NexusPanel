import React from 'react';
import { DEFAULT_COLORS } from '../../utils/constants';

export default function ColorPicker({ color, onChange }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {DEFAULT_COLORS.map(preset => (
          <button
            key={preset}
            type="button"
            className={`w-8 h-8 rounded-full border-2 ${color === preset ? 'border-text-primary shadow-md scale-110' : 'border-transparent hover:scale-105'} transition-all`}
            style={{ backgroundColor: preset }}
            onClick={() => onChange(preset)}
          />
        ))}
      </div>
      <div className="flex items-center gap-3 mt-1">
        <div 
          className="w-10 h-10 rounded border border-border shadow-inner"
          style={{ backgroundColor: color }}
        />
        <div className="flex-1 relative">
          <input
            type="text"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-bg-secondary border border-border text-text-primary rounded pl-3 pr-10 py-2 text-sm focus:outline-none focus:border-accent uppercase"
            placeholder="#000000"
          />
          <input 
            type="color" 
            value={color} 
            onChange={(e) => onChange(e.target.value)}
            className="absolute right-1 top-1 w-8 h-8 opacity-0 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
