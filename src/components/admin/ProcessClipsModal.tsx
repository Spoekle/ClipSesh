import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSpinner, FaTimes, FaCheck, FaCog, FaExclamationTriangle, FaStop } from 'react-icons/fa';
import ConfirmationDialog from '../common/ConfirmationDialog';
import LiveProcessingView from './LiveProcessingView';
import { forceCompleteProcessJob, cancelProcessingJob } from '../../services/adminService';
import { Clip, Rating } from '../../types/adminTypes';

interface ProcessClipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProcess: (season: string, year: number) => void;
  onProcessingComplete?: () => void;
  processing: boolean;
  progress: number;
  currentSeason: string;
  currentYear: number;
  clipCount: number;
  processJobId?: string | null;
  clips?: Clip[];
  ratings?: Record<string, Rating>;
  denyThreshold?: number;
}

const ProcessClipsModal: React.FC<ProcessClipsModalProps> = ({
  isOpen,
  onClose,
  onProcess,
  onProcessingComplete,
  processing,
  progress,
  currentSeason,
  currentYear,
  clipCount: fallbackClipCount,
  processJobId,
  clips = [],
  ratings = {},
  denyThreshold = 5
}) => {
  const [season, setSeason] = useState(currentSeason);
  const [year, setYear] = useState(currentYear);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showForceCompleteConfirmation, setShowForceCompleteConfirmation] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [stuckForTooLong, setStuckForTooLong] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Calculate clip count based on selected season and year
  const clipCount = useMemo(() => {
    if (clips.length === 0) return fallbackClipCount;
    
    return clips.filter(clip => {
      const clipSeason = clip.season?.toLowerCase();
      const clipYear = clip.year;
      const selectedSeason = season.toLowerCase();
      
      if (clipSeason !== selectedSeason || clipYear !== year) {
        return false;
      }

      const ratingData = ratings[clip._id];
      if (!ratingData || !ratingData.ratingCounts || !Array.isArray(ratingData.ratingCounts)) {
        return true;
      }

      return ratingData.ratingCounts.every(
        (rateData) => rateData.rating !== 'deny' || rateData.count < denyThreshold
      );
    }).length;
  }, [clips, ratings, season, year, denyThreshold, fallbackClipCount]);

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
    setErrorMessage(null);
    
    try {
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

  const handleForceComplete = () => {
    setShowForceCompleteConfirmation(true);
  };

  const confirmForceComplete = async () => {
    setShowForceCompleteConfirmation(false);
    if (!processJobId) return;

    const action = retryCount > 0 ? 'retry completion' : 'force complete';

    try {
      await forceCompleteProcessJob(processJobId);
      onProcessingComplete?.();
      onClose();
    } catch (error) {
      console.error(`Error ${action} job:`, error);
      setErrorMessage(`Failed to ${action} job. Please check the console for details.`);
      setRetryCount(prev => prev + 1);
    }
  };

  const cancelForceComplete = () => {
    setShowForceCompleteConfirmation(false);
  };

  const handleProcessingComplete = () => {
    onProcessingComplete?.();
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
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              onClick={!processing ? onClose : undefined}
            />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative bg-[#181818] rounded-2xl p-6 shadow-2xl w-full max-w-md border border-[#262626] text-[#f1f1f1] z-10"
            >
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#262626]">
                <h2 className="text-base font-bold text-[#f1f1f1] flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#f23030]/15 text-[#f23030] flex items-center justify-center">
                    <FaCog size={14} />
                  </div>
                  <span>Process Clips Pipeline</span>
                </h2>
                {!processing && (
                  <button
                    onClick={onClose}
                    className="p-1.5 text-[#717171] hover:text-[#f1f1f1] rounded-lg hover:bg-[#222222] transition-colors cursor-pointer"
                  >
                    <FaTimes size={14} />
                  </button>
                )}
              </div>

              <div className="text-[#f1f1f1]">
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
                          <p className="mb-3 text-xs text-[#aaaaaa]">Processing {clipCount} clips for {season} {year}...</p>
                          <div className="flex justify-center">
                            <FaSpinner className="animate-spin text-3xl text-[#f23030]" />
                          </div>
                        </div>

                        <div className="w-full bg-[#222222] rounded-full h-2 mb-4 overflow-hidden">
                          <div
                            className="bg-[#f23030] h-full rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        <div className="text-center">
                          <p className="font-semibold text-sm text-[#f1f1f1]">{progress}% Complete</p>
                          <p className="text-[11px] text-[#717171] mt-1">
                            Elapsed time: {formatTime(elapsedTime)}
                          </p>
                        </div>
                      </>
                    )}

                    {errorMessage && (
                      <div className="bg-[#f23030]/10 border border-[#f23030]/30 p-3.5 rounded-xl text-[#f23030] text-xs">
                        <p className="font-medium flex items-start">
                          <FaExclamationTriangle className="inline mr-2 mt-0.5 shrink-0" />
                          <span>Error: {errorMessage}</span>
                        </p>
                        <p className="mt-1.5 text-[11px] opacity-75">Check the browser console for more details.</p>
                      </div>
                    )}

                    {stuckForTooLong && (
                      <div className="bg-[#eab308]/10 border border-[#eab308]/30 p-3.5 rounded-xl text-[#eab308] text-xs">
                        <p className="font-semibold mb-1 flex items-center">
                          <FaExclamationTriangle className="inline mr-1.5" />
                          The process appears to be stuck at 100%.
                        </p>
                        <p className="mb-2 text-[#aaaaaa]">It may be experiencing an issue during finalization.</p>
                        <button
                          onClick={handleForceComplete}
                          className="bg-[#f23030] hover:bg-[#d92222] text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          {retryCount > 0 ? `Retry (Attempt ${retryCount + 1})` : 'Force Complete'}
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#262626]">
                      <button
                        type="button"
                        onClick={async () => {
                          if (processJobId) {
                            try {
                              await cancelProcessingJob(processJobId);
                            } catch {}
                          }
                          onClose();
                        }}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <FaStop size={10} />
                        <span>Cancel Pipeline</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <p className="mb-3 text-xs text-[#aaaaaa] leading-relaxed">
                        You're about to process <span className="font-semibold text-[#f1f1f1]">{clipCount} clips</span>. Select the target season configuration:
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#717171]">
                            Season
                          </label>
                          <select
                            value={season}
                            onChange={(e) => setSeason(e.target.value)}
                            className="bg-[#121212] border border-[#262626] text-[#f1f1f1] rounded-xl w-full px-3 py-2 text-xs focus:border-[#444] focus:outline-none"
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
                          <label className="block mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#717171]">
                            Year
                          </label>
                          <select
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="bg-[#121212] border border-[#262626] text-[#f1f1f1] rounded-xl w-full px-3 py-2 text-xs focus:border-[#444] focus:outline-none"
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

                    <div className="flex justify-end gap-2 pt-3 border-t border-[#262626]">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs rounded-xl bg-[#141414] hover:bg-[#222222] text-[#aaaaaa] hover:text-[#f1f1f1] border border-[#262626] font-medium transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs rounded-xl bg-[#f23030] hover:bg-[#d92222] text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <FaCheck size={11} />
                        <span>Process Clips</span>
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
        confirmVariant="primary"
        onConfirm={handleConfirmProcess}
        onCancel={handleCancelConfirmation}
      />

      <ConfirmationDialog
        isOpen={showForceCompleteConfirmation}
        title="Force Complete Process"
        message={`Are you sure you want to ${retryCount > 0 ? 'retry completion' : 'force complete'} this job? This should only be used if the process is stuck at 100%.`}
        confirmText={retryCount > 0 ? `Retry (Attempt ${retryCount + 1})` : 'Force Complete'}
        confirmVariant="danger"
        onConfirm={confirmForceComplete}
        onCancel={cancelForceComplete}
      />
    </>
  );
};

export default ProcessClipsModal;
