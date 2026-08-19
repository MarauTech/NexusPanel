import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({ title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel' }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-1">
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <p className="text-text-primary">{message}</p>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-8">
        <Button variant="ghost" onClick={onCancel}>{cancelText}</Button>
        <Button variant="danger" onClick={onConfirm}>{confirmText}</Button>
      </div>
    </Modal>
  );
}
