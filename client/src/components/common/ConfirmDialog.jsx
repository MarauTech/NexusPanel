import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ConfirmDialog({ title, message, onConfirm, onCancel, confirmText, cancelText, confirmVariant = 'danger' }) {
  const { t } = useLanguage();
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-1">
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <p className="text-text-primary text-sm leading-relaxed">{message}</p>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-8">
        <Button variant="ghost" onClick={onCancel}>{cancelText || t('common.cancel', 'Anuluj')}</Button>
        <Button variant={confirmVariant} onClick={onConfirm}>{confirmText || t('common.confirm', 'Potwierdź')}</Button>
      </div>
    </Modal>
  );
}
