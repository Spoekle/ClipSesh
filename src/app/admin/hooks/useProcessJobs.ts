'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { ProcessJobStatus } from '@/types/adminTypes';
import {
  getAllProcessingJobs,
  forceCompleteProcessJob,
  cancelProcessingJob,
  dismissProcessJob,
} from '@/services/adminService';
import { safeLocalStorage } from '@/utils/storage';
import { useNotification } from '@/context/AlertContext';

const DISMISSED_JOBS_KEY = 'clipsesh_dismissed_process_jobs';

export function useProcessJobs(onJobCompleted?: () => void) {
  const [processJobs, setProcessJobs] = useState<ProcessJobStatus[]>([]);
  const [selectedProcessJobId, setSelectedProcessJobId] = useState<string | null>(null);
  const [isProcessWidgetExpanded, setIsProcessWidgetExpanded] = useState<boolean>(false);
  const [dismissedProcessJobIds, setDismissedProcessJobIds] = useState<Set<string>>(() => {
    const stored = safeLocalStorage.getItem(DISMISSED_JOBS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return new Set(parsed);
        }
      } catch {
        // Ignore JSON parse errors
      }
    }
    return new Set();
  });

  const prevProcessJobStatusRef = useRef<Record<string, string>>({});
  const processLogsContainerRef = useRef<HTMLDivElement | null>(null);
  const { showSuccess, showError, showWarning } = useNotification();

  // Sync dismissed process jobs from localStorage on mount
  useEffect(() => {
    const stored = safeLocalStorage.getItem(DISMISSED_JOBS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setDismissedProcessJobIds(new Set(parsed));
        }
      } catch {
        // Ignore JSON parse errors
      }
    }
  }, []);

  const fetchAllProcessJobs = async (selectNewest = false) => {
    try {
      const res = await getAllProcessingJobs();
      if (res.success && Array.isArray(res.jobs)) {
        setProcessJobs(res.jobs);
        res.jobs.forEach((job) => {
          if (job.jobId) {
            prevProcessJobStatusRef.current[job.jobId] = job.status;
          }
        });

        if (selectNewest && res.jobs.length > 0 && res.jobs[0].jobId) {
          setSelectedProcessJobId(res.jobs[0].jobId);
        } else {
          setSelectedProcessJobId((curr) => {
            if (curr && res.jobs.some((j) => j.jobId === curr && !dismissedProcessJobIds.has(j.jobId))) {
              return curr;
            }
            const active = res.jobs.find((j) => j.status === 'processing' && j.jobId);
            if (active?.jobId) return active.jobId;
            const firstVisible = res.jobs.find((j) => j.jobId && !dismissedProcessJobIds.has(j.jobId));
            return firstVisible?.jobId || null;
          });
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch existing process jobs';
      console.error(message, err);
    }
  };

  useEffect(() => {
    fetchAllProcessJobs();
  }, []);

  // Poll when any job is actively processing
  const hasActiveProcessing = useMemo(() => {
    return processJobs.some((job) => job.status === 'processing');
  }, [processJobs]);

  useEffect(() => {
    if (!hasActiveProcessing) return;

    const interval = setInterval(async () => {
      try {
        const res = await getAllProcessingJobs();
        if (res.success && Array.isArray(res.jobs)) {
          setProcessJobs(res.jobs);

          res.jobs.forEach((job) => {
            if (!job.jobId) return;
            const prevStatus = prevProcessJobStatusRef.current[job.jobId];
            if (prevStatus === 'processing') {
              if (job.status === 'completed') {
                showSuccess(`Compilation complete! Created ZIP for ${job.season} ${job.year}.`);
                if (onJobCompleted) onJobCompleted();
              } else if (job.status === 'error') {
                showError(job.error || `Compilation job for ${job.season} ${job.year} failed.`);
              }
            }
            prevProcessJobStatusRef.current[job.jobId] = job.status;
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error polling processing tasks';
        console.error(message, err);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [hasActiveProcessing, showSuccess, showError, onJobCompleted]);

  // Visible jobs (filter out dismissed, unless processing)
  const visibleProcessJobs = useMemo(() => {
    return processJobs.filter(
      (j) => (j.jobId && !dismissedProcessJobIds.has(j.jobId)) || j.status === 'processing'
    );
  }, [processJobs, dismissedProcessJobIds]);

  const currentProcessJob = useMemo(() => {
    if (visibleProcessJobs.length === 0) return null;
    const found = visibleProcessJobs.find((j) => j.jobId === selectedProcessJobId);
    return found || visibleProcessJobs[0];
  }, [visibleProcessJobs, selectedProcessJobId]);

  // Auto-scroll logs
  useEffect(() => {
    if (isProcessWidgetExpanded && processLogsContainerRef.current) {
      processLogsContainerRef.current.scrollTop = processLogsContainerRef.current.scrollHeight;
    }
  }, [currentProcessJob?.logs, isProcessWidgetExpanded]);

  const handleDismissProcessJob = (jobId: string) => {
    setDismissedProcessJobIds((prev) => {
      const next = new Set(prev);
      next.add(jobId);
      safeLocalStorage.setItem(DISMISSED_JOBS_KEY, JSON.stringify(Array.from(next)));
      return next;
    });

    setSelectedProcessJobId((curr) => {
      if (curr === jobId) {
        const remaining = visibleProcessJobs.filter((j) => j.jobId !== jobId);
        return remaining[0]?.jobId || null;
      }
      return curr;
    });

    if (visibleProcessJobs.filter((j) => j.jobId !== jobId).length === 0) {
      setIsProcessWidgetExpanded(false);
    }

    dismissProcessJob(jobId).catch((err: unknown) => {
      console.warn('Could not dismiss process job on server:', err);
    });
  };

  const handleDismissAllProcessJobs = () => {
    const finishedJobs = processJobs.filter((j) => j.status !== 'processing' && j.jobId);
    const finishedIds = finishedJobs.map((j) => j.jobId as string);

    setDismissedProcessJobIds((prev) => {
      const next = new Set(prev);
      finishedIds.forEach((id) => next.add(id));
      safeLocalStorage.setItem(DISMISSED_JOBS_KEY, JSON.stringify(Array.from(next)));
      return next;
    });

    setIsProcessWidgetExpanded(false);

    finishedIds.forEach((id) => {
      dismissProcessJob(id).catch(() => {});
    });
  };

  const handleForceCompleteProcess = async (jobId: string) => {
    try {
      await forceCompleteProcessJob(jobId);
      showWarning('Job manually completed.');
      await fetchAllProcessJobs();
      if (onJobCompleted) onJobCompleted();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to force complete job';
      showError(message);
    }
  };

  const handleCancelProcessJob = async (jobId: string) => {
    try {
      showWarning('Cancelling ZIP compilation...');
      await cancelProcessingJob(jobId);
      showSuccess('Compilation cancelled');
      await fetchAllProcessJobs();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to cancel compilation';
      showError(message);
    }
  };

  const unDismissJob = (jobId: string) => {
    setDismissedProcessJobIds((prev) => {
      if (prev.has(jobId)) {
        const next = new Set(prev);
        next.delete(jobId);
        safeLocalStorage.setItem(DISMISSED_JOBS_KEY, JSON.stringify(Array.from(next)));
        return next;
      }
      return prev;
    });
  };

  return {
    processJobs,
    visibleProcessJobs,
    currentProcessJob,
    selectedProcessJobId,
    setSelectedProcessJobId,
    isProcessWidgetExpanded,
    setIsProcessWidgetExpanded,
    processLogsContainerRef,
    fetchAllProcessJobs,
    handleDismissProcessJob,
    handleDismissAllProcessJobs,
    handleForceCompleteProcess,
    handleCancelProcessJob,
    unDismissJob,
  };
}

export default useProcessJobs;
