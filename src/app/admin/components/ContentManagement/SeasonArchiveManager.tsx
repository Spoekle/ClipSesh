'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaArchive,
  FaFileDownload,
  FaUpload,
  FaTrash,
  FaSpinner,
  FaHistory,
  FaCalendarAlt,
  FaBoxOpen,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaRedo,
  FaFilm,
  FaHdd,
  FaSyncAlt,
  FaChevronDown,
} from 'react-icons/fa';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import UnarchiveSeasonModal from '../UnarchiveSeasonModal';
import { useSeasonStatus, useUnarchiveSeason, useSeasonAction } from '@/hooks/useAdmin';
import { useNotification } from '@/context/AlertContext';
import { formatFileSize, formatDate } from '@/utils/fileHelpers';
import { uploadFileInChunks } from '@/utils/zipHelpers';
import { downloadWithProgress } from '@/utils/downloadHelpers';
import { safeLocalStorage } from '@/utils/storage';
import { Zip, SeasonInfo } from '@/types/adminTypes';

interface SeasonArchiveManagerProps {
  openProcessModal: () => void;
  downloading: boolean;
  loading?: boolean;
  zips: Zip[];
  zipsLoading: boolean;
  deleteZip: (id: string) => Promise<void>;
  seasonInfo: SeasonInfo;
  activeClipsCount?: number;
}

export const SeasonArchiveManager: React.FC<SeasonArchiveManagerProps> = ({
  openProcessModal,
  downloading,
  loading = false,
  zips,
  zipsLoading,
  deleteZip,
  seasonInfo,
  activeClipsCount,
}) => {
  const { data: seasonStatusData, isLoading: seasonStatusLoading, refetch: refetchSeasonStatus } = useSeasonStatus();
  const unarchiveMutation = useUnarchiveSeason();
  const seasonActionMutation = useSeasonAction();
  const { showSuccess, showError } = useNotification();

  // Internal view: 'seasons' or 'packages'
  const [activeView, setActiveView] = useState<'seasons' | 'packages'>('seasons');

  // Dialog & Modal states
  const [showProcessConfirm, setShowProcessConfirm] = useState(false);
  const [selectedSeasonForUnarchive, setSelectedSeasonForUnarchive] = useState<{
    season: string;
    year: number;
    archivedClips?: number;
    zipName?: string | null;
  } | null>(null);

  // Delete zip dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [zipToDelete, setZipToDelete] = useState<string | null>(null);
  const [selectedZipName, setSelectedZipName] = useState<string>('');

  // Download states: zipId -> { isDownloading, progress }
  const [downloadStates, setDownloadStates] = useState<{
    [key: string]: { isDownloading: boolean; progress: number };
  }>({});

  // Manual Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadClipAmount, setUploadClipAmount] = useState<number>(0);
  const [uploadYear, setUploadYear] = useState<number>(seasonInfo.year || new Date().getFullYear());
  const [uploadSeason, setUploadSeason] = useState<string>(seasonInfo.season || 'Spring');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [retryAttempt, setRetryAttempt] = useState(0);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalZipSize = zips.reduce((acc, z) => acc + (z.size || 0), 0);
    const totalClips = activeClipsCount !== undefined
      ? activeClipsCount
      : (seasonStatusData?.seasons?.find((s: any) => s.isCurrent)?.activeClips ?? 0);

    return {
      currentSeasonLabel: `${seasonInfo.season || 'Active'} ${seasonInfo.year || new Date().getFullYear()}`,
      activeClips: totalClips,
      packagesCount: zips.length,
      totalStorage: formatFileSize(totalZipSize),
    };
  }, [zips, activeClipsCount, seasonStatusData, seasonInfo]);

  // Handle Unarchive confirmation
  const handleConfirmUnarchive = async (deleteZipOnDisk: boolean) => {
    if (!selectedSeasonForUnarchive) return;
    try {
      const result = await unarchiveMutation.mutateAsync({
        season: selectedSeasonForUnarchive.season,
        year: selectedSeasonForUnarchive.year,
        deleteZip: deleteZipOnDisk,
      });
      showSuccess(
        result.message ||
          `Successfully unarchived ${selectedSeasonForUnarchive.season} ${selectedSeasonForUnarchive.year}!`
      );
      setSelectedSeasonForUnarchive(null);
      refetchSeasonStatus();
    } catch (err: any) {
      showError(err?.message || 'Failed to unarchive season');
    }
  };

  // Handle Delete ZIP confirmation
  const handleDeleteClick = (zipId: string, zipName: string) => {
    setZipToDelete(zipId);
    setSelectedZipName(zipName);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteZip = async () => {
    if (!zipToDelete) return;
    try {
      await deleteZip(zipToDelete);
      setShowDeleteConfirm(false);
      setZipToDelete(null);
      setSelectedZipName('');
      refetchSeasonStatus();
    } catch (err: any) {
      console.error('Error deleting zip:', err);
    }
  };

  // Handle Download with live progress
  const handleDownload = async (zipId: string, url: string, filename: string) => {
    try {
      setDownloadStates((prev) => ({
        ...prev,
        [zipId]: { isDownloading: true, progress: 0 },
      }));

      await downloadWithProgress({
        url,
        filename,
        onProgress: (progressValue) => {
          setDownloadStates((prev) => ({
            ...prev,
            [zipId]: { isDownloading: true, progress: progressValue },
          }));
        },
        onComplete: () => {
          setDownloadStates((prev) => ({
            ...prev,
            [zipId]: { isDownloading: false, progress: 100 },
          }));
          setTimeout(() => {
            setDownloadStates((prev) => {
              const next = { ...prev };
              delete next[zipId];
              return next;
            });
          }, 2000);
        },
        onError: (err) => {
          console.error('Download failed:', err);
          setDownloadStates((prev) => ({
            ...prev,
            [zipId]: { isDownloading: false, progress: 0 },
          }));
          setTimeout(() => {
            setDownloadStates((prev) => {
              const next = { ...prev };
              delete next[zipId];
              return next;
            });
          }, 2000);
        },
      });
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  // Handle Manual Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || isUploading) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError('');
    setCurrentChunk(0);
    setTotalChunks(0);

    try {
      const token = safeLocalStorage.getItem('token') || '';
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';

      const success = await uploadFileInChunks({
        file: uploadFile,
        apiUrl: backendUrl,
        token,
        clipAmount: uploadClipAmount,
        season: uploadSeason,
        year: uploadYear,
        onProgressUpdate: (progress) => {
          setCurrentChunk(progress.currentChunk);
          setTotalChunks(progress.totalChunks);
          setUploadProgress(progress.uploadProgress);
        },
        onError: (error) => {
          setUploadError(`${error.message} (Attempt: ${retryAttempt + 1})`);
          setRetryAttempt((prev) => prev + 1);
        },
      });

      if (success) {
        showSuccess('Manual archive uploaded and registered successfully!');
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadClipAmount(0);
        setUploadError('');
        setRetryAttempt(0);
        refetchSeasonStatus();
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      setUploadError(error?.message || 'Failed to upload archive');
      setRetryAttempt((prev) => prev + 1);
    } finally {
      setIsUploading(false);
    }
  };

  // Match a season with its compiled ZIP if available
  const getZipForSeason = (seasonName: string, seasonYear: number) => {
    return zips.find(
      (z) =>
        z.season?.toLowerCase() === seasonName?.toLowerCase() &&
        Number(z.year) === Number(seasonYear)
    );
  };

  return (
    <>
      {/* Compile Process Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showProcessConfirm}
        title="Compile Season Distribution ZIP"
        message={`Compile all approved submissions for ${seasonInfo.season} ${seasonInfo.year}? This will run background ffmpeg processing, apply community ratings to filenames, and generate an editor-ready archive.`}
        confirmText="Start Compilation"
        confirmVariant="primary"
        onConfirm={() => {
          setShowProcessConfirm(false);
          openProcessModal();
        }}
        onCancel={() => setShowProcessConfirm(false)}
      />

      {/* Delete ZIP Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Distribution Package"
        message={`Are you sure you want to permanently delete "${selectedZipName}"? This action cannot be undone.`}
        confirmText="Delete Package"
        confirmVariant="danger"
        onConfirm={confirmDeleteZip}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setZipToDelete(null);
          setSelectedZipName('');
        }}
      />

      {/* Unarchive Season Modal */}
      {selectedSeasonForUnarchive && (
        <UnarchiveSeasonModal
          isOpen={Boolean(selectedSeasonForUnarchive)}
          onClose={() => setSelectedSeasonForUnarchive(null)}
          onConfirm={handleConfirmUnarchive}
          season={selectedSeasonForUnarchive.season}
          year={selectedSeasonForUnarchive.year}
          archivedClipsCount={selectedSeasonForUnarchive.archivedClips}
          zipName={selectedSeasonForUnarchive.zipName}
          loading={unarchiveMutation.isPending}
        />
      )}

      {/* Manual Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-lg bg-[#181818] border border-[#2e2e2e] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#262626] bg-[#141414]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <FaUpload size={14} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Manual Archive Ingestion</h3>
                    <p className="text-xs text-[#aaaaaa]">Upload raw submissions packaged into a single ZIP</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                  className="text-[#717171] hover:text-white p-2 rounded-lg hover:bg-[#222] transition-colors cursor-pointer disabled:opacity-50"
                >
                  <FaTimes size={13} />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="p-6 space-y-4 text-xs">
                {/* File picker */}
                <div className="bg-[#141414] p-3 rounded-xl border border-[#262626]">
                  <label
                    htmlFor="zip-upload-input"
                    className="flex flex-col items-center justify-center w-full h-28 px-4 transition border-2 border-[#262626] border-dashed rounded-xl cursor-pointer hover:bg-[#1a1a1a] hover:border-[#f23030]/50"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <FaUpload className="w-5 h-5 mb-1.5 text-[#aaaaaa]" />
                      <p className="text-xs text-[#f1f1f1]">
                        <span className="font-semibold text-[#f23030]">Click to choose file</span> or drag & drop
                      </p>
                      <p className="text-[11px] text-[#717171] mt-0.5">ZIP package containing clips (up to 3GB)</p>
                    </div>
                    <input
                      type="file"
                      id="zip-upload-input"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setUploadFile(e.target.files[0]);
                        }
                      }}
                      accept=".zip"
                      className="hidden"
                    />
                  </label>

                  {uploadFile && (
                    <div className="mt-3 p-2.5 bg-[#181818] border border-[#262626] rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <FaArchive className="text-[#f23030] text-sm shrink-0" />
                        <span className="text-xs font-medium text-white truncate">{uploadFile.name}</span>
                      </div>
                      <span className="text-[11px] text-[#aaaaaa] pl-2 shrink-0 font-mono">
                        {formatFileSize(uploadFile.size)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-1.5 bg-[#141414] p-3 rounded-xl border border-[#262626]">
                    <div className="h-1.5 w-full bg-[#222222] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#f23030] transition-all duration-300 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#aaaaaa] font-mono">
                      <span>Chunk {currentChunk} of {totalChunks}</span>
                      <span className="font-bold text-white">{uploadProgress}%</span>
                    </div>
                  </div>
                )}

                {/* Upload Error */}
                {uploadError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs space-y-2">
                    <div className="flex items-start gap-2">
                      <FaExclamationTriangle className="mt-0.5 shrink-0" size={13} />
                      <p>{uploadError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleUploadSubmit}
                      className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <FaRedo size={10} /> Retry
                    </button>
                  </div>
                )}

                {/* Metadata Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#aaaaaa] mb-1">
                      Clip Count:
                    </label>
                    <input
                      type="number"
                      value={uploadClipAmount}
                      onChange={(e) => setUploadClipAmount(Math.max(0, parseInt(e.target.value) || 0))}
                      className="bg-[#121212] border border-[#262626] text-white w-full p-2.5 rounded-xl text-xs outline-none focus:border-[#444]"
                      placeholder="e.g. 50"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#aaaaaa] mb-1">
                      Season Year:
                    </label>
                    <input
                      type="number"
                      value={uploadYear}
                      onChange={(e) => setUploadYear(parseInt(e.target.value) || 2026)}
                      className="bg-[#121212] border border-[#262626] text-white w-full p-2.5 rounded-xl text-xs outline-none focus:border-[#444]"
                      min="2020"
                      max="2100"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#aaaaaa] mb-1">
                    Season Cycle:
                  </label>
                  <select
                    value={uploadSeason}
                    onChange={(e) => setUploadSeason(e.target.value)}
                    className="bg-[#121212] border border-[#262626] text-white w-full p-2.5 rounded-xl text-xs outline-none focus:border-[#444] cursor-pointer"
                    required
                  >
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                    <option value="Fall">Fall</option>
                    <option value="Winter">Winter</option>
                  </select>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262626]">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    disabled={isUploading}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-[#aaaaaa] hover:text-white bg-[#1a1a1a] hover:bg-[#222] border border-[#262626] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!uploadFile || isUploading}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#f23030] hover:bg-[#d92222] disabled:opacity-40 text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    {isUploading ? (
                      <>
                        <FaSpinner className="animate-spin" size={11} />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <FaUpload size={11} />
                        <span>Ingest ZIP Archive</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="space-y-6">
        {/* Top Control Bar & KPI Stats Card */}
        <div className="bg-[#181818] p-5 sm:p-6 rounded-2xl border border-[#262626] shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#f23030]/15 text-[#f23030] flex items-center justify-center">
                  <FaArchive size={14} />
                </div>
                <span>Seasons & Distribution Archives</span>
              </h2>
              <p className="text-xs text-[#aaaaaa] mt-1">
                Compile approved submissions into release ZIP packages, manage seasonal lifecycle transitions, and download editor archives.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => refetchSeasonStatus()}
                title="Refresh season data"
                className="p-2 text-[#888] hover:text-white bg-[#141414] hover:bg-[#222] border border-[#262626] rounded-xl transition-colors cursor-pointer"
              >
                <FaSyncAlt size={12} />
              </button>

              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="px-3.5 py-2 rounded-xl bg-[#141414] hover:bg-[#202020] text-[#f1f1f1] border border-[#2e2e2e] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FaUpload size={11} className="text-emerald-400" />
                <span>Upload ZIP</span>
              </button>

              <button
                type="button"
                onClick={() => setShowProcessConfirm(true)}
                disabled={downloading}
                className="px-4 py-2 rounded-xl bg-[#f23030] hover:bg-[#d92222] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                {downloading ? (
                  <>
                    <FaSpinner className="animate-spin" size={12} />
                    <span>Compiling...</span>
                  </>
                ) : (
                  <>
                    <FaFileDownload size={12} />
                    <span>Compile Season ZIP</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Metric KPIs Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-[#141414] border border-[#262626] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#222] border border-[#2e2e2e] flex items-center justify-center text-[#f23030] shrink-0">
                <FaCalendarAlt size={14} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#717171] uppercase font-bold tracking-wider block">
                  Active Season
                </span>
                <span className="text-xs font-bold text-white truncate block">
                  {metrics.currentSeasonLabel}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#141414] border border-[#262626] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#222] border border-[#2e2e2e] flex items-center justify-center text-amber-400 shrink-0">
                <FaFilm size={14} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#717171] uppercase font-bold tracking-wider block">
                  Active Pool
                </span>
                <span className="text-xs font-bold text-white truncate block">
                  {metrics.activeClips} clips ready
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#141414] border border-[#262626] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#222] border border-[#2e2e2e] flex items-center justify-center text-sky-400 shrink-0">
                <FaBoxOpen size={14} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#717171] uppercase font-bold tracking-wider block">
                  ZIP Packages
                </span>
                <span className="text-xs font-bold text-white truncate block">
                  {metrics.packagesCount} compiled
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#141414] border border-[#262626] flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#222] border border-[#2e2e2e] flex items-center justify-center text-emerald-400 shrink-0">
                <FaHdd size={14} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#717171] uppercase font-bold tracking-wider block">
                  Archive Storage
                </span>
                <span className="text-xs font-bold text-white truncate block font-mono">
                  {metrics.totalStorage}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* View Switcher: Seasons Lifecycle vs All Packages */}
        <div className="bg-[#181818] p-5 sm:p-6 rounded-2xl border border-[#262626] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#262626]">
            <div className="flex items-center gap-1.5 p-1 bg-[#141414] border border-[#262626] rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setActiveView('seasons')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeView === 'seasons'
                    ? 'bg-[#222222] text-white border border-[#333]'
                    : 'text-[#888888] hover:text-white'
                }`}
              >
                <FaCalendarAlt size={11} className={activeView === 'seasons' ? 'text-[#f23030]' : ''} />
                <span>Season Lifecycles</span>
                {seasonStatusData?.seasons && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#181818] text-[#aaa] border border-[#2e2e2e]">
                    {seasonStatusData.seasons.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveView('packages')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeView === 'packages'
                    ? 'bg-[#222222] text-white border border-[#333]'
                    : 'text-[#888888] hover:text-white'
                }`}
              >
                <FaArchive size={11} className={activeView === 'packages' ? 'text-sky-400' : ''} />
                <span>Compiled Packages</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#181818] text-[#aaa] border border-[#2e2e2e]">
                  {zips.length}
                </span>
              </button>
            </div>

            <p className="text-xs text-[#717171]">
              {activeView === 'seasons'
                ? 'Manage active review pools and archive transitions per season cycle'
                : 'Directly download or delete compiled ZIP archives for distribution'}
            </p>
          </div>

          {/* VIEW 1: SEASONS LIFECYCLE */}
          {activeView === 'seasons' && (
            <div>
              {seasonStatusLoading ? (
                <div className="p-12 text-center bg-[#141414] rounded-xl border border-[#262626]">
                  <FaSpinner className="animate-spin text-[#f23030] mx-auto mb-2" size={18} />
                  <p className="text-xs text-[#888888]">Loading seasonal collections...</p>
                </div>
              ) : seasonStatusData?.seasons && seasonStatusData.seasons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {seasonStatusData.seasons.map((s: any) => {
                    const seasonKey = `${s.season}-${s.year}`;
                    const linkedZip = getZipForSeason(s.season, s.year) || (s.zip ? { ...s.zip, _id: s.zip._id || s.zip.name } : null);
                    const isZipDownloading = linkedZip?._id ? downloadStates[linkedZip._id]?.isDownloading : false;
                    const zipDownloadProgress = linkedZip?._id ? downloadStates[linkedZip._id]?.progress || 0 : 0;

                    return (
                      <div
                        key={seasonKey}
                        className="p-4 rounded-xl bg-[#141414] border border-[#262626] hover:border-[#383838] transition-all flex flex-col justify-between space-y-4"
                      >
                        {/* Season Header */}
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span className="text-sm font-bold text-white capitalize flex items-center gap-2">
                              <span>{s.season} {s.year}</span>
                            </span>

                            {s.isCurrent ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f23030]/15 text-[#f23030] border border-[#f23030]/30 uppercase tracking-wide flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#f23030] animate-pulse" />
                                Active
                              </span>
                            ) : s.isArchived ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                                Archived
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                Unarchived
                              </span>
                            )}
                          </div>

                          {/* Clip counts */}
                          <div className="p-2.5 rounded-lg bg-[#111111] border border-[#222222] space-y-1.5 text-xs text-[#888888] font-mono">
                            <div className="flex justify-between items-center text-[11px]">
                              <span>Active Pool:</span>
                              <span className="text-white font-semibold">{s.activeClips || 0} clips</span>
                            </div>
                            <div className="flex justify-between items-center text-[11px]">
                              <span>Archived:</span>
                              <span className={s.archivedClips > 0 ? 'text-amber-400 font-semibold' : 'text-[#666]'}>
                                {s.archivedClips || 0} clips
                              </span>
                            </div>
                          </div>

                          {/* Linked ZIP info if available */}
                          {linkedZip ? (
                            <div className="mt-3 p-2.5 rounded-lg bg-[#181818] border border-[#262626] flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-white truncate">
                                  <FaArchive size={11} className="text-sky-400 shrink-0" />
                                  <span className="truncate" title={linkedZip.name}>{linkedZip.name}</span>
                                </div>
                                <span className="text-[10px] text-[#717171] font-mono block mt-0.5">
                                  {formatFileSize(linkedZip.size)}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleDownload(linkedZip._id, linkedZip.url, linkedZip.name)}
                                  disabled={isZipDownloading}
                                  className="p-1.5 rounded-lg bg-[#222] hover:bg-[#f23030] text-white transition-colors cursor-pointer"
                                  title="Download ZIP Archive"
                                >
                                  {isZipDownloading ? (
                                    <span className="text-[10px] flex items-center gap-1">
                                      <FaSpinner className="animate-spin" size={10} />
                                      {zipDownloadProgress}%
                                    </span>
                                  ) : (
                                    <FaFileDownload size={11} />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteClick(linkedZip._id, linkedZip.name)}
                                  className="p-1.5 rounded-lg bg-[#222] hover:bg-rose-500/25 text-[#888] hover:text-rose-400 transition-colors cursor-pointer"
                                  title="Delete ZIP Archive"
                                >
                                  <FaTrash size={11} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 py-2 px-2.5 rounded-lg bg-[#141414] border border-[#222] text-center">
                              <span className="text-[10px] text-[#666] font-mono italic">No ZIP archive compiled</span>
                            </div>
                          )}
                        </div>

                        {/* Season Bottom Actions */}
                        <div className="pt-2 border-t border-[#222222]">
                          {s.hasArchivedClips ? (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedSeasonForUnarchive({
                                  season: s.season,
                                  year: s.year,
                                  archivedClips: s.archivedClips,
                                  zipName: linkedZip?.name,
                                })
                              }
                              className="w-full py-1.5 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 hover:text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              title="Restore archived clips back to the active reviewer list"
                            >
                              <FaHistory size={11} />
                              <span>Unarchive (Undo)</span>
                            </button>
                          ) : !s.isCurrent && s.activeClips > 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                seasonActionMutation.mutate(
                                  { action: 'force-archive', season: s.season, year: s.year },
                                  {
                                    onSuccess: () => {
                                      showSuccess(`Season ${s.season} ${s.year} archived.`);
                                      refetchSeasonStatus();
                                    },
                                    onError: (err: any) => {
                                      showError(err?.message || 'Failed to archive season');
                                    },
                                  }
                                );
                              }}
                              disabled={seasonActionMutation.isPending}
                              className="w-full py-1.5 px-3 rounded-lg bg-[#222222] hover:bg-[#2a2a2a] text-[#ddd] hover:text-white border border-[#333] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                              title="Archive active clips for this past season"
                            >
                              <FaArchive size={11} />
                              <span>Archive Season</span>
                            </button>
                          ) : s.isCurrent ? (
                            <button
                              type="button"
                              onClick={() => setShowProcessConfirm(true)}
                              className="w-full py-1.5 px-3 rounded-lg bg-[#f23030]/15 hover:bg-[#f23030]/25 text-[#f23030] border border-[#f23030]/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <FaFileDownload size={11} />
                              <span>Compile Current Pool</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-[#666] italic block text-center py-1">
                              All clips active
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-[#141414] rounded-xl border border-[#262626]">
                  <p className="text-xs text-[#717171]">No season collections found in database.</p>
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: ALL COMPILED ZIP PACKAGES */}
          {activeView === 'packages' && (
            <div>
              {zipsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-[#aaaaaa]">
                  <FaSpinner className="animate-spin text-2xl text-[#f23030] mb-2" />
                  <p className="text-xs">Loading compiled packages...</p>
                </div>
              ) : zips.length === 0 ? (
                <div className="text-center py-16 rounded-xl border border-[#262626] bg-[#141414] flex flex-col items-center justify-center">
                  <FaBoxOpen className="text-3xl text-[#717171] mb-2" />
                  <p className="text-sm font-bold text-white">No Packages Found</p>
                  <p className="text-xs text-[#aaaaaa] mt-0.5 max-w-sm mb-4">
                    Compile a season archive using the compilation pipeline or upload an existing raw archive.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowProcessConfirm(true)}
                    className="px-4 py-2 bg-[#f23030] hover:bg-[#d92222] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    Compile First ZIP
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {zips.map((zip) => {
                    const isDownloading = downloadStates[zip._id]?.isDownloading;
                    const progress = downloadStates[zip._id]?.progress || 0;

                    return (
                      <div
                        key={zip._id}
                        className="bg-[#141414] rounded-xl p-4 border border-[#262626] hover:border-[#383838] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="font-bold text-sm text-white capitalize">
                              {zip.season} {zip.year}
                            </span>
                            <span className="px-2 py-0.5 bg-[#222222] text-[#f1f1f1] border border-[#333333] text-[10px] font-semibold rounded-full font-mono">
                              {zip.clipAmount} clips
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-semibold rounded-full font-mono">
                              {formatFileSize(zip.size)}
                            </span>
                          </div>

                          <p className="text-xs text-[#aaaaaa] font-mono truncate">{zip.name}</p>

                          <div className="mt-1 flex items-center gap-3 text-[11px] text-[#717171]">
                            <span>Compiled {formatDate(zip.createdAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDownload(zip._id, zip.url, zip.name)}
                            disabled={isDownloading}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              isDownloading
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-not-allowed'
                                : 'bg-[#222222] hover:bg-[#f23030] text-white border border-[#2e2e2e]'
                            }`}
                            title="Download Package"
                          >
                            {isDownloading ? (
                              <>
                                <FaSpinner className="animate-spin" size={11} />
                                <span>{progress}%</span>
                              </>
                            ) : (
                              <>
                                <FaFileDownload size={11} />
                                <span>Download</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteClick(zip._id, zip.name)}
                            className="p-2 rounded-xl text-xs bg-[#222222] hover:bg-rose-500/20 text-[#888888] hover:text-rose-400 border border-[#2e2e2e] transition-all cursor-pointer"
                            title="Delete Package"
                          >
                            <FaTrash size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SeasonArchiveManager;
