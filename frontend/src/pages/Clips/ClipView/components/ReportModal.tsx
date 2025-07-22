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
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://api.spoekle.com';
            const token = localStorage.getItem('token');

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
                        className="bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white w-full max-w-md rounded-lg shadow-xl mx-4 max-h-[90vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-neutral-200 dark:border-neutral-700">
                            <div className="flex items-center space-x-3">
                                <FaFlag className="text-red-500 text-xl" />
                                <h2 className="text-xl font-bold">Report Clip</h2>
                            </div>
                            <button
                                onClick={handleClose}
                                disabled={isSubmitting}
                                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition disabled:opacity-50"
                            >
                                <FaTimes className="text-lg" />
                            </button>
                        </div>

                        {/* Clip Info */}
                        <div className="p-4 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-700">
                            <h3 className="font-semibold text-lg truncate" title={clip.title}>
                                {clip.title}
                            </h3>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                by {clip.streamer} • submitted by {clip.submitter}
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-3">
                                    Why are you reporting this clip?
                                </label>

                                {/* Predefined reasons */}
                                <div className="grid grid-cols-1 gap-2 mb-4">
                                    {predefinedReasons.map((predefinedReason) => (
                                        <button
                                            key={predefinedReason}
                                            type="button"
                                            onClick={() => handlePredefinedReasonClick(predefinedReason)}
                                            disabled={isSubmitting}
                                            className={`text-left p-3 rounded-lg border transition ${reason === predefinedReason
                                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                                                    : 'border-neutral-300 dark:border-neutral-600 hover:border-red-300 dark:hover:border-red-600 hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
                                                }`}
                                        >
                                            {predefinedReason}
                                        </button>
                                    ))}
                                </div>

                                <div className="mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setReason('other')}
                                        className={`text-left p-3 rounded-lg border transition ${reason === 'other'
                                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                                                : 'border-neutral-300 dark:border-neutral-600 hover:border-red-300 dark:hover:border-red-600 hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
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
                                        className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px] resize-vertical"
                                        disabled={isSubmitting}
                                        rows={4}
                                    />
                                )}

                                {/* Warning message */}
                                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                    <div className="flex items-start space-x-2">
                                        <FaExclamationTriangle className="text-amber-600 dark:text-amber-400 mt-0.5" />
                                        <p className="text-sm text-amber-700 dark:text-amber-300">
                                            Reports are reviewed by administrators. False or malicious reports may result in account restrictions.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-white rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !reason.trim()}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center space-x-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FaFlag />
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
