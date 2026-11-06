'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  getAllScraperDownloads,
  startScraperDownload,
  stopScraperDownload,
  dismissScraperDownload,
  ScraperDownloadStatusResponse,
  ScrapedClipItem,
} from '@/services/adminService';
import { useNotification } from '@/context/AlertContext';
import { safeLocalStorage } from '@/utils/storage';

const DISMISSED_STORAGE_KEY = 'clipsesh_dismissed_scraper_jobs';

export function useScraperDownloads() {
  const { showSuccess, showError, showWarning } = useNotification();
  const [downloadJobs, setDownloadJobs] = useState<ScraperDownloadStatusResponse[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isStartingDownload, setIsStartingDownload] = useState<boolean>(false);
  const [isWidgetExpanded, setIsWidgetExpanded] = useState<boolean>(false);
  const [dismissedJobIds, setDismissedJobIds] = useState<Set<string>>(() => {
    const stored = safeLocalStorage.getItem(DISMISSED_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return new Set(parsed as string[]);
        }
      } catch {
        // ignore parse error
      }
    }
    return new Set<string>();
  });

  const prevJobStatusRef = useRef<Record<string, string>>({});

  const fetchAllJobs = useCallback(async (selectNewest = false) => {
    try {
      const res = await getAllScraperDownloads();
      if (res.success && Array.isArray(res.jobs)) {
        setDownloadJobs(res.jobs);
        res.jobs.forEach((job) => {
          prevJobStatusRef.current[job.jobId] = job.status;
        });

        if (selectNewest && res.jobs.length > 0) {
          setSelectedJobId(res.jobs[0].jobId);
        } else {
          setSelectedJobId((curr) => {
            if (curr && res.jobs.some((j) => j.jobId === curr && !dismissedJobIds.has(j.jobId))) {
              return curr;
            }
            const downloading = res.jobs.find((j) => j.status === 'downloading');
            if (downloading) return downloading.jobId;
            const firstVisible = res.jobs.find((j) => !dismissedJobIds.has(j.jobId));
            return firstVisible?.jobId ?? null;
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch existing download jobs:', err);
    }
  }, [dismissedJobIds]);

  useEffect(() => {
    fetchAllJobs();
  }, [fetchAllJobs]);

  const hasActiveDownloads = useMemo(() => {
    return downloadJobs.some((job) => job.status === 'downloading');
  }, [downloadJobs]);

  useEffect(() => {
    if (!hasActiveDownloads) return;

    const interval = setInterval(async () => {
      try {
        const res = await getAllScraperDownloads();
        if (res.success && Array.isArray(res.jobs)) {
          setDownloadJobs(res.jobs);

          res.jobs.forEach((job) => {
            const prevStatus = prevJobStatusRef.current[job.jobId];
            if (prevStatus === 'downloading') {
              if (job.status === 'completed') {
                showSuccess(`Download complete! Successfully ingested ${job.successCount} clips.`);
              } else if (job.status === 'stopped') {
                showWarning(`Download job stopped. ${job.successCount} clips were saved.`);
              } else if (job.status === 'error') {
                showError(job.error ?? 'Download job encountered an error.');
              }
            }
            prevJobStatusRef.current[job.jobId] = job.status;
          });
        }
      } catch (err) {
        console.error('Error polling download tasks:', err);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [hasActiveDownloads, showSuccess, showWarning, showError]);

  const visibleJobs = useMemo(() => {
    return downloadJobs.filter((j) => !dismissedJobIds.has(j.jobId) || j.status === 'downloading');
  }, [downloadJobs, dismissedJobIds]);

  const currentJob = useMemo(() => {
    if (visibleJobs.length === 0) return null;
    const found = visibleJobs.find((j) => j.jobId === selectedJobId);
    return found ?? visibleJobs[0];
  }, [visibleJobs, selectedJobId]);

  const handleStartDownload = async (clipsToDownload: ScrapedClipItem[], concurrency?: number) => {
    if (clipsToDownload.length === 0) {
      showError('No clips selected for download');
      return;
    }

    setIsStartingDownload(true);

    try {
      const res = await startScraperDownload(clipsToDownload, concurrency);
      showSuccess(`Download started for ${clipsToDownload.length} clips...`);
      if (res.jobId) {
        setDismissedJobIds((prev) => {
          if (prev.has(res.jobId)) {
            const next = new Set(prev);
            next.delete(res.jobId);
            safeLocalStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(next)));
            return next;
          }
          return prev;
        });
      }
      await fetchAllJobs(true);
      if (res.jobId) {
        setSelectedJobId(res.jobId);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start download';
      showError(msg);
    } finally {
      setIsStartingDownload(false);
    }
  };

  const handleStopDownload = async (jobIdToStop?: string) => {
    const id = jobIdToStop ?? currentJob?.jobId;
    if (!id) return;
    try {
      await stopScraperDownload(id);
      showWarning('Stopping download job...');
      await fetchAllJobs();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to stop download';
      showError(msg);
    }
  };

  const handleDismissJob = (jobId: string) => {
    setDismissedJobIds((prev) => {
      const next = new Set(prev);
      next.add(jobId);
      safeLocalStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(next)));
      return next;
    });

    setSelectedJobId((curr) => {
      if (curr === jobId) {
        const remaining = visibleJobs.filter((j) => j.jobId !== jobId);
        return remaining[0]?.jobId ?? null;
      }
      return curr;
    });

    if (visibleJobs.filter((j) => j.jobId !== jobId).length === 0) {
      setIsWidgetExpanded(false);
    }

    dismissScraperDownload(jobId).catch((err) => {
      console.warn('Could not dismiss scraper download on server:', err);
    });
  };

  const handleDismissAll = () => {
    const finishedJobs = downloadJobs.filter((j) => j.status !== 'downloading');
    const finishedIds = finishedJobs.map((j) => j.jobId);

    setDismissedJobIds((prev) => {
      const next = new Set(prev);
      finishedIds.forEach((id) => next.add(id));
      safeLocalStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(next)));
      return next;
    });

    setIsWidgetExpanded(false);

    finishedIds.forEach((id) => {
      dismissScraperDownload(id).catch(() => {});
    });
  };

  return {
    downloadJobs,
    visibleJobs,
    currentJob,
    selectedJobId,
    setSelectedJobId,
    isStartingDownload,
    isWidgetExpanded,
    setIsWidgetExpanded,
    fetchAllJobs,
    handleStartDownload,
    handleStopDownload,
    handleDismissJob,
    handleDismissAll,
  };
}
