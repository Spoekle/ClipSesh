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

  // Track elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      if (startTime) {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  // Format time from seconds to mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Subscribe to websocket events
  useEffect(() => {
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
    });

    // Track clip processing
    const clipProcessingUnsubscribe = subscribeToEvent(`job:clip:processing:${jobId}`, (data) => {
      console.log('Clip processing:', data);
      setClipsStatus(prev => {
        const newStatus = [...prev];
        if (newStatus[data.clipIndex]) {
          newStatus[data.clipIndex] = {
            index: data.clipIndex,
            title: data.clipData.title || `Clip ${data.clipIndex + 1}`,
            streamer: data.clipData.streamer || '...',
            status: 'processing'
          };
        }
        return newStatus;
      });
    });

    // Track clip processed
    const clipProcessedUnsubscribe = subscribeToEvent(`job:clip:processed:${jobId}`, (data) => {
      console.log('Clip processed:', data);
      setClipsStatus(prev => {
        const newStatus = [...prev];
        if (newStatus[data.clipIndex]) {
          newStatus[data.clipIndex] = {
            index: data.clipIndex,
            title: data.clipData.title || `Clip ${data.clipIndex + 1}`,
            streamer: data.clipData.streamer || '...',
            status: 'processed',
            processingTime: data.processingTime
          };
        }
        return newStatus;
      });
    });

    // Track clip errors
    const clipErrorUnsubscribe = subscribeToEvent(`job:clip:error:${jobId}`, (data) => {
      console.log('Clip error:', data);
      setClipsStatus(prev => {
        const newStatus = [...prev];
        if (newStatus[data.clipIndex]) {
          newStatus[data.clipIndex] = {
            index: data.clipIndex,
            title: data.clipData.title || `Clip ${data.clipIndex + 1}`,
            streamer: data.clipData.streamer || '...',
            status: 'error',
            error: data.error
          };
        }
        return newStatus;
      });
    });

    // Track overall progress
    const progressUnsubscribe = subscribeToEvent(`job:progress:${jobId}`, (data) => {
      console.log('Progress update:', data);
      setOverallProgress(data.progress);
      setProcessed(data.processed);
      setTotal(data.total);
      setEstimatedTimeRemaining(data.estimatedTimeRemaining);
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
    });

    // Clean up all subscriptions
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
    <div className="space-y-6">
      {/* Overall progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm font-medium">
          <span>Overall Progress</span>
          <span>{processed} / {total} clips processed</span>
        </div>
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full">
          <motion.div 
            className="h-full bg-blue-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <div>
            <span className="font-medium">Elapsed:</span> {formatTime(elapsedTime)}
          </div>
          {estimatedTimeRemaining && (
            <div>
              <span className="font-medium">Remaining:</span> {estimatedTimeRemaining}
            </div>
          )}
          <div>
            <span className="font-medium">Progress:</span> {overallProgress}%
          </div>
        </div>
      </div>

      {/* Current phase */}
      {currentPhase && (
        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-800 dark:text-blue-200 flex items-center text-sm">
          <FaHourglassHalf className="mr-2" />
          <span>{currentPhase.message || `Phase: ${currentPhase.phase}`}</span>
        </div>
      )}

      {/* Recent clips activity */}
      <div className="max-h-60 overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
        <h3 className="text-sm font-medium mb-2">Recent Activity</h3>
        <div className="space-y-2">
          {clipsStatus
            .filter(clip => clip.status !== 'pending')
            .slice(-5)
            .reverse()
            .map(clip => (
              <div key={clip.index} className="text-sm flex items-center p-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                {clip.status === 'processing' && (
                  <FaSpinner className="text-blue-500 animate-spin mr-2" />
                )}
                {clip.status === 'processed' && (
                  <FaCheckCircle className="text-green-500 mr-2" />
                )}
                {clip.status === 'error' && (
                  <FaExclamationCircle className="text-red-500 mr-2" />
                )}
                <div className="flex-1">
                  <div className="font-medium">{clip.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">by {clip.streamer}</div>
                </div>
                {clip.processingTime && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {(clip.processingTime / 1000).toFixed(1)}s
                  </div>
                )}
                {clip.error && (
                  <div className="text-xs text-red-500 ml-2">
                    {clip.error.substring(0, 30)}...
                  </div>
                )}
              </div>
            ))}

          {clipsStatus.filter(clip => clip.status !== 'pending').length === 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center py-4">
              <FaCircleNotch className="animate-spin mr-2" />
              Waiting for processing to start...
            </div>
          )}
        </div>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
          <div className="text-xs text-gray-500 dark:text-gray-400">Pending</div>
          <div className="font-bold">
            {clipsStatus.filter(clip => clip.status === 'pending').length}
          </div>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded">
          <div className="text-xs text-blue-500 dark:text-blue-400">Processing</div>
          <div className="font-bold text-blue-700 dark:text-blue-300">
            {clipsStatus.filter(clip => clip.status === 'processing').length}
          </div>
        </div>
        <div className="bg-green-100 dark:bg-green-900 p-2 rounded">
          <div className="text-xs text-green-500 dark:text-green-400">Completed</div>
          <div className="font-bold text-green-700 dark:text-green-300">
            {clipsStatus.filter(clip => clip.status === 'processed').length}
          </div>
        </div>
        <div className="bg-red-100 dark:bg-red-900 p-2 rounded">
          <div className="text-xs text-red-500 dark:text-red-400">Errors</div>
          <div className="font-bold text-red-700 dark:text-red-300">
            {clipsStatus.filter(clip => clip.status === 'error').length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveProcessingView;
