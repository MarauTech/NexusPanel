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
  const baseInputClasses = `
    w-full bg-[#18202d] 
    border border-[#222d41] 
    text-slate-200 
    placeholder:text-slate-500
    rounded-md px-3 py-2 text-xs sm:text-sm font-normal
    transition-colors
    hover:border-[#2f3d56]
    focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
    ${error ? '!border-rose-500 focus:!ring-rose-500' : ''}
    ${className}
  `;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-slate-300 mb-1.5">
          {label} {props.required && <span className="text-rose-400">*</span>}
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
