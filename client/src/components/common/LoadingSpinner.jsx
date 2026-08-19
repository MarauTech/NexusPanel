import React from 'react';

export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3'
  };

  return (
    <div 
      className={`rounded-full animate-spin border-t-transparent border-current ${sizeClasses[size]} ${className}`} 
      style={{ borderTopColor: 'transparent' }}
    />
  );
}
