'use client';

import React, { useCallback } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { AlertModalOptions } from '@/types/notificationTypes';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogMedia,
} from '@/components/ui/alert-dialog';

interface AlertModalProps {
  modal: AlertModalOptions | null;
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({ modal, onClose }) => {
  const handleConfirm = useCallback(() => {
    if (modal?.onConfirm) {
      modal.onConfirm();
    }
    onClose();
  }, [modal, onClose]);

  if (!modal) return null;

  const type = modal.type || 'info';

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="size-5" />,
          iconBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
        };
      case 'error':
        return {
          icon: <AlertCircle className="size-5" />,
          iconBg: 'bg-primary/15 text-primary border border-primary/30',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="size-5" />,
          iconBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
        };
      case 'info':
      default:
        return {
          icon: <Info className="size-5" />,
          iconBg: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
        };
    }
  };

  const { icon, iconBg } = getTypeStyles();

  return (
    <AlertDialog
      open={Boolean(modal)}
      onOpenChange={(open) => {
        if (!open) handleConfirm();
      }}
    >
      <AlertDialogContent className="sm:max-w-md border border-border bg-card text-foreground">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <div className={`p-2.5 rounded-xl flex items-center justify-center ${iconBg}`}>
              {icon}
            </div>
          </AlertDialogMedia>
          <AlertDialogTitle className="text-base font-bold text-foreground">
            {modal.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {modal.message}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="border-t border-border pt-3">
          <AlertDialogAction
            onClick={handleConfirm}
            className={
              type === 'success'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-primary hover:bg-primary-hover active:bg-primary-active text-white'
            }
          >
            {modal.confirmText || 'OK'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AlertModal;
