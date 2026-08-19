import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const Input = forwardRef(({
  label,
  type = 'text',
  error,
  helperText,
  className = '',
  options = [],
  ...props
}, ref) => {
  // Ultra-sleek Umbrel OS / visionOS dark glass input styling
  const baseInputClasses = `
    w-full bg-slate-100/80 dark:bg-black/40 backdrop-blur-xl 
    border border-slate-300/80 dark:border-white/10 
    text-slate-900 dark:text-white 
    placeholder:text-slate-400 dark:placeholder:text-slate-500
    rounded-[14px] px-4 py-2.5 text-xs sm:text-sm font-medium
    shadow-sm transition-all duration-200
    hover:border-slate-400/80 dark:hover:border-white/25 hover:bg-slate-200/50 dark:hover:bg-black/50
    focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/20 focus:bg-white dark:focus:bg-black/60
    ${error ? '!border-rose-500 focus:!ring-rose-500/25' : ''}
    ${className}
  `;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5 tracking-tight">
          {label} {props.required && <span className="text-rose-500">*</span>}
        </label>
      )}
      
      {type === 'textarea' ? (
        <textarea 
          ref={ref} 
          className={`${baseInputClasses} min-h-[90px] resize-y leading-relaxed`} 
          {...props} 
        />
      ) : type === 'select' ? (
        <div className="relative">
          <select 
            ref={ref} 
            className={`${baseInputClasses} appearance-none pr-10 cursor-pointer`} 
            {...props}
          >
            {options.map((opt, i) => (
              <option key={i} value={opt.value} className="bg-slate-900 text-white py-2">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      ) : (
        <input 
          ref={ref} 
          type={type} 
          className={baseInputClasses} 
          {...props} 
        />
      )}

      {error && <p className="mt-1 text-xs text-rose-500 font-semibold">{error}</p>}
      {helperText && !error && <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
