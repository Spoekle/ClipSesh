'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaDiscord,
  FaSearch,
  FaDownload,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaCheckCircle,
  FaStop,
  FaExternalLinkAlt,
  FaYoutube,
  FaTwitch,
  FaVideo,
  FaFolder,
  FaCalendarAlt,
  FaUser,
  FaFilter,
  FaList,
  FaChevronDown,
  FaChevronUp,
  FaSyncAlt,
} from 'react-icons/fa';
import {
  startChannelScan,
  getChannelScanStatus,
  stopChannelScan,
  startScraperDownload,
  getAllScraperDownloads,
  stopScraperDownload,
  ScrapedClipItem,
  ChannelScanStatusResponse,
  ScraperDownloadStatusResponse,
} from '../../../services/adminService';
import { useNotification } from '../../../context/AlertContext';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';

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

  // Confirmation dialog
  const [showConfirmDownload, setShowConfirmDownload] = useState<boolean>(false);

  // Download tasks state (supports multiple concurrent/history tasks)
  const [downloadJobs, setDownloadJobs] = useState<ScraperDownloadStatusResponse[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isStartingDownload, setIsStartingDownload] = useState<boolean>(false);
  const [isWidgetExpanded, setIsWidgetExpanded] = useState<boolean>(false);
  const [dismissedJobIds, setDismissedJobIds] = useState<Set<string>>(new Set());

  const prevJobStatusRef = useRef<Record<string, string>>({});
  const logsContainerRef = useRef<HTMLDivElement | null>(null);

  // Update channelId when initialChannelId prop changes
  useEffect(() => {
    if (initialChannelId) {
      setChannelId(initialChannelId);
    }
  }, [initialChannelId]);

  // Fetch all download jobs from backend (called on mount and after triggering jobs)
  const fetchAllJobs = async (selectNewest = false) => {
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
            if (curr && res.jobs.some((j) => j.jobId === curr)) return curr;
            const downloading = res.jobs.find((j) => j.status === 'downloading');
            return downloading ? downloading.jobId : res.jobs[0]?.jobId || null;
          });
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch existing download jobs:', err);
    }
  };

  useEffect(() => {
    fetchAllJobs();
  }, []);

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
          // Default selection: select all new clips
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
      } catch (err: any) {
        setIsScanning(false);
        showError(err?.message || 'Error checking scan status');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [scanJobId, isScanning, showSuccess, showError]);

  // Check if any job is downloading
  const hasActiveDownloads = useMemo(() => {
    return downloadJobs.some((job) => job.status === 'downloading');
  }, [downloadJobs]);

  // Poll download progress when any job is actively downloading
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
                showError(job.error || 'Download job encountered an error.');
              }
            }
            prevJobStatusRef.current[job.jobId] = job.status;
          });
        }
      } catch (err: any) {
        console.error('Error polling download tasks:', err);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [hasActiveDownloads, showSuccess, showWarning, showError]);

  // Start scanning
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
    } catch (err: any) {
      setIsScanning(false);
      showError(err?.message || 'Failed to start channel scan');
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
    } catch (err: any) {
      showError(err?.message || 'Failed to cancel scan');
      setIsScanning(false);
    }
  };

  // Filtered clips
  const filteredClips = useMemo(() => {
    if (!scanResult?.clips) return [];

    return scanResult.clips.filter((clip) => {
      // Origin filter
      if (originFilter !== 'all' && clip.origin !== originFilter) return false;

      // Season filter
      if (seasonFilter !== 'all') {
        const seasonKey = `${clip.season} ${clip.year}`;
        if (seasonKey !== seasonFilter) return false;
      }

      // Only new filter
      if (onlyNewFilter && clip.alreadyExists) return false;

      // Search query
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

  // Selection handlers
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

  // Filter out manually dismissed jobs (unless actively downloading)
  const visibleJobs = useMemo(() => {
    return downloadJobs.filter((j) => !dismissedJobIds.has(j.jobId) || j.status === 'downloading');
  }, [downloadJobs, dismissedJobIds]);

  const currentJob = useMemo(() => {
    if (visibleJobs.length === 0) return null;
    const found = visibleJobs.find((j) => j.jobId === selectedJobId);
    return found || visibleJobs[0];
  }, [visibleJobs, selectedJobId]);

  // Auto-scroll the internal logs box to bottom
  useEffect(() => {
    if (isWidgetExpanded && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [currentJob?.logs, isWidgetExpanded]);

  // Start download handler
  const handleConfirmDownload = async () => {
    setShowConfirmDownload(false);
    if (!scanResult?.clips) return;

    const clipsToDownload = scanResult.clips.filter((c) => selectedIds.has(c.id));
    if (clipsToDownload.length === 0) {
      showError('No clips selected for download');
      return;
    }

    setIsStartingDownload(true);

    try {
      const res = await startScraperDownload(clipsToDownload);
      showSuccess(`Download started for ${clipsToDownload.length} clips...`);
      await fetchAllJobs(true);
      setSelectedJobId(res.jobId);
    } catch (err: any) {
      showError(err?.message || 'Failed to start download');
    } finally {
      setIsStartingDownload(false);
    }
  };

  const handleStopDownload = async (jobIdToStop?: string) => {
    const id = jobIdToStop || currentJob?.jobId;
    if (!id) return;
    try {
      await stopScraperDownload(id);
      showWarning('Stopping download job...');
      await fetchAllJobs();
    } catch (err: any) {
      showError(err?.message || 'Failed to stop download');
    }
  };

  const handleDismissJob = (jobId: string) => {
    setDismissedJobIds((prev) => {
      const next = new Set(prev);
      next.add(jobId);
      return next;
    });
  };

  const handleDismissAll = () => {
    const finishedIds = downloadJobs
      .filter((j) => j.status !== 'downloading')
      .map((j) => j.jobId);
    setDismissedJobIds((prev) => {
      const next = new Set(prev);
      finishedIds.forEach((id) => next.add(id));
      return next;
    });
    setIsWidgetExpanded(false);
  };

  // Helper for origin icon & color
  const getOriginBadge = (origin: string) => {
    switch (origin) {
      case 'youtube':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-red-500/15 text-red-400 border border-red-500/25 text-[11px] font-semibold">
            <FaYoutube size={11} />
            <span>YouTube</span>
          </span>
        );
      case 'twitch':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-purple-500/15 text-purple-400 border border-purple-500/25 text-[11px] font-semibold">
            <FaTwitch size={11} />
            <span>Twitch</span>
          </span>
        );
      case 'medal':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-amber-500/15 text-amber-400 border border-amber-500/25 text-[11px] font-semibold">
            <span className="font-bold">M</span>
            <span>Medal</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-sky-500/15 text-sky-400 border border-sky-500/25 text-[11px] font-semibold">
            <FaVideo size={10} />
            <span>Direct</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDownload}
        title="Download & Ingest Selected Clips"
        message={`Are you sure you want to download and ingest ${selectedIds.size} selected clips? Each clip will be compressed with ffmpeg, assigned its message timestamp as dateCreated, and organized into its respective seasonal backend folder.`}
        confirmText={`Download ${selectedIds.size} Clips`}
        confirmVariant="primary"
        onConfirm={handleConfirmDownload}
        onCancel={() => setShowConfirmDownload(false)}
      />

      {/* Main Scraper Control Card */}
      <div className="bg-[#181818] p-5 sm:p-6 rounded-xl border border-[#262626] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#262626]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#5865F2]/15 text-[#5865F2] border border-[#5865F2]/25 flex items-center justify-center shrink-0">
              <FaDiscord size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Discord Channel Scraper & Ingestion</span>
              </h2>
              <p className="text-xs text-[#aaaaaa] mt-0.5">
                Scrape historical clip links from Discord channels, preview by season/timestamp, and import into seasonal storage
              </p>
            </div>
          </div>
        </div>

        {/* Channel Input Section */}
        <div className="mt-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                placeholder="Enter 18-19 digit Discord Channel ID (e.g. 1265825227284414545)"
                disabled={isScanning}
                className="w-full bg-[#121212] border border-[#2e2e2e] focus:border-[#f23030] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#666] font-mono transition-colors outline-none"
              />
            </div>

            {isScanning ? (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled
                  className="px-4 py-2.5 bg-[#f23030]/80 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm shrink-0"
                >
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Scanning Channel...</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelScan}
                  className="px-3.5 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  title="Cancel channel scan"
                >
                  <FaStop size={10} />
                  <span>Cancel Scan</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStartScan}
                disabled={!channelId.trim()}
                className="px-5 py-2.5 bg-[#f23030] hover:bg-[#d92222] disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm shrink-0"
              >
                <FaSearch size={12} />
                <span>Scan Channel Clips</span>
              </button>
            )}
          </div>

          {/* Quick select from configured ingest channels */}
          {configuredChannels.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-[11px] text-[#717171] font-medium">Configured Ingest Channels:</span>
              {configuredChannels.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setChannelId(id)}
                  disabled={isScanning}
                  className={`text-[11px] font-mono px-2.5 py-0.5 rounded-sm border transition-colors cursor-pointer ${
                    channelId.trim() === id
                      ? 'bg-[#5865F2]/20 text-[#5865F2] border-[#5865F2]/40 font-semibold'
                      : 'bg-[#141414] text-[#aaa] border-[#2a2a2a] hover:text-white hover:border-[#444]'
                  }`}
                >
                  {id}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scanning Live Progress */}
        {isScanning && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 p-4 rounded-xl bg-[#141414] border border-[#2a2a2a] flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#f23030]/15 text-[#f23030] flex items-center justify-center shrink-0">
                <div className="w-4 h-4 border-2 border-[#f23030]/30 border-t-[#f23030] rounded-full animate-spin" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white block">
                  Scraping Discord Channel Message History...
                </span>
                <span className="text-[11px] text-[#888] font-mono">
                  Scanned {scanProgress.scannedMessages.toLocaleString()} messages • Discovered{' '}
                  <strong className="text-white">{scanProgress.foundClipsCount}</strong> valid clips
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="hidden sm:inline text-[11px] px-2 py-0.5 rounded-full bg-[#222] text-[#888] border border-[#333]">
                Respecting Discord Rate Limits
              </span>
              <button
                type="button"
                onClick={handleCancelScan}
                className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FaStop size={10} />
                <span>Cancel Scan</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>



      {/* Discovered Clips Results View */}
      {scanResult && scanResult.clips && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#181818] p-3.5 rounded-xl border border-[#262626]">
              <span className="text-[11px] text-[#717171] block">Total Discovered</span>
              <span className="text-base font-bold text-white font-mono">
                {scanResult.stats?.totalClips || scanResult.clips.length}
              </span>
            </div>

            <div className="bg-[#181818] p-3.5 rounded-xl border border-[#262626]">
              <span className="text-[11px] text-[#717171] block">New (Ready to Ingest)</span>
              <span className="text-base font-bold text-emerald-400 font-mono">
                {scanResult.stats?.newClips || 0}
              </span>
            </div>

            <div className="bg-[#181818] p-3.5 rounded-xl border border-[#262626]">
              <span className="text-[11px] text-[#717171] block">Already in Database</span>
              <span className="text-base font-bold text-[#888] font-mono">
                {scanResult.stats?.existingClips || 0}
              </span>
            </div>

            <div className="bg-[#181818] p-3.5 rounded-xl border border-[#262626]">
              <span className="text-[11px] text-[#717171] block">Selected to Ingest</span>
              <span className="text-base font-bold text-[#f23030] font-mono">
                {selectedIds.size}
              </span>
            </div>
          </div>

          {/* Filter & Action Toolbar */}
          <div className="bg-[#181818] p-4 rounded-xl border border-[#262626] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by title, author, url..."
                  className="bg-[#121212] border border-[#2e2e2e] focus:border-[#444] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#666] outline-none w-48 sm:w-60"
                />
              </div>

              {/* Origin Dropdown */}
              <select
                value={originFilter}
                onChange={(e) => setOriginFilter(e.target.value)}
                className="bg-[#121212] border border-[#2e2e2e] text-xs text-white rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
              >
                <option value="all">All Origins</option>
                <option value="twitch">Twitch ({scanResult.stats?.origins.twitch || 0})</option>
                <option value="youtube">YouTube ({scanResult.stats?.origins.youtube || 0})</option>
                <option value="medal">Medal.tv ({scanResult.stats?.origins.medal || 0})</option>
                <option value="direct_video">Direct Videos ({scanResult.stats?.origins.direct_video || 0})</option>
              </select>

              {/* Season Dropdown */}
              {scanResult.stats?.seasons && Object.keys(scanResult.stats.seasons).length > 0 && (
                <select
                  value={seasonFilter}
                  onChange={(e) => setSeasonFilter(e.target.value)}
                  className="bg-[#121212] border border-[#2e2e2e] text-xs text-white rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
                >
                  <option value="all">All Seasons</option>
                  {Object.entries(scanResult.stats.seasons).map(([sKey, count]) => (
                    <option key={sKey} value={sKey}>
                      {sKey} ({count})
                    </option>
                  ))}
                </select>
              )}

              {/* Toggle Only New */}
              <button
                type="button"
                onClick={() => setOnlyNewFilter(!onlyNewFilter)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  onlyNewFilter
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold'
                    : 'bg-[#141414] text-[#aaa] border-[#2a2a2a] hover:text-white'
                }`}
              >
                <FaFilter size={10} />
                <span>Only New</span>
              </button>
            </div>

            {/* Bulk Selection and Ingest Button */}
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <button
                type="button"
                onClick={selectAllNew}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-[#141414] hover:bg-[#222] border border-[#2a2a2a] text-[#aaa] hover:text-white transition-colors cursor-pointer"
              >
                Select New
              </button>
              <button
                type="button"
                onClick={selectAllFiltered}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-[#141414] hover:bg-[#222] border border-[#2a2a2a] text-[#aaa] hover:text-white transition-colors cursor-pointer"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={deselectAll}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-[#141414] hover:bg-[#222] border border-[#2a2a2a] text-[#aaa] hover:text-white transition-colors cursor-pointer"
              >
                Deselect All
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmDownload(true)}
                disabled={selectedIds.size === 0 || isStartingDownload}
                className="px-4 py-1.5 bg-[#f23030] hover:bg-[#d92222] disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-sm ml-1"
              >
                <FaDownload size={11} />
                <span>Proceed Downloading ({selectedIds.size})</span>
              </button>
            </div>
          </div>

          {/* Clips List / Table */}
          <div className="bg-[#181818] rounded-xl border border-[#262626] overflow-hidden shadow-sm">
            <div className="p-3 border-b border-[#262626] bg-[#141414] flex items-center justify-between text-xs text-[#717171] font-semibold">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={
                    filteredClips.length > 0 &&
                    filteredClips.every((c) => selectedIds.has(c.id))
                  }
                  onChange={(e) => {
                    if (e.target.checked) selectAllFiltered();
                    else deselectAll();
                  }}
                  className="rounded-xs cursor-pointer accent-[#f23030]"
                />
                <span>CLIP / TITLE</span>
              </div>
              <div className="hidden md:flex items-center gap-12 mr-2">
                <span>SUBMITTER</span>
                <span>TIMESTAMP & SEASON</span>
                <span>DESTINATION</span>
                <span>STATUS</span>
              </div>
            </div>

            {filteredClips.length === 0 ? (
              <div className="text-center py-12 text-xs text-[#717171]">
                No clips match the selected filters.
              </div>
            ) : (
              <div className="divide-y divide-[#222] max-h-[550px] overflow-y-auto">
                {filteredClips.map((clip) => {
                  const isSelected = selectedIds.has(clip.id);
                  const clipDate = new Date(clip.timestamp);

                  return (
                    <div
                      key={clip.id}
                      onClick={() => toggleSelect(clip.id)}
                      className={`p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[#1f1f1f] transition-colors cursor-pointer select-none ${
                        isSelected ? 'bg-[#221616]/40' : ''
                      }`}
                    >
                      {/* Left: Checkbox, Origin Badge, Title, Link */}
                      <div className="flex items-start gap-3 min-w-0 md:max-w-md lg:max-w-lg">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 rounded-xs cursor-pointer accent-[#f23030] shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {getOriginBadge(clip.origin)}
                            <a
                              href={clip.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs font-semibold text-white hover:text-[#f23030] transition-colors truncate max-w-sm inline-flex items-center gap-1.5"
                              title={clip.link}
                            >
                              <span>{clip.title}</span>
                              <FaExternalLinkAlt size={9} className="shrink-0 text-[#666]" />
                            </a>
                          </div>
                          <span className="text-[11px] text-[#666] font-mono block truncate max-w-xs sm:max-w-md">
                            {clip.link}
                          </span>
                        </div>
                      </div>

                      {/* Right metadata columns */}
                      <div className="flex flex-wrap md:flex-nowrap items-center gap-4 text-xs shrink-0">
                        {/* Author */}
                        <div className="w-28 truncate text-[#aaa] flex items-center gap-1.5">
                          <FaUser size={10} className="text-[#666] shrink-0" />
                          <span className="truncate">{clip.author}</span>
                        </div>

                        {/* Timestamp & Season */}
                        <div className="w-40">
                          <span className="text-white font-medium block text-[11px]">
                            {clip.season} {clip.year}
                          </span>
                          <span className="text-[#717171] text-[10px] block font-mono">
                            {clipDate.toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            {clipDate.toLocaleTimeString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {/* Destination */}
                        <div className="w-44 hidden lg:block">
                          <span className="text-[#717171] text-[10px] font-mono truncate block flex items-center gap-1">
                            <FaFolder size={9} className="text-[#555] shrink-0" />
                            <span className="truncate">{clip.destinationFolder}</span>
                          </span>
                        </div>

                        {/* Status badge */}
                        <div className="w-24 text-right">
                          {clip.alreadyExists ? (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-sm bg-[#222] text-[#888] border border-[#333]">
                              In Database
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                              New Clip
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
      {/* Floating Bottom-Right Ingestion Tasks Widget */}
      {visibleJobs.length > 0 && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
          <AnimatePresence mode="wait">
            {!isWidgetExpanded ? (
              /* Compact Overview Pill / Card */
              <motion.div
                key="compact-widget"
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsWidgetExpanded(true)}
                className="w-80 sm:w-96 bg-[#181818]/95 backdrop-blur-md border border-[#333] hover:border-[#555] rounded-2xl p-3.5 shadow-2xl shadow-black/70 cursor-pointer transition-all duration-200 group select-none"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Status Dot */}
                    {currentJob?.status === 'downloading' ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                    ) : currentJob?.status === 'completed' ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
                    )}
                    <span className="text-xs font-bold text-white tracking-wide truncate">
                      Clip Ingestion
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#222] text-[#aaa] border border-[#333] shrink-0">
                      {visibleJobs.filter((j) => j.status === 'downloading').length > 0
                        ? `${visibleJobs.filter((j) => j.status === 'downloading').length} running`
                        : `${visibleJobs.length} tasks`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 text-[#888] group-hover:text-white transition-colors">
                    <span className="text-[11px] font-medium hidden sm:inline">Details</span>
                    <FaChevronUp size={11} />
                  </div>
                </div>

                {/* Selected Job Info & Progress */}
                {currentJob && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#888] truncate max-w-[170px]">
                        Job #{currentJob.jobId.slice(-6)}
                      </span>
                      <span className="text-white font-semibold">
                        {currentJob.processed} / {currentJob.total} ({currentJob.total > 0 ? Math.round((currentJob.processed / currentJob.total) * 100) : 0}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#121212] h-1.5 rounded-full overflow-hidden border border-[#2a2a2a]">
                      <div
                        className="h-full bg-gradient-to-r from-[#f23030] to-emerald-500 rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            currentJob.total > 0
                              ? (currentJob.processed / currentJob.total) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>

                    {/* Current Clip (if downloading) or Stats */}
                    {currentJob.status === 'downloading' ? (
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <p className="text-[11px] text-[#aaa] font-mono truncate flex-1">
                          Current: <span className="text-white">{currentJob.currentClip || 'Ingesting...'}</span>
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStopDownload(currentJob.jobId);
                          }}
                          className="px-2 py-0.5 text-[10px] font-semibold text-rose-400 hover:text-white bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 rounded-md transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                          title="Cancel ingestion"
                        >
                          <FaStop size={8} />
                          <span>Cancel</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[10px] text-[#717171] font-mono pt-0.5">
                        <span className="text-emerald-400">✓ {currentJob.successCount} saved</span>
                        <span className="text-amber-400">↷ {currentJob.skippedCount} skipped</span>
                        <span className="text-rose-400">✕ {currentJob.errorCount} failed</span>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : (
              /* Expanded Detailed Window */
              <motion.div
                key="expanded-widget"
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-88 sm:w-[440px] max-h-[85vh] bg-[#181818] border border-[#333] rounded-2xl shadow-2xl shadow-black/90 flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="p-3.5 sm:p-4 border-b border-[#262626] bg-[#141414] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#f23030]/15 text-[#f23030] flex items-center justify-center shrink-0">
                      <FaDownload size={13} />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                        Ingestion Tasks
                      </h3>
                      <p className="text-[10px] text-[#888] font-mono">
                        {visibleJobs.filter((j) => j.status === 'downloading').length} active • {visibleJobs.length} total
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => fetchAllJobs()}
                      title="Refresh tasks"
                      className="p-1.5 text-[#888] hover:text-white hover:bg-[#262626] rounded-lg transition-colors cursor-pointer"
                    >
                      <FaSyncAlt size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsWidgetExpanded(false)}
                      title="Collapse to corner"
                      className="p-1.5 text-[#888] hover:text-white hover:bg-[#262626] rounded-lg transition-colors cursor-pointer"
                    >
                      <FaChevronDown size={12} />
                    </button>
                    {visibleJobs.every((j) => j.status !== 'downloading') && (
                      <button
                        type="button"
                        onClick={handleDismissAll}
                        title="Dismiss all finished"
                        className="p-1.5 text-[#888] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <FaTimes size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Multi-task Selector Tabs (if >1 job) */}
                {visibleJobs.length > 1 && (
                  <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#262626] bg-[#121212] overflow-x-auto no-scrollbar">
                    {visibleJobs.map((job) => (
                      <button
                        key={job.jobId}
                        type="button"
                        onClick={() => setSelectedJobId(job.jobId)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                          job.jobId === currentJob?.jobId
                            ? 'bg-[#262626] text-white border border-[#444] font-semibold'
                            : 'bg-[#181818] text-[#888] hover:text-white border border-[#262626]'
                        }`}
                      >
                        {job.status === 'downloading' ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                        ) : job.status === 'completed' ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
                        )}
                        <span>#{job.jobId.slice(-5)}</span>
                        <span className="text-[10px] text-[#666]">
                          ({job.processed}/{job.total})
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Job Body */}
                {currentJob ? (
                  <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3.5 flex-1 max-h-[60vh]">
                    {/* Status & Actions Row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {currentJob.status === 'downloading' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wider animate-pulse">
                            Downloading & Compressing
                          </span>
                        )}
                        {currentJob.status === 'completed' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                            Completed
                          </span>
                        )}
                        {currentJob.status === 'stopped' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
                            Stopped
                          </span>
                        )}
                        {currentJob.status === 'error' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
                            Error
                          </span>
                        )}
                        <span className="text-[11px] text-[#717171] font-mono">
                          #{currentJob.jobId.slice(-8)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {currentJob.status === 'downloading' ? (
                          <button
                            type="button"
                            onClick={() => handleStopDownload(currentJob.jobId)}
                            className="px-2.5 py-1 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                            title="Cancel download and ingestion"
                          >
                            <FaStop size={10} />
                            <span>Cancel Download</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDismissJob(currentJob.jobId)}
                            className="px-2 py-0.5 text-[11px] font-medium text-[#717171] hover:text-white bg-[#202020] hover:bg-[#282828] border border-[#333] rounded-lg transition-colors cursor-pointer"
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Current Clip Name */}
                    {currentJob.status === 'downloading' && currentJob.currentClip && (
                      <div className="p-2 rounded-lg bg-[#121212] border border-[#262626]">
                        <span className="text-[10px] text-[#717171] uppercase tracking-wider block font-semibold">
                          Current Clip:
                        </span>
                        <p className="text-xs text-white font-mono truncate mt-0.5">
                          {currentJob.currentClip}
                        </p>
                      </div>
                    )}

                    {/* Progress Bar & Percent */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-[#aaa] mb-1 font-mono">
                        <span>
                          Processed {currentJob.processed} of {currentJob.total}
                        </span>
                        <span className="text-white font-semibold">
                          {currentJob.total > 0
                            ? Math.round((currentJob.processed / currentJob.total) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-[#121212] h-2 rounded-full overflow-hidden border border-[#2a2a2a]">
                        <div
                          className="h-full bg-gradient-to-r from-[#f23030] to-emerald-500 rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              currentJob.total > 0
                                ? (currentJob.processed / currentJob.total) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Stats Tiles */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 rounded-lg bg-[#141414] border border-[#262626]">
                        <span className="text-[10px] text-[#717171] uppercase tracking-wider block">Ingested</span>
                        <span className="text-sm font-bold text-emerald-400 font-mono">
                          {currentJob.successCount}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#141414] border border-[#262626]">
                        <span className="text-[10px] text-[#717171] uppercase tracking-wider block">Skipped</span>
                        <span className="text-sm font-bold text-amber-400 font-mono">
                          {currentJob.skippedCount}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#141414] border border-[#262626]">
                        <span className="text-[10px] text-[#717171] uppercase tracking-wider block">Errors</span>
                        <span className="text-sm font-bold text-rose-400 font-mono">
                          {currentJob.errorCount}
                        </span>
                      </div>
                    </div>

                    {/* Live Terminal Log Stream */}
                    {currentJob.logs && currentJob.logs.length > 0 && (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#717171] tracking-wider mb-1 block">
                          Terminal Logs:
                        </span>
                        <div
                          ref={logsContainerRef}
                          className="bg-[#0e0e0e] border border-[#262626] rounded-xl p-2.5 max-h-36 overflow-y-auto font-mono text-[11px] space-y-1"
                        >
                          {currentJob.logs.map((log, idx) => (
                            <div
                              key={idx}
                              className={`flex items-start gap-1.5 ${
                                log.level === 'success'
                                  ? 'text-emerald-400'
                                  : log.level === 'warn'
                                  ? 'text-amber-400'
                                  : log.level === 'error'
                                  ? 'text-rose-400'
                                  : 'text-[#aaa]'
                              }`}
                            >
                              <span className="text-[#555] shrink-0">
                                [{new Date(log.time).toLocaleTimeString()}]
                              </span>
                              <span className="break-all">{log.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-[#717171]">
                    No active tasks selected
                  </div>
                )}

                {/* Footer */}
                <div className="p-2.5 border-t border-[#262626] bg-[#141414]">
                  <button
                    type="button"
                    onClick={() => setIsWidgetExpanded(false)}
                    className="w-full py-1.5 bg-[#202020] hover:bg-[#282828] text-[#aaa] hover:text-white text-xs font-medium rounded-xl border border-[#333] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <FaChevronDown size={10} />
                    <span>Collapse to Corner</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default DiscordScraper;
