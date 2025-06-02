import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSpinner, FaTimes, FaCheck, FaCog, FaExclamationTriangle } from 'react-icons/fa';
import ConfirmationDialog from '../common/ConfirmationDialog';
import LiveProcessingView from './LiveProcessingView';
import axios from 'axios';
import apiUrl from '../../config/config';

interface ProcessClipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProcess: (season: string, year: number) => void;
  processing: boolean;
  progress: number;
  currentSeason: string;
  currentYear: number;
  clipCount: number;
  processJobId?: string | null;
}

const ProcessClipsModal: React.FC<ProcessClipsModalProps> = ({
  isOpen,
  onClose,
  onProcess,
  processing,
  progress,
  currentSeason,
  currentYear,
  clipCount,
  processJobId
}) => {
  const [season, setSeason] = useState(currentSeason);
  const [year, setYear] = useState(currentYear);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [stuckForTooLong, setStuckForTooLong] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Track elapsed time during processing
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (processing && !startTime) {
      setStartTime(Date.now());
      setElapsedTime(0);

      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else if (!processing && startTime) {
      setStartTime(null);
      if (timer) clearInterval(timer);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [processing, startTime]);

  // Update state when props change
  useEffect(() => {
    setSeason(currentSeason);
    setYear(currentYear);
  }, [currentSeason, currentYear]);

  // Detect stuck process
  useEffect(() => {
    let stuckTimer: NodeJS.Timeout | null = null;

    if (processing && progress === 100) {
      stuckTimer = setTimeout(() => {
        setStuckForTooLong(true);
      }, 180000); // 3 minutes
    } else {
      setStuckForTooLong(false);
    }

    return () => {
      if (stuckTimer) clearTimeout(stuckTimer);
    };
  }, [processing, progress]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

  const handleConfirmProcess = () => {
    setShowConfirmation(false);
    setErrorMessage(null); // Clear any previous error messages
    
    try {
      // Add a condition to verify clips are available
      if (clipCount <= 0) {
        setErrorMessage("No clips available to process.");
        return;
      }
      
      onProcess(season, year);
    } catch (error) {
      console.error("Error in process clips:", error);
      setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred");
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const handleForceComplete = async () => {
    if (!processJobId) return;

    const action = retryCount > 0 ? 'retry completion' : 'force complete';

    if (window.confirm(`Are you sure you want to ${action} this job? This should only be used if the process is stuck at 100%.`)) {
      try {
        const response = await axios.post(
          `${apiUrl}/api/zips/force-complete/${processJobId}`,
          {},
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          }
        );

        if (response.status === 200) {
          alert('Job marked as completed. Check the zip list for the entry.');
          onClose();
        } else {
          alert(`Failed to ${action} the job.`);
        }
      } catch (error) {
        console.error(`Error ${action} job:`, error);
        alert(`Error ${action} job. See console for details.`);
        // Increment retry count for next attempt
        setRetryCount(prev => prev + 1);
      }
    }
  };

  const handleProcessingComplete = () => {
    onClose();
  };

  const handleProcessingError = (error: string) => {
    setErrorMessage(error);
  };

  const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
  const currentYearInt = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYearInt - 2 + i);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black"
              onClick={!processing ? onClose : undefined}
            />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="bg-neutral-200 dark:bg-neutral-800 rounded-xl p-6 shadow-xl w-full max-w-md mx-4 z-10"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center">
                  <FaCog className="mr-2 text-blue-500" /> Process Clips
                </h2>
                {!processing && (
                  <button
                    onClick={onClose}
                    className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                  >
                    <FaTimes size={20} />
                  </button>
                )}
              </div>

              <div className="text-neutral-800 dark:text-neutral-200">
                {processing ? (
                  <div className="space-y-4">
                    {processJobId ? (
                      <LiveProcessingView 
                        jobId={processJobId}
                        onComplete={handleProcessingComplete}
                        onError={handleProcessingError}
                      />
                    ) : (
                      <>
                        <div className="text-center mb-4">
                          <p className="mb-2">Processing {clipCount} clips for {season} {year}...</p>
                          <div className="flex justify-center">
                            <FaSpinner className="animate-spin text-3xl text-blue-500" />
                          </div>
                        </div>

                        <div className="w-full bg-neutral-300 dark:bg-neutral-700 rounded-full h-4 mb-4">
                          <div
                            className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>

                        <div className="text-center">
                          <p className="font-medium text-lg">{progress}% Complete</p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            Elapsed time: {formatTime(elapsedTime)}
                          </p>
                        </div>
                      </>
                    )}

                    {errorMessage && (
                      <div className="bg-red-100 dark:bg-red-900 p-3 rounded-md text-red-800 dark:text-red-200 text-sm">
                        <p className="font-medium flex items-start">
                          <FaExclamationTriangle className="inline mr-2 mt-1 flex-shrink-0" />
                          <span>Error: {errorMessage}</span>
                        </p>
                        <p className="mt-2 text-xs italic">Check the browser console for more details.</p>
                      </div>
                    )}

                    {stuckForTooLong && (
                      <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-md text-yellow-800 dark:text-yellow-200 text-sm">
                        <p className="mb-2">
                          <FaExclamationTriangle className="inline mr-2" />
                          The process appears to be stuck at 100%.
                        </p>
                        <p className="mb-3">It may be experiencing an issue during finalization.</p>
                        <button
                          onClick={handleForceComplete}
                          className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs font-medium"
                        >
                          {retryCount > 0 ? `Retry (Attempt ${retryCount + 1})` : 'Force Complete'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <p className="mb-4">
                        You're about to process {clipCount} clips. Please select the season information:
                      </p>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block mb-2 text-sm font-medium">
                            Season
                          </label>
                          <select
                            value={season}
                            onChange={(e) => setSeason(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            {seasons.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block mb-2 text-sm font-medium">
                            Year
                          </label>
                          <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="w-full px-3 py-2 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            {years.map((y) => (
                              <option key={y} value={y}>
                                {y}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 bg-neutral-300 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-400 dark:hover:bg-neutral-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      >
                        <FaCheck className="mr-2" /> Process Clips
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationDialog
        isOpen={showConfirmation}
        title="Confirm Processing"
        message={`Are you sure you want to process ${clipCount} clips for ${season} ${year}? This operation may take several minutes depending on the number of clips.`}
        confirmText="Start Processing"
        cancelText="Cancel"
        confirmVariant="primary"
        onConfirm={handleConfirmProcess}
        onCancel={handleCancelConfirmation}
      />
    </>
  );
};

export default ProcessClipsModal;
