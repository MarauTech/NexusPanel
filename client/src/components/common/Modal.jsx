import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({ title, children, onClose, footer, maxWidth = 'max-w-xl' }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-x-hidden overflow-y-auto select-none">
      {/* Blurred visionOS / Umbrel OS Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-2xl transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Liquid Glass Modal Card */}
      <div className={`relative glass-card rounded-[28px] border border-white/20 shadow-2xl w-full ${maxWidth} max-h-[88vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden z-10 my-auto`}>
        
        {/* Specular Top Shine */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02] flex-shrink-0">
          <h2 className="text-base sm:text-lg font-extrabold text-text-primary tracking-tight truncate pr-4">
            {title}
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full glass-pill text-text-secondary hover:text-text-primary transition-all hover:scale-105 active:scale-95 flex-shrink-0"
            title="Zamknij (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body with Clean Dark Glass Scrollbar */}
        <div className="p-6 overflow-y-auto custom-scrollbar min-h-0 space-y-4 text-left select-text">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-3 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
