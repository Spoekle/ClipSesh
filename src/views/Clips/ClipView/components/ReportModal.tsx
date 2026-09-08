import { safeLocalStorage } from '@/utils/storage';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFlag, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { useNotification } from '../../../../context/AlertContext';
import { Clip } from '../../../../types/adminTypes';

interface ReportModalProps {
  clip: Clip;
  isOpen: boolean;
  onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ clip, isOpen, onClose }) => {
  const [selectedType, setSelectedType] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useNotification();

  const predefinedReasons = [
    'Inappropriate content',
    'Spam/duplicate',
    'Wrong category/streamer'
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
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: finalReason })
      });

      if (response.ok) {
        showSuccess('Clip reported successfully. Admins have been notified.');
        setSelectedType('');
        setCustomReason('');
        onClose();
      } else {
        const errorData = await response.json();
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

  const hasValidReason = selectedType === 'other' ? customReason.trim().length > 0 : selectedType.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
          onMouseDown={(e) => e.target === e.currentTarget && handleClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#181818] text-[#f1f1f1] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-[#262626]"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-[#262626] bg-[#141414]">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-cc-red/15 border border-cc-red/25 text-cc-red rounded-xl">
                  <FaFlag size={15} />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-[#f1f1f1]">Report Clip</h2>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-2 text-[#717171] hover:text-[#f1f1f1] hover:bg-[#222222] rounded-xl transition-colors cursor-pointer disabled:opacity-40"
              >
                <FaTimes size={15} />
              </button>
            </div>

            {/* Clip Info Summary */}
            <div className="p-4 bg-[#141414] border-b border-[#262626]">
              <h3 className="font-semibold text-xs sm:text-sm text-[#f1f1f1] truncate" title={clip.title}>
                {clip.title}
              </h3>
              <p className="text-[11px] text-[#717171] mt-0.5">
                by <span className="text-[#aaaaaa]">{clip.streamer}</span> • submitted by <span className="text-[#aaaaaa]">{clip.submitter}</span>
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5">
              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-[#aaaaaa] uppercase tracking-wider mb-2.5">
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
                          ? 'border-cc-red bg-cc-red/15 text-[#f1f1f1] font-medium'
                          : 'border-[#262626] bg-[#141414] hover:border-[#3a3a3a] hover:bg-[#1a1a1a] text-[#aaaaaa]'
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
                        ? 'border-cc-red bg-cc-red/15 text-[#f1f1f1] font-medium'
                        : 'border-[#262626] bg-[#141414] hover:border-[#3a3a3a] hover:bg-[#1a1a1a] text-[#aaaaaa]'
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
                    className="w-full p-3 rounded-xl bg-[#121212] border border-[#262626] text-[#f1f1f1] placeholder-[#717171] min-h-22.5 resize-vertical text-xs focus:outline-none focus:border-[#444]"
                    disabled={isSubmitting}
                    rows={3}
                    autoFocus
                  />
                )}

                {/* Warning / Disclaimers */}
                <div className="mt-3.5 p-3 bg-[#141414] border border-[#262626] rounded-xl">
                  <div className="flex items-start space-x-2.5">
                    <FaExclamationTriangle className="text-[#eab308] mt-0.5 shrink-0" size={13} />
                    <p className="text-[11px] text-[#aaaaaa] leading-relaxed">
                      Reports are reviewed by the moderation team. Repeated fraudulent reports may result in account restrictions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end space-x-2.5 pt-3 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium rounded-xl bg-[#141414] hover:bg-[#222222] border border-[#262626] text-[#aaaaaa] hover:text-[#f1f1f1] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !hasValidReason}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-cc-red hover:bg-cc-red-hover text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <FaFlag size={11} />
                      <span>Submit Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReportModal;
