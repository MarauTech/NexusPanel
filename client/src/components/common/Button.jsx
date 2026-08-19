import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const VARIANTS = {
  primary: 'bg-gradient-to-r from-accent to-accent-hover text-white shadow-lg shadow-accent/25 hover:shadow-accent/40 border border-white/20',
  secondary: 'glass-pill text-text-primary hover:bg-white/10 shadow-sm',
  danger: 'bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/25 border border-white/15',
  ghost: 'bg-transparent text-text-secondary hover:text-text-primary hover:bg-white/5'
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs font-semibold rounded-xl',
  md: 'px-4 py-2 text-xs sm:text-sm font-bold rounded-2xl',
  lg: 'px-6 py-3 text-base font-bold rounded-2xl'
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
  const baseClasses = 'inline-flex items-center justify-center transition-all duration-200 hover:scale-[1.02] active:scale-[0.96] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden select-none cursor-pointer';
  
  const classes = [
    baseClasses,
    VARIANTS[variant],
    SIZES[size],
    fullWidth ? 'w-full' : '',
    className
  ].join(' ');

  return (
    <button
      disabled={disabled || isLoading}
      className={classes}
      {...props}
    >
      {/* Specular gloss top reflection for primary */}
      {variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/10 pointer-events-none" />
      )}
      {isLoading && <LoadingSpinner size={size === 'sm' ? 'sm' : 'md'} className="mr-2 relative z-10" />}
      {!isLoading && Icon && <Icon className={`mr-2 relative z-10 ${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />}
      <span className="relative z-10">{children}</span>
    </button>
  );
}
