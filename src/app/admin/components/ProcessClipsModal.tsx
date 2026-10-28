'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Check } from 'lucide-react';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProcessingStateView } from './process/ProcessingStateView';
import { forceCompleteProcessJob, cancelProcessingJob } from '@/services/adminService';
import { Clip, Rating } from '@/types/adminTypes';

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

export const ProcessClipsModal: React.FC<ProcessClipsModalProps> = ({
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
  denyThreshold = 5,
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

    return clips.filter((clip) => {
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
        setElapsedTime((prev) => prev + 1);
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
        setErrorMessage('No clips available to process.');
        return;
      }

      onProcess(season, year);
    } catch (error) {
      console.error('Error in process clips:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
    }
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
      setRetryCount((prev) => prev + 1);
    }
  };

  const handleCancelPipeline = async () => {
    if (processJobId) {
      try {
        await cancelProcessingJob(processJobId);
      } catch (err) {
        console.error('Error cancelling pipeline job:', err);
      }
    }
    onClose();
  };

  const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
  const currentYearInt = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYearInt - 2 + i);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && !processing && onClose()}>
        <DialogContent className="max-w-md p-6 bg-card border-border text-foreground">
          <DialogHeader className="mb-2 pb-3 border-b border-border flex flex-row items-center justify-between space-y-0">
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <Settings className="size-4" />
              </div>
              <span>Process Clips Pipeline</span>
            </DialogTitle>
          </DialogHeader>

          <div>
            {processing ? (
              <ProcessingStateView
                processJobId={processJobId}
                onProcessingComplete={() => {
                  onProcessingComplete?.();
                  onClose();
                }}
                onProcessingError={(err) => setErrorMessage(err)}
                clipCount={clipCount}
                season={season}
                year={year}
                progress={progress}
                elapsedTime={elapsedTime}
                formatTime={formatTime}
                errorMessage={errorMessage}
                stuckForTooLong={stuckForTooLong}
                onForceComplete={() => setShowForceCompleteConfirmation(true)}
                retryCount={retryCount}
                onCancelPipeline={handleCancelPipeline}
              />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <p className="mb-3 text-xs text-muted-foreground leading-relaxed">
                    You&apos;re about to process <span className="font-semibold text-foreground">{clipCount} clips</span>. Select the target season configuration:
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Season
                      </label>
                      <select
                        value={season}
                        onChange={(e) => setSeason(e.target.value)}
                        className="bg-background border border-border text-foreground rounded-xl w-full px-3 py-2 text-xs focus:border-border/80 focus:outline-none cursor-pointer"
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
                      <label className="block mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Year
                      </label>
                      <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="bg-background border border-border text-foreground rounded-xl w-full px-3 py-2 text-xs focus:border-border/80 focus:outline-none cursor-pointer"
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

                <div className="flex justify-end gap-2 pt-3 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    size="sm"
                    className="gap-1.5"
                  >
                    <Check className="size-3.5" />
                    Process Clips
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        isOpen={showConfirmation}
        title="Confirm Processing"
        message={`Are you sure you want to process ${clipCount} clips for ${season} ${year}? This operation may take several minutes depending on the number of clips.`}
        confirmText="Start Processing"
        confirmVariant="primary"
        onConfirm={handleConfirmProcess}
        onCancel={() => setShowConfirmation(false)}
      />

      <ConfirmationDialog
        isOpen={showForceCompleteConfirmation}
        title="Force Complete Process"
        message={`Are you sure you want to ${retryCount > 0 ? 'retry completion' : 'force complete'} this job? This should only be used if the process is stuck at 100%.`}
        confirmText={retryCount > 0 ? `Retry (Attempt ${retryCount + 1})` : 'Force Complete'}
        confirmVariant="danger"
        onConfirm={confirmForceComplete}
        onCancel={() => setShowForceCompleteConfirmation(false)}
      />
    </>
  );
};

export default ProcessClipsModal;
