'use client';

import React, { useState, useMemo } from 'react';
import {
  FaArchive,
  FaFileDownload,
  FaUpload,
  FaSpinner,
  FaCalendarAlt,
  FaSyncAlt,
} from 'react-icons/fa';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import { Button } from '@/components/Button';
import UnarchiveSeasonModal from '../UnarchiveSeasonModal';
import { SeasonArchiveMetrics } from './season/SeasonArchiveMetrics';
import { UploadZipModal } from './season/UploadZipModal';
import { SeasonLifecycleTable, SeasonStatusItem } from './season/SeasonLifecycleTable';
import { ZipPackagesTable } from './season/ZipPackagesTable';
import { useSeasonStatus, useUnarchiveSeason, useSeasonAction } from '@/hooks/useAdmin';
import { useNotification } from '@/context/AlertContext';
import { formatFileSize } from '@/utils/fileHelpers';
import { downloadWithProgress } from '@/utils/downloadHelpers';
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
  const [showUploadModal, setShowUploadModal] = useState(false);
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
  const [downloadStates, setDownloadStates] = useState<Record<string, { isDownloading: boolean; progress: number }>>({});

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalZipSize = zips.reduce((acc, z) => acc + (z.size || 0), 0);
    const seasonsList: SeasonStatusItem[] = (seasonStatusData?.seasons as SeasonStatusItem[]) || [];
    const totalClips = activeClipsCount !== undefined
      ? activeClipsCount
      : (seasonsList.find((s) => s.isCurrent)?.activeClips ?? 0);

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
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to unarchive season';
      showError(msg);
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
    } catch (err) {
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

  const handleArchiveSeason = (season: string, year: number) => {
    seasonActionMutation.mutate(
      { action: 'force-archive', season, year },
      {
        onSuccess: () => {
          showSuccess(`Season ${season} ${year} archived.`);
          refetchSeasonStatus();
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : 'Failed to archive season';
          showError(msg);
        },
      }
    );
  };

  const seasonsList: SeasonStatusItem[] = (seasonStatusData?.seasons as SeasonStatusItem[]) || [];

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
      <UploadZipModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => refetchSeasonStatus()}
        defaultYear={seasonInfo.year}
        defaultSeason={seasonInfo.season}
      />

      {/* Main Container */}
      <div className="space-y-6 select-none">
        {/* Top Control Bar & KPI Stats Card */}
        <div className="bg-cc-card p-5 sm:p-6 rounded-2xl border border-border shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                  <FaArchive size={14} />
                </div>
                <span>Seasons & Distribution Archives</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Compile approved submissions into release ZIP packages, manage seasonal lifecycle transitions, and download editor archives.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="card"
                size="icon"
                onClick={() => refetchSeasonStatus()}
                title="Refresh season data"
              >
                <FaSyncAlt size={12} />
              </Button>

              <Button
                variant="card"
                size="md"
                onClick={() => setShowUploadModal(true)}
                leftIcon={<FaUpload size={11} className="text-emerald-400" />}
              >
                Upload ZIP
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={() => setShowProcessConfirm(true)}
                disabled={downloading}
                isLoading={downloading}
                leftIcon={<FaFileDownload size={12} />}
              >
                {downloading ? 'Compiling...' : 'Compile Season ZIP'}
              </Button>
            </div>
          </div>

          {/* Metric KPIs Strip */}
          <SeasonArchiveMetrics
            currentSeasonLabel={metrics.currentSeasonLabel}
            activeClips={metrics.activeClips}
            packagesCount={metrics.packagesCount}
            totalZipSizeFormatted={metrics.totalStorage}
          />
        </div>

        {/* View Switcher: Seasons Lifecycle vs All Packages */}
        <div className="bg-cc-card p-5 sm:p-6 rounded-2xl border border-border shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div className="flex items-center gap-1.5 p-1 bg-cc-ground border border-border rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setActiveView('seasons')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeView === 'seasons'
                    ? 'bg-white/10 text-white border border-border'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                <FaCalendarAlt size={11} className={activeView === 'seasons' ? 'text-primary' : ''} />
                <span>Season Lifecycles</span>
                {seasonsList.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cc-card text-muted-foreground border border-border">
                    {seasonsList.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveView('packages')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeView === 'packages'
                    ? 'bg-white/10 text-white border border-border'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                <FaArchive size={11} className={activeView === 'packages' ? 'text-sky-400' : ''} />
                <span>Compiled Packages</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cc-card text-muted-foreground border border-border">
                  {zips.length}
                </span>
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              {activeView === 'seasons'
                ? 'Manage active review pools and archive transitions per season cycle'
                : 'Directly download or delete compiled ZIP archives for distribution'}
            </p>
          </div>

          {/* VIEW 1: SEASONS LIFECYCLE */}
          {activeView === 'seasons' && (
            <SeasonLifecycleTable
              seasons={seasonsList}
              loading={seasonStatusLoading}
              zips={zips}
              downloadStates={downloadStates}
              onDownload={handleDownload}
              onDeleteZip={handleDeleteClick}
              onSelectUnarchive={setSelectedSeasonForUnarchive}
              onArchiveSeason={handleArchiveSeason}
              isArchiving={seasonActionMutation.isPending}
              onCompilePool={() => setShowProcessConfirm(true)}
            />
          )}

          {/* VIEW 2: ALL COMPILED ZIP PACKAGES */}
          {activeView === 'packages' && (
            <ZipPackagesTable
              zips={zips}
              loading={zipsLoading}
              downloadStates={downloadStates}
              onDownload={handleDownload}
              onDeleteZip={handleDeleteClick}
              onCompileFirstZip={() => setShowProcessConfirm(true)}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default SeasonArchiveManager;
