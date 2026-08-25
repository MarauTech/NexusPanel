import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ConfirmDialog({ title, message, onConfirm, onCancel, confirmText, cancelText, confirmVariant = 'danger' }) {
  const { t } = useLanguage();
  return (
    <Modal title={title} onClose={onCancel} maxWidth="max-w-md">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-md bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/25 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
        </div>
        <div>
          <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">{message}</p>
        </div>
      </div>
      <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#1c2534] mt-4">
        <Button variant="ghost" size="sm" onClick={onCancel}>{cancelText || t('common.cancel', 'Anuluj')}</Button>
        <Button variant={confirmVariant} size="sm" onClick={onConfirm}>{confirmText || t('common.confirm', 'Potwierdź')}</Button>
      </div>
    </Modal>
  );
}
