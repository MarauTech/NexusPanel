import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const VARIANTS = {
  primary: 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/30 font-medium shadow-xs',
  secondary: 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-xs dark:bg-[#151c28] dark:hover:bg-[#1b2536] dark:text-slate-200 dark:border-[#212c3e] font-medium',
  danger: 'bg-rose-700 hover:bg-rose-600 text-white border border-rose-600/30 font-medium shadow-xs',
  ghost: 'bg-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/[0.04]'
};

const SIZES = {
  sm: 'px-2.5 py-1.5 text-xs rounded-md',
  md: 'px-3.5 py-1.5 text-xs rounded-md',
  lg: 'px-5 py-2.5 text-sm rounded-md'
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  isLoading = false,
  disabled = false,
  className = '',
  fullWidth = false,
  ...props
}) {
  const baseClasses = 'inline-flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';
  
  const classes = [
    baseClasses,
    VARIANTS[variant] || VARIANTS.primary,
    SIZES[size] || SIZES.md,
    fullWidth ? 'w-full' : '',
    className
  ].join(' ');

  return (
    <button
      disabled={disabled || isLoading}
      className={classes}
      {...props}
    >
      {isLoading && <LoadingSpinner size={size === 'sm' ? 'sm' : 'md'} className="mr-1.5" />}
      {!isLoading && Icon && <Icon className={`mr-1.5 ${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />}
      <span>{children}</span>
    </button>
  );
}
