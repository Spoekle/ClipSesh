'use client';

import React from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogMedia,
} from '@/components/ui/alert-dialog';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}) => {
  const isSuccess = confirmVariant === 'success';

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <AlertDialogContent className="sm:max-w-md border border-border bg-card text-foreground">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <div
              className={`p-2.5 rounded-xl flex items-center justify-center ${
                isSuccess
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-primary/15 text-primary border border-primary/30'
              }`}
            >
              {isSuccess ? <Check className="size-5" /> : <AlertTriangle className="size-5" />}
            </div>
          </AlertDialogMedia>
          <AlertDialogTitle className="text-base font-bold text-foreground">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="border-t border-border pt-3">
          <AlertDialogCancel
            onClick={onCancel}
            className="border-border bg-secondary hover:bg-secondary-hover text-secondary-foreground"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              isSuccess
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-primary hover:bg-primary-hover active:bg-primary-active text-white'
            }
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmationDialog;
