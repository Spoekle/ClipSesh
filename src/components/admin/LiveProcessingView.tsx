import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaExclamationCircle, FaSpinner, FaCircleNotch, FaHourglassHalf } from 'react-icons/fa';
import useSocket from '../../hooks/useSocket';

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

interface LiveProcessingViewProps {
  jobId: string;
  onComplete: () => void;
  onError: (error: string) => void;
}

const LiveProcessingView: React.FC<LiveProcessingViewProps> = ({ jobId, onComplete, onError }) => {
  const { subscribeToEvent } = useSocket();
  const [clipsStatus, setClipsStatus] = useState<ClipProcessingStatus[]>([]);
  const [currentPhase, setCurrentPhase] = useState<JobPhase | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);
  const [processed, setProcessed] = useState(0);
  const [total, setTotal] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [averageProcessingTime, setAverageProcessingTime] = useState(0);
  const [currentlyProcessing, setCurrentlyProcessing] = useState<ClipProcessingStatus | null>(null); 
  const [recentErrors, setRecentErrors] = useState<ClipProcessingStatus[]>([]);
  const [isListening, setIsListening] = useState(false);

  // Track elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      if (startTime) {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  // Calculate average processing time when clips status changes
  useEffect(() => {
    const processedClips = clipsStatus.filter(clip =>
      clip.status === 'processed' && clip.processingTime
    );
    if (processedClips.length > 0) {
      const totalTime = processedClips.reduce((sum, clip) => sum + (clip.processingTime || 0), 0);
      setAverageProcessingTime(totalTime / processedClips.length);
    }
  }, [clipsStatus]);

  // Format time from seconds to mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  // Subscribe to websocket events
  useEffect(() => {
    console.log(`Setting up WebSocket listeners for job ${jobId}`);
    setIsListening(true);

    // Track job start
    const jobStartedUnsubscribe = subscribeToEvent(`job:started:${jobId}`, (data) => {
      console.log('Job started:', data);
      setStartTime(Date.now());
      setTotal(data.totalClips);

      // Initialize clips status array
      const initialClips = Array(data.totalClips).fill(null).map((_, index) => ({
        index,
        title: `Clip ${index + 1}`,
        streamer: '...',
        status: 'pending' as const
      }));
      setClipsStatus(initialClips);
      console.log('Initialized clips status with', data.totalClips, 'clips');
    });// Track clip processing
    const clipProcessingUnsubscribe = subscribeToEvent(`job:clip:processing:${jobId}`, (data) => {
      console.log('Clip processing:', data);
      const clipData = {
        index: data.clipIndex,
        title: data.clipData.title || `Clip ${data.clipIndex + 1}`,
        streamer: data.clipData.streamer || '...',
        status: 'processing' as const
      };

      setClipsStatus(prev => {
        const newStatus = [...prev];
        if (newStatus[data.clipIndex]) {
          newStatus[data.clipIndex] = clipData;
        }
        return newStatus;
      });

      setCurrentlyProcessing(clipData);
    });    // Track clip processed
    const clipProcessedUnsubscribe = subscribeToEvent(`job:clip:processed:${jobId}`, (data) => {
      console.log('Clip processed:', data);
      const clipData = {
        index: data.clipIndex,
        title: data.clipData.title || `Clip ${data.clipIndex + 1}`,
        streamer: data.clipData.streamer || '...',
        status: 'processed' as const,
        processingTime: data.processingTime
      };
      setClipsStatus(prev => {
        const newStatus = [...prev];
        if (newStatus[data.clipIndex]) {
          newStatus[data.clipIndex] = clipData;
        }
        return newStatus;
      });

      setCurrentlyProcessing(null);
    });// Track clip errors
    const clipErrorUnsubscribe = subscribeToEvent(`job:clip:error:${jobId}`, (data) => {
      console.log('Clip error:', data);
      const clipData = {
        index: data.clipIndex,
        title: data.clipData.title || `Clip ${data.clipIndex + 1}`,
        streamer: data.clipData.streamer || '...',
        status: 'error' as const,
        error: data.error
      };

      setClipsStatus(prev => {
        const newStatus = [...prev];
        if (newStatus[data.clipIndex]) {
          newStatus[data.clipIndex] = clipData;
        }
        return newStatus;
      });

      // Track recent errors
      setRecentErrors(prev => [clipData, ...prev].slice(0, 10));
      setCurrentlyProcessing(null);
    });    // Track overall progress
    const progressUnsubscribe = subscribeToEvent(`job:progress:${jobId}`, (data) => {
      console.log('Progress update:', data);
      setOverallProgress(data.progress);
      setProcessed(data.processed);
      setTotal(data.total);
      setEstimatedTimeRemaining(data.estimatedTimeRemaining);
      console.log(`Progress: ${data.progress}%, Processed: ${data.processed}/${data.total}`);
    });

    // Track job phase changes
    const phaseUnsubscribe = subscribeToEvent(`job:phase:${jobId}`, (data) => {
      console.log('Phase change:', data);
      setCurrentPhase(data);
    });

    // Track job completion
    const completedUnsubscribe = subscribeToEvent(`job:completed:${jobId}`, (data) => {
      console.log('Job completed:', data);
      setOverallProgress(100);
      setProcessed(total);
      setTimeout(() => {
        onComplete();
      }, 2000);
    });

    // Track job errors
    const errorUnsubscribe = subscribeToEvent(`job:error:${jobId}`, (data) => {
      console.error('Job error:', data);
      onError(data.error || 'An unknown error occurred');
    });    // Clean up all subscriptions
    return () => {
      console.log(`Cleaning up WebSocket listeners for job ${jobId}`);
      setIsListening(false);
      jobStartedUnsubscribe();
      clipProcessingUnsubscribe();
      clipProcessedUnsubscribe();
      clipErrorUnsubscribe();
      progressUnsubscribe();
      phaseUnsubscribe();
      completedUnsubscribe();
      errorUnsubscribe();
    };
  }, [jobId, subscribeToEvent, total, onComplete, onError]); return (
    <div className="space-y-4 relative text-[#f1f1f1]">
      {/* Overall progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-semibold text-[#f1f1f1]">
          <span>Overall Progress</span>
          <span className="text-[#aaaaaa] font-mono">{processed} / {total} clips</span>
        </div>
        <div className="w-full h-2 bg-[#222222] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#f23030] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-[#717171]">
          <div>
            <span className="font-medium">Elapsed:</span> {formatTime(elapsedTime)}
          </div>
          {estimatedTimeRemaining && (
            <div>
              <span className="font-medium">Remaining:</span> {estimatedTimeRemaining}
            </div>
          )}
          <div>
            <span className="font-medium text-[#aaaaaa]">{overallProgress}%</span>
          </div>
        </div>
      </div>

      {/* Current phase */}
      {currentPhase && (
        <div className="p-3 bg-[#141414] border border-[#262626] rounded-xl text-[#f1f1f1] flex items-center text-xs">
          <FaHourglassHalf className="mr-2 text-[#eab308] flex-shrink-0" />
          <span className="truncate">{currentPhase.message || `Phase: ${currentPhase.phase}`}</span>
        </div>
      )}

      {/* Recent clips activity */}
      <div className="max-h-56 overflow-auto border border-[#262626] bg-[#121212] rounded-xl p-3">
        <h3 className="text-xs font-semibold text-[#717171] uppercase tracking-wider mb-2.5">Live Processing Stream</h3>

        {/* Currently processing */}
        {currentlyProcessing && (
          <div className="mb-2.5 p-2.5 bg-[#181818] rounded-xl border border-[#38bdf8]/40">
            <div className="flex items-center text-xs">
              <FaSpinner className="text-[#38bdf8] animate-spin mr-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[#38bdf8] text-[11px] uppercase tracking-wide">Currently Processing</div>
                <div className="text-[#f1f1f1] font-medium truncate">{currentlyProcessing.title}</div>
                <div className="text-[10px] text-[#717171]">by {currentlyProcessing.streamer}</div>
              </div>
            </div>
          </div>
        )}

        {/* Recent completed clips */}
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-bold text-[#717171] uppercase tracking-wider">
            Recently Completed
          </h4>
          {clipsStatus
            .filter(clip => clip.status === 'processed')
            .slice(-3)
            .reverse()
            .map(clip => (
              <div key={`processed-${clip.index}`} className="text-xs flex items-center p-2 bg-[#181818] border border-[#262626] rounded-lg">
                <FaCheckCircle className="text-[#22c55e] mr-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#f1f1f1] truncate">{clip.title}</div>
                  <div className="text-[10px] text-[#717171]">by {clip.streamer}</div>
                </div>
                {clip.processingTime && (
                  <div className="text-[11px] text-[#22c55e] font-mono font-medium ml-2">
                    {(clip.processingTime / 1000).toFixed(1)}s
                  </div>
                )}
              </div>
            ))}
        </div>

        {/* Recent errors */}
        {recentErrors.length > 0 && (
          <div className="space-y-1.5 mt-2.5">
            <h4 className="text-[10px] font-bold text-[#f23030] uppercase tracking-wide">
              Recent Errors
            </h4>
            {recentErrors.slice(0, 2).map(clip => (
              <div key={`error-${clip.index}`} className="text-xs flex items-start p-2 bg-[#181818] border border-[#f23030]/30 rounded-lg">
                <FaExclamationCircle className="text-[#f23030] mr-2 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#f1f1f1] truncate">{clip.title}</div>
                  <div className="text-[10px] text-[#717171] mb-0.5">by {clip.streamer}</div>
                  <div className="text-[11px] text-[#f23030] break-words">
                    {clip.error && clip.error.length > 50 ? `${clip.error.substring(0, 50)}...` : clip.error}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No activity message */}
        {!currentlyProcessing && clipsStatus.filter(clip => clip.status !== 'pending').length === 0 && (
          <div className="text-xs text-[#717171] flex items-center justify-center py-4">
            <FaCircleNotch className="animate-spin mr-2" />
            Waiting for worker pipeline to initiate...
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveProcessingView;
