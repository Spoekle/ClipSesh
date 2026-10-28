'use client';

import { safeLocalStorage } from '@/utils/storage';
import React, { useState } from 'react';
import { Flag, AlertTriangle } from 'lucide-react';
import { useNotification } from '@/context/AlertContext';
import { Clip } from '@/types/adminTypes';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ReportModalProps {
  clip: Clip;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ clip, isOpen, onClose }) => {
  const [selectedType, setSelectedType] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useNotification();

  const predefinedReasons = [
    'Inappropriate content',
    'Spam/duplicate',
    'Wrong category/streamer',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalReason = selectedType === 'other' ? customReason.trim() : selectedType.trim();

    if (!finalReason) {
      showError('Please select or provide a reason for the report');
      return;
    }

    setIsSubmitting(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const token = safeLocalStorage.getItem('token');

      const response = await fetch(`${backendUrl}/api/clips/${clip._id}/report`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: finalReason }),
      });

      if (response.ok) {
        showSuccess('Clip reported successfully. Admins have been notified.');
        setSelectedType('');
        setCustomReason('');
        onClose();
      } else {
        const errorData = (await response.json()) as { error?: string };
        showError(errorData.error || 'Failed to report clip');
      }
    } catch (error) {
      console.error('Error reporting clip:', error);
      showError('Failed to report clip. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedType('');
      setCustomReason('');
      onClose();
    }
  };

  const hasValidReason =
    selectedType === 'other' ? customReason.trim().length > 0 : selectedType.length > 0;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="max-w-md w-full bg-card border border-border p-6 shadow-2xl rounded-2xl text-foreground">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="flex items-center text-foreground text-base font-bold">
            <div className="p-2.5 bg-primary/15 border border-primary/25 text-primary rounded-xl mr-3">
              <Flag className="size-4" />
            </div>
            Report Clip
          </DialogTitle>
        </DialogHeader>

        {/* Clip Info Summary */}
        <div className="p-3 bg-secondary/30 rounded-xl border border-border">
          <h3 className="font-semibold text-xs text-foreground truncate" title={clip.title}>
            {clip.title}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            by <span className="text-foreground/80">{clip.streamer}</span> • submitted by{' '}
            <span className="text-foreground/80">{clip.submitter}</span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
              Why are you reporting this clip?
            </label>

            {/* Predefined reasons */}
            <div className="grid grid-cols-1 gap-2 mb-2">
              {predefinedReasons.map((predefinedReason) => (
                <button
                  key={predefinedReason}
                  type="button"
                  onClick={() => setSelectedType(predefinedReason)}
                  disabled={isSubmitting}
                  className={`text-left px-3.5 py-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                    selectedType === predefinedReason
                      ? 'border-primary bg-primary/15 text-white font-medium'
                      : 'border-border bg-secondary/30 hover:bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {predefinedReason}
                </button>
              ))}
            </div>

            <div className="mb-2">
              <button
                type="button"
                onClick={() => setSelectedType('other')}
                disabled={isSubmitting}
                className={`text-left w-full px-3.5 py-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  selectedType === 'other'
                    ? 'border-primary bg-primary/15 text-white font-medium'
                    : 'border-border bg-secondary/30 hover:bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                Other (please specify)
              </button>
            </div>

            {/* Custom reason input if chosen */}
            {selectedType === 'other' && (
              <Textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please explain why you are reporting this clip..."
                className="w-full bg-background border-border text-foreground text-xs min-h-20"
                disabled={isSubmitting}
                rows={3}
                autoFocus
              />
            )}

            {/* Warning / Disclaimers */}
            <div className="mt-3 p-3 bg-secondary/20 border border-border rounded-xl">
              <div className="flex items-start space-x-2.5">
                <AlertTriangle className="text-amber-400 mt-0.5 shrink-0 size-3.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Reports are reviewed by the moderation team. Repeated fraudulent reports may result in account restrictions.
                </p>
              </div>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="flex justify-end space-x-2.5 pt-3 border-t border-border">
            <Button
              type="button"
              variant="card"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!hasValidReason}
              isLoading={isSubmitting}
              leftIcon={<Flag className="size-3.5" />}
            >
              Submit Report
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportModal;
