'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Loader2, Hourglass } from 'lucide-react';
import useSocket from '@/hooks/useSocket';

interface ClipProcessingStatus {
  index: number;
  title: string;
  streamer: string;
  status: 'pending' | 'processing' | 'processed' | 'error';
  error?: string;
  processingTime?: number;
}

interface JobPhase {
  phase: string;
  message: string;
  timestamp: number;
}

interface JobStartedData {
  totalClips: number;
}

interface JobClipData {
  clipIndex: number;
  clipData: {
    title?: string;
    streamer?: string;
  };
  processingTime?: number;
  error?: string;
}

interface JobProgressData {
  progress: number;
  processed: number;
  total: number;
  estimatedTimeRemaining: string;
}

interface JobErrorData {
  error?: string;
}

interface LiveProcessingViewProps {
  jobId: string;
  onComplete: () => void;
  onError: (error: string) => void;
}

export const LiveProcessingView: React.FC<LiveProcessingViewProps> = ({ jobId, onComplete, onError }) => {
  const { subscribeToEvent } = useSocket();
  const [clipsStatus, setClipsStatus] = useState<ClipProcessingStatus[]>([]);
  const [currentPhase, setCurrentPhase] = useState<JobPhase | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);
  const [processed, setProcessed] = useState(0);
  const [total, setTotal] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentlyProcessing, setCurrentlyProcessing] = useState<ClipProcessingStatus | null>(null);
  const [recentErrors, setRecentErrors] = useState<ClipProcessingStatus[]>([]);

  // Track elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      if (startTime) {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Subscribe to websocket events
  useEffect(() => {
    const jobStartedUnsubscribe = subscribeToEvent(`job:started:${jobId}`, (raw: unknown) => {
      const data = raw as JobStartedData;
      setStartTime(Date.now());
      setTotal(data.totalClips);

      const initialClips = Array(data.totalClips)
        .fill(null)
        .map((_, index) => ({
          index,
          title: `Clip ${index + 1}`,
          streamer: '...',
          status: 'pending' as const,
        }));
      setClipsStatus(initialClips);
    });

    const clipProcessingUnsubscribe = subscribeToEvent(`job:clip:processing:${jobId}`, (raw: unknown) => {
      const data = raw as JobClipData;
      const clipData: ClipProcessingStatus = {
        index: data.clipIndex,
        title: data.clipData.title || `Clip ${data.clipIndex + 1}`,
        streamer: data.clipData.streamer || '...',
        status: 'processing',
      };

      setClipsStatus((prev) => {
        const newStatus = [...prev];
        if (newStatus[data.clipIndex]) {
          newStatus[data.clipIndex] = clipData;
        }
        return newStatus;
      });

      setCurrentlyProcessing(clipData);
    });

    const clipProcessedUnsubscribe = subscribeToEvent(`job:clip:processed:${jobId}`, (raw: unknown) => {
      const data = raw as JobClipData;
      const clipData: ClipProcessingStatus = {
        index: data.clipIndex,
        title: data.clipData.title || `Clip ${data.clipIndex + 1}`,
        streamer: data.clipData.streamer || '...',
        status: 'processed',
        processingTime: data.processingTime,
      };
      setClipsStatus((prev) => {
        const newStatus = [...prev];
        if (newStatus[data.clipIndex]) {
          newStatus[data.clipIndex] = clipData;
        }
        return newStatus;
      });

      setCurrentlyProcessing(null);
    });

    const clipErrorUnsubscribe = subscribeToEvent(`job:clip:error:${jobId}`, (raw: unknown) => {
      const data = raw as JobClipData;
      const clipData: ClipProcessingStatus = {
        index: data.clipIndex,
        title: data.clipData.title || `Clip ${data.clipIndex + 1}`,
        streamer: data.clipData.streamer || '...',
        status: 'error',
        error: data.error,
      };

      setClipsStatus((prev) => {
        const newStatus = [...prev];
        if (newStatus[data.clipIndex]) {
          newStatus[data.clipIndex] = clipData;
        }
        return newStatus;
      });

      setRecentErrors((prev) => [clipData, ...prev].slice(0, 10));
      setCurrentlyProcessing(null);
    });

    const progressUnsubscribe = subscribeToEvent(`job:progress:${jobId}`, (raw: unknown) => {
      const data = raw as JobProgressData;
      setOverallProgress(data.progress);
      setProcessed(data.processed);
      setTotal(data.total);
      setEstimatedTimeRemaining(data.estimatedTimeRemaining);
    });

    const phaseUnsubscribe = subscribeToEvent(`job:phase:${jobId}`, (raw: unknown) => {
      const data = raw as JobPhase;
      setCurrentPhase(data);
    });

    const completedUnsubscribe = subscribeToEvent(`job:completed:${jobId}`, () => {
      setOverallProgress(100);
      setProcessed(total);
      setTimeout(() => {
        onComplete();
      }, 2000);
    });

    const errorUnsubscribe = subscribeToEvent(`job:error:${jobId}`, (raw: unknown) => {
      const data = raw as JobErrorData;
      onError(data.error || 'An unknown error occurred');
    });

    return () => {
      jobStartedUnsubscribe();
      clipProcessingUnsubscribe();
      clipProcessedUnsubscribe();
      clipErrorUnsubscribe();
      progressUnsubscribe();
      phaseUnsubscribe();
      completedUnsubscribe();
      errorUnsubscribe();
    };
  }, [jobId, subscribeToEvent, total, onComplete, onError]);

  return (
    <div className="space-y-4 relative text-foreground">
      {/* Overall progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold text-foreground">
          <span>Overall Progress</span>
          <span className="text-muted-foreground font-mono">{processed} / {total} clips</span>
        </div>
        <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-border">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <div>
            <span className="font-medium">Elapsed:</span> {formatTime(elapsedTime)}
          </div>
          {estimatedTimeRemaining && (
            <div>
              <span className="font-medium">Remaining:</span> {estimatedTimeRemaining}
            </div>
          )}
          <div>
            <span className="font-medium text-muted-foreground">{overallProgress}%</span>
          </div>
        </div>
      </div>

      {/* Current phase */}
      {currentPhase && (
        <div className="p-3 bg-background border border-border rounded-xl text-foreground flex items-center text-xs">
          <Hourglass className="mr-2 size-3.5 text-amber-400 shrink-0" />
          <span className="truncate">{currentPhase.message || `Phase: ${currentPhase.phase}`}</span>
        </div>
      )}

      {/* Recent clips activity */}
      <div className="max-h-56 overflow-auto border border-border bg-background rounded-xl p-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
          Live Processing Stream
        </h3>

        {/* Currently processing */}
        {currentlyProcessing && (
          <div className="mb-2.5 p-2.5 bg-card rounded-xl border border-sky-400/40">
            <div className="flex items-center text-xs">
              <Loader2 className="text-sky-400 animate-spin mr-2 shrink-0 size-3.5" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sky-400 text-[11px] uppercase tracking-wide">
                  Currently Processing
                </div>
                <div className="text-foreground font-medium truncate">{currentlyProcessing.title}</div>
                <div className="text-[10px] text-muted-foreground">by {currentlyProcessing.streamer}</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent completed clips */}
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Recently Completed
          </h4>
          {clipsStatus
            .filter((clip) => clip.status === 'processed')
            .slice(-3)
            .reverse()
            .map((clip) => (
              <div
                key={`processed-${clip.index}`}
                className="text-xs flex items-center p-2 bg-card border border-border rounded-lg"
              >
                <CheckCircle2 className="text-emerald-400 mr-2 shrink-0 size-3.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">{clip.title}</div>
                  <div className="text-[10px] text-muted-foreground">by {clip.streamer}</div>
                </div>
                {clip.processingTime && (
                  <div className="text-[11px] text-emerald-400 font-mono font-medium ml-2">
                    {(clip.processingTime / 1000).toFixed(1)}s
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Recent errors */}
        {recentErrors.length > 0 && (
          <div className="space-y-1.5 mt-2.5">
            <h4 className="text-[10px] font-bold text-primary uppercase tracking-wide">
              Recent Errors
            </h4>
            {recentErrors.slice(0, 2).map((clip) => (
              <div
                key={`error-${clip.index}`}
                className="text-xs flex items-start p-2 bg-card border border-primary/30 rounded-lg"
              >
                <AlertCircle className="text-primary mr-2 mt-0.5 shrink-0 size-3.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">{clip.title}</div>
                  <div className="text-[10px] text-muted-foreground mb-0.5">by {clip.streamer}</div>
                  <div className="text-[11px] text-primary break-words">
                    {clip.error && clip.error.length > 50
                      ? `${clip.error.substring(0, 50)}...`
                      : clip.error}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No activity message */}
        {!currentlyProcessing &&
          clipsStatus.filter((clip) => clip.status !== 'pending').length === 0 && (
            <div className="text-xs text-muted-foreground flex items-center justify-center py-4">
              <Loader2 className="animate-spin mr-2 size-3.5" />
              Waiting for worker pipeline to initiate...
            </div>
          )}
      </div>
    </div>
  );
};

export default LiveProcessingView;
