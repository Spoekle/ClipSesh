'use client';

import React from 'react';
import { FaSpinner, FaExclamationTriangle, FaStop } from 'react-icons/fa';
import LiveProcessingView from '../LiveProcessingView';
import { Button } from '@/components/Button';

interface ProcessingStateViewProps {
  processJobId?: string | null;
  onProcessingComplete: () => void;
  onProcessingError: (error: string) => void;
  clipCount: number;
  season: string;
  year: number;
  progress: number;
  elapsedTime: number;
  formatTime: (sec: number) => string;
  errorMessage: string | null;
  stuckForTooLong: boolean;
  onForceComplete: () => void;
  retryCount: number;
  onCancelPipeline: () => void;
}

export const ProcessingStateView: React.FC<ProcessingStateViewProps> = ({
  processJobId,
  onProcessingComplete,
  onProcessingError,
  clipCount,
  season,
  year,
  progress,
  elapsedTime,
  formatTime,
  errorMessage,
  stuckForTooLong,
  onForceComplete,
  retryCount,
  onCancelPipeline,
}) => {
  return (
    <div className="space-y-4">
      {processJobId ? (
        <LiveProcessingView
          jobId={processJobId}
          onComplete={onProcessingComplete}
          onError={onProcessingError}
        />
      ) : (
        <>
          <div className="text-center mb-4">
            <p className="mb-3 text-xs text-muted-foreground">
              Processing {clipCount} clips for {season} {year}...
            </p>
            <div className="flex justify-center">
              <FaSpinner className="animate-spin text-3xl text-primary" />
            </div>
          </div>

          <div className="w-full bg-cc-ground rounded-full h-2 mb-4 overflow-hidden border border-border">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="text-center">
            <p className="font-semibold text-sm text-foreground">{progress}% Complete</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Elapsed time: {formatTime(elapsedTime)}
            </p>
          </div>
        </>
      )}

      {errorMessage && (
        <div className="bg-primary/10 border border-primary/30 p-3.5 rounded-xl text-primary text-xs">
          <p className="font-medium flex items-start">
            <FaExclamationTriangle className="inline mr-2 mt-0.5 shrink-0" />
            <span>Error: {errorMessage}</span>
          </p>
          <p className="mt-1.5 text-[11px] opacity-75">Check the browser console for more details.</p>
        </div>
      )}

      {stuckForTooLong && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl text-amber-400 text-xs">
          <p className="font-semibold mb-1 flex items-center">
            <FaExclamationTriangle className="inline mr-1.5" />
            The process appears to be stuck at 100%.
          </p>
          <p className="mb-2 text-muted-foreground">It may be experiencing an issue during finalization.</p>
          <Button
            variant="primary"
            size="xs"
            onClick={onForceComplete}
          >
            {retryCount > 0 ? `Retry (Attempt ${retryCount + 1})` : 'Force Complete'}
          </Button>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
        <Button
          variant="danger"
          size="sm"
          onClick={onCancelPipeline}
          leftIcon={<FaStop size={10} />}
        >
          Cancel Pipeline
        </Button>
      </div>
    </div>
  );
};

export default ProcessingStateView;
