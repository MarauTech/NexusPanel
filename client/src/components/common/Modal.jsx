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
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />
      
      {/* Solid Technical Modal Card */}
      <div className={`relative bg-[#141b27] rounded-lg border border-[#1d2635] shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col animate-in fade-in duration-150 overflow-hidden z-10 my-auto text-slate-200`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1c2534] bg-[#111622] flex-shrink-0">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 truncate pr-4">
            {title}
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors flex-shrink-0"
            title="Zamknij (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar min-h-0 space-y-4 text-left select-text text-xs">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-3.5 border-t border-[#1c2534] bg-[#111622] flex items-center justify-end gap-2.5 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
