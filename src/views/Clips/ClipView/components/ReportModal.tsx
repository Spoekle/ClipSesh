import { safeLocalStorage } from '@/utils/storage';
import React, { useState } from 'react';
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
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showSuccess, showError } = useNotification();

    const predefinedReasons = [
        'Inappropriate content',
        'Spam/duplicate',
        'Wrong category/streamer'
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!reason.trim()) {
            showError('Please provide a reason for the report');
            return;
        }

        setIsSubmitting(true);

        try {
            const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || '') || 'https://api.spoekle.com';
            const token = safeLocalStorage.getItem('token');

            const response = await fetch(`${backendUrl}/api/clips/${clip._id}/report`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: reason.trim() })
            });

            if (response.ok) {
                showSuccess('Clip reported successfully. Admins have been notified.');
                setReason('');
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
            setReason('');
            onClose();
        }
    };

    const handlePredefinedReasonClick = (selectedReason: string) => {
        if (selectedReason === 'Other (please specify)') {
            setReason('');
        } else {
            setReason(selectedReason);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50"
                    onMouseDown={(e) => e.target === e.currentTarget && handleClose()}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="bg-[#181818] text-[#f1f1f1] w-full max-w-md rounded-2xl shadow-2xl mx-4 max-h-[90vh] overflow-y-auto border border-[#262626]"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-5 border-b border-[#262626]">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-[#f23030]/15 border border-[#f23030]/30 text-[#f23030] rounded-xl">
                                    <FaFlag className="text-base" />
                                </div>
                                <h2 className="text-lg font-bold text-[#f1f1f1]">Report Clip</h2>
                            </div>
                            <button
                                onClick={handleClose}
                                disabled={isSubmitting}
                                className="p-1.5 text-[#aaaaaa] hover:text-white hover:bg-[#202020] rounded-lg transition disabled:opacity-50"
                            >
                                <FaTimes className="text-sm" />
                            </button>
                        </div>

                        {/* Clip Info */}
                        <div className="p-4 bg-[#141414] border-b border-[#262626]">
                            <h3 className="font-semibold text-sm text-[#f1f1f1] truncate" title={clip.title}>
                                {clip.title}
                            </h3>
                            <p className="text-xs text-[#aaaaaa] mt-0.5">
                                by {clip.streamer} • submitted by {clip.submitter}
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-5">
                            <div className="mb-4">
                                <label className="block text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider mb-2.5">
                                    Why are you reporting this clip?
                                </label>

                                {/* Predefined reasons */}
                                <div className="grid grid-cols-1 gap-2 mb-2.5">
                                    {predefinedReasons.map((predefinedReason) => (
                                        <button
                                            key={predefinedReason}
                                            type="button"
                                            onClick={() => handlePredefinedReasonClick(predefinedReason)}
                                            disabled={isSubmitting}
                                            className={`text-left px-3.5 py-2.5 rounded-xl border text-xs transition-all ${reason === predefinedReason
                                                    ? 'border-[#f23030] bg-[#f23030]/15 text-[#f1f1f1] font-medium'
                                                    : 'border-[#262626] bg-[#141414] hover:border-[#3a3a3a] hover:bg-[#202020] text-[#d4d4d4]'
                                                }`}
                                        >
                                            {predefinedReason}
                                        </button>
                                    ))}
                                </div>

                                <div className="mb-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setReason('other')}
                                        className={`text-left w-full px-3.5 py-2.5 rounded-xl border text-xs transition-all ${reason === 'other'
                                                ? 'border-[#f23030] bg-[#f23030]/15 text-[#f1f1f1] font-medium'
                                                : 'border-[#262626] bg-[#141414] hover:border-[#3a3a3a] hover:bg-[#202020] text-[#d4d4d4]'
                                            }`}
                                    >
                                        Other (please specify)
                                    </button>
                                </div>

                                {/* Custom reason input if chosen */}
                                {reason === 'other' && (
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Please provide details about why you're reporting this clip..."
                                        className="w-full p-3 rounded-xl bg-[#141414] border border-[#262626] text-[#f1f1f1] placeholder-[#717171] min-h-[90px] resize-vertical text-xs focus:outline-none focus:border-[#3a3a3a]"
                                        disabled={isSubmitting}
                                        rows={3}
                                    />
                                )}

                                {/* Warning message */}
                                <div className="mt-3.5 p-3 bg-[#202020] border border-[#262626] rounded-xl">
                                    <div className="flex items-start space-x-2.5">
                                        <FaExclamationTriangle className="text-[#f23030] mt-0.5 shrink-0" size={13} />
                                        <p className="text-xs text-[#aaaaaa] leading-relaxed">
                                            Reports are reviewed by administrators. False or malicious reports may result in account restrictions.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end space-x-2.5 pt-3 border-t border-[#262626]">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-xs font-semibold rounded-full bg-[#202020] hover:bg-[#262626] text-[#aaaaaa] hover:text-[#f1f1f1] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !reason.trim()}
                                    className="px-4 py-2 text-xs font-semibold rounded-full bg-[#f23030] hover:bg-[#d92626] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaFlag className="text-[11px]" />
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
