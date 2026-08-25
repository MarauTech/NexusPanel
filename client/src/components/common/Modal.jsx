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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-x-hidden overflow-y-auto select-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />
      
      {/* Solid Technical Modal Card */}
      <div className={`relative bg-white dark:bg-[#141b27] rounded-lg border border-slate-300 dark:border-[#1d2635] shadow-2xl w-full ${maxWidth} max-h-[94vh] flex flex-col animate-in fade-in duration-150 overflow-hidden z-10 my-auto text-slate-800 dark:text-slate-200 transition-colors`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-slate-200 dark:border-[#1c2534] bg-slate-50 dark:bg-[#111622] flex-shrink-0">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 truncate pr-3">
            {title}
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/[0.06] transition-colors flex-shrink-0 cursor-pointer"
            title="Zamknij (Esc)"
            aria-label="Zamknij okno"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-3.5 sm:p-5 overflow-y-auto custom-scrollbar min-h-0 space-y-4 text-left select-text text-xs">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-4 sm:px-5 py-3 border-t border-slate-200 dark:border-[#1c2534] bg-slate-50 dark:bg-[#111622] flex items-center justify-end gap-2 flex-shrink-0 flex-wrap">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
