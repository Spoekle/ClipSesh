'use client';

import { safeLocalStorage } from '@/utils/storage';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFlag, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { useNotification } from '@/context/AlertContext';
import { Clip } from '@/types/adminTypes';
import { Button } from '@/components/common/Button';

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

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting]);

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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs flex justify-center items-center z-50 p-4 select-none"
          onMouseDown={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-cc-card text-foreground w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-border"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-border bg-cc-ground">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-primary/15 border border-primary/25 text-primary rounded-xl">
                  <FaFlag size={15} />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white">Report Clip</h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
              >
                <FaTimes size={15} />
              </button>
            </div>

            {/* Clip Info Summary */}
            <div className="p-4 bg-cc-ground border-b border-border">
              <h3 className="font-semibold text-xs sm:text-sm text-foreground truncate" title={clip.title}>
                {clip.title}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                by <span className="text-foreground/80">{clip.streamer}</span> • submitted by{' '}
                <span className="text-foreground/80">{clip.submitter}</span>
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5">
              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                  Why are you reporting this clip?
                </label>

                {/* Predefined reasons */}
                <div className="grid grid-cols-1 gap-2 mb-2.5">
                  {predefinedReasons.map((predefinedReason) => (
                    <button
                      key={predefinedReason}
                      type="button"
                      onClick={() => setSelectedType(predefinedReason)}
                      disabled={isSubmitting}
                      className={`text-left px-3.5 py-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                        selectedType === predefinedReason
                          ? 'border-primary bg-primary/15 text-white font-medium'
                          : 'border-border bg-cc-ground hover:border-border/80 hover:bg-white/5 text-muted-foreground'
                      }`}
                    >
                      {predefinedReason}
                    </button>
                  ))}
                </div>

                <div className="mb-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedType('other')}
                    disabled={isSubmitting}
                    className={`text-left w-full px-3.5 py-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      selectedType === 'other'
                        ? 'border-primary bg-primary/15 text-white font-medium'
                        : 'border-border bg-cc-ground hover:border-border/80 hover:bg-white/5 text-muted-foreground'
                    }`}
                  >
                    Other (please specify)
                  </button>
                </div>

                {/* Custom reason input if chosen */}
                {selectedType === 'other' && (
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Please explain why you are reporting this clip..."
                    className="w-full p-3 rounded-xl bg-cc-ground border border-border text-foreground placeholder-muted-foreground/60 min-h-22.5 resize-vertical text-xs focus:outline-none focus:border-border/80"
                    disabled={isSubmitting}
                    rows={3}
                    autoFocus
                  />
                )}

                {/* Warning / Disclaimers */}
                <div className="mt-3.5 p-3 bg-cc-ground border border-border rounded-xl">
                  <div className="flex items-start space-x-2.5">
                    <FaExclamationTriangle className="text-amber-400 mt-0.5 shrink-0" size={13} />
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
                  leftIcon={<FaFlag size={11} />}
                >
                  Submit Report
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReportModal;
