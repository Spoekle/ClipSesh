'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  startChannelScan,
  getChannelScanStatus,
  stopChannelScan,
  ChannelScanStatusResponse,
} from '@/services/adminService';
import { useNotification } from '@/context/AlertContext';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import { useScraperDownloads } from './scraper/useScraperDownloads';
import { ScraperChannelScanner } from './scraper/ScraperChannelScanner';
import { ScrapedClipsTable } from './scraper/ScrapedClipsTable';
import { ScraperIngestionWidget } from './scraper/ScraperIngestionWidget';

interface DiscordScraperProps {
  configuredChannels?: string[];
  initialChannelId?: string;
}

export const DiscordScraper: React.FC<DiscordScraperProps> = ({
  configuredChannels = [],
  initialChannelId = '',
}) => {
  const { showSuccess, showError, showWarning } = useNotification();

  // Channel input state
  const [channelId, setChannelId] = useState<string>(initialChannelId);

  // Scan state
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanJobId, setScanJobId] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState<{
    scannedMessages: number;
    foundClipsCount: number;
  }>({ scannedMessages: 0, foundClipsCount: 0 });
  const [scanResult, setScanResult] = useState<ChannelScanStatusResponse | null>(null);

  // Selection & filter state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [originFilter, setOriginFilter] = useState<string>('all');
  const [seasonFilter, setSeasonFilter] = useState<string>('all');
  const [onlyNewFilter, setOnlyNewFilter] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [concurrency, setConcurrency] = useState<number>(3);

  // Confirmation dialog
  const [showConfirmDownload, setShowConfirmDownload] = useState<boolean>(false);

  // Hook for download jobs, polling, and floating widget
  const {
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
  } = useScraperDownloads();

  useEffect(() => {
    if (initialChannelId) {
      setChannelId(initialChannelId);
    }
  }, [initialChannelId]);

  // Poll scan progress
  useEffect(() => {
    if (!scanJobId || !isScanning) return;

    const interval = setInterval(async () => {
      try {
        const data = await getChannelScanStatus(scanJobId);
        setScanProgress({
          scannedMessages: data.scannedMessages || 0,
          foundClipsCount: data.foundClipsCount || 0,
        });

        if (data.status === 'ready') {
          setIsScanning(false);
          setScanResult(data);
          const newIds = new Set<string>();
          (data.clips || []).forEach((c) => {
            if (!c.alreadyExists) {
              newIds.add(c.id);
            }
          });
          setSelectedIds(newIds);
          showSuccess(
            `Found ${data.clips?.length || 0} clips (${data.stats?.newClips || 0} new) from ${data.scannedMessages.toLocaleString()} messages!`
          );
        } else if (data.status === 'error') {
          setIsScanning(false);
          showError(data.error || 'Failed to scan channel');
        }
      } catch (err) {
        setIsScanning(false);
        const msg = err instanceof Error ? err.message : 'Error checking scan status';
        showError(msg);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [scanJobId, isScanning, showSuccess, showError]);

  const handleStartScan = async () => {
    const trimmed = channelId.trim();
    if (!trimmed) {
      showError('Please enter a Discord Channel ID');
      return;
    }

    setIsScanning(true);
    setScanResult(null);
    setScanProgress({ scannedMessages: 0, foundClipsCount: 0 });
    setSelectedIds(new Set());

    try {
      const res = await startChannelScan(trimmed);
      setScanJobId(res.jobId);
    } catch (err) {
      setIsScanning(false);
      const msg = err instanceof Error ? err.message : 'Failed to start channel scan';
      showError(msg);
    }
  };

  const handleCancelScan = async () => {
    if (!scanJobId) {
      setIsScanning(false);
      return;
    }
    try {
      showWarning('Cancelling channel scan...');
      await stopChannelScan(scanJobId);
      setIsScanning(false);
      showSuccess('Channel scan cancelled');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel scan';
      showError(msg);
      setIsScanning(false);
    }
  };

  // Filtered clips
  const filteredClips = useMemo(() => {
    if (!scanResult?.clips) return [];

    return scanResult.clips.filter((clip) => {
      if (originFilter !== 'all' && clip.origin !== originFilter) return false;

      if (seasonFilter !== 'all') {
        const seasonKey = `${clip.season} ${clip.year}`;
        if (seasonKey !== seasonFilter) return false;
      }

      if (onlyNewFilter && clip.alreadyExists) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = clip.title.toLowerCase().includes(q);
        const matchAuthor = clip.author.toLowerCase().includes(q);
        const matchLink = clip.link.toLowerCase().includes(q);
        if (!matchTitle && !matchAuthor && !matchLink) return false;
      }

      return true;
    });
  }, [scanResult?.clips, originFilter, seasonFilter, onlyNewFilter, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    const next = new Set(selectedIds);
    filteredClips.forEach((c) => next.add(c.id));
    setSelectedIds(next);
  };

  const selectAllNew = () => {
    const next = new Set<string>();
    (scanResult?.clips || []).forEach((c) => {
      if (!c.alreadyExists) next.add(c.id);
    });
    setSelectedIds(next);
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const onConfirmDownload = async () => {
    setShowConfirmDownload(false);
    if (!scanResult?.clips) return;

    const clipsToDownload = scanResult.clips.filter((c) => selectedIds.has(c.id));
    await handleStartDownload(clipsToDownload, concurrency);
  };

  return (
    <div className="space-y-6">
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDownload}
        title="Download & Ingest Selected Clips"
        message={`Are you sure you want to download and ingest ${selectedIds.size} selected clips? Downloading ${concurrency} clips simultaneously with ffmpeg compression, assigned their message timestamps, and organized into respective seasonal folders.`}
        confirmText={`Download ${selectedIds.size} Clips`}
        confirmVariant="primary"
        onConfirm={onConfirmDownload}
        onCancel={() => setShowConfirmDownload(false)}
      />

      {/* Main Scraper Control Card */}
      <ScraperChannelScanner
        channelId={channelId}
        setChannelId={setChannelId}
        isScanning={isScanning}
        scanProgress={scanProgress}
        configuredChannels={configuredChannels}
        onStartScan={handleStartScan}
        onCancelScan={handleCancelScan}
      />

      {/* Discovered Clips Results View */}
      {scanResult && scanResult.clips && (
        <ScrapedClipsTable
          scanResult={scanResult}
          filteredClips={filteredClips}
          selectedIds={selectedIds}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          originFilter={originFilter}
          setOriginFilter={setOriginFilter}
          seasonFilter={seasonFilter}
          setSeasonFilter={setSeasonFilter}
          onlyNewFilter={onlyNewFilter}
          setOnlyNewFilter={setOnlyNewFilter}
          onToggleSelect={toggleSelect}
          onSelectAllNew={selectAllNew}
          onSelectAllFiltered={selectAllFiltered}
          onDeselectAll={deselectAll}
          onProceedDownload={() => setShowConfirmDownload(true)}
          isStartingDownload={isStartingDownload}
          concurrency={concurrency}
          setConcurrency={setConcurrency}
        />
      )}

      {/* Floating Bottom-Right Ingestion Tasks Widget */}
      <ScraperIngestionWidget
        visibleJobs={visibleJobs}
        currentJob={currentJob}
        selectedJobId={selectedJobId}
        setSelectedJobId={setSelectedJobId}
        isWidgetExpanded={isWidgetExpanded}
        setIsWidgetExpanded={setIsWidgetExpanded}
        onRefreshJobs={() => fetchAllJobs()}
        onStopDownload={handleStopDownload}
        onDismissJob={handleDismissJob}
        onDismissAll={handleDismissAll}
      />
    </div>
  );
};

export default DiscordScraper;
