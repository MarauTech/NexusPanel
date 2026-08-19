import React from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ICONS = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <XCircle className="w-5 h-5 text-red-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />
};

const BORDERS = {
  success: 'border-l-green-500',
  error: 'border-l-red-500',
  warning: 'border-l-yellow-500',
  info: 'border-l-blue-500'
};

function Toast({ message, type = 'info', onClose }) {
  return (
    <div className={`flex items-start gap-3 w-80 bg-bg-card shadow-lg border border-border border-l-4 ${BORDERS[type]} rounded-lg p-4 animate-in slide-in-from-right fade-in duration-300 pointer-events-auto`}>
      <div className="flex-shrink-0 mt-0.5">
        {ICONS[type]}
      </div>
      <div className="flex-1 text-sm font-medium text-text-primary">
        {message}
      </div>
      <button 
        onClick={onClose}
        className="flex-shrink-0 text-text-secondary hover:text-text-primary transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <Toast 
          key={toast.id} 
          message={toast.message} 
          type={toast.type} 
          onClose={() => removeToast(toast.id)} 
        />
      ))}
    </div>
  );
}
