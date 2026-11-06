'use client';

import React, { useState, Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import UserList from './components/UserManagement/UserList';
import Statistics from './components/Overview/Statistics';
import ConfigPanel from './components/Configuration/ConfigPanel';
import ReportsManagement from './components/Reports/ReportsManagement';
import { Clip } from '@/types/adminTypes';
import ProcessClipsModal from './components/ProcessClipsModal';
import useSocket from '@/hooks/useSocket';
import RequireAuth from '@/components/RequireAuth';
import AdminHeader from './components/AdminHeader';
import AdminTabsNav, { AdminTab, parseAdminTab } from './components/AdminTabsNav';
import SeasonArchiveManager from './components/ContentManagement/SeasonArchiveManager';
import DeniedClips from './components/ContentManagement/DeniedClips';
import DiscordScraper from './components/ContentManagement/DiscordScraper';
import ActiveJobsBanner from './components/ActiveJobsBanner';
import useProcessJobs from './hooks/useProcessJobs';
import useAdminMetrics from './hooks/useAdminMetrics';
import { buildProcessClipsPayload } from './utils/processClipsHelper';

import {
  useAllUsers,
  useAdminConfig,
  useAdminStats,
  useClipsWithRatings,
  useZips,
  useDeleteZip,
  useProcessClips,
  useReports,
} from '@/hooks/useAdmin';
import { useNotification } from '@/context/AlertContext';

function AdminDash() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = parseAdminTab(searchParams.get('tab'));
  const setActiveTab = (tab: AdminTab) => {
    router.replace(tab === 'overview' ? pathname : `${pathname}?tab=${tab}`, { scroll: false });
  };
  const [selectedScraperChannel, setSelectedScraperChannel] = useState<string>('');

  const { data: allUsers = [], isLoading: usersLoading, refetch: refetchUsers } = useAllUsers();
  const { data: configData, isLoading: configLoading, refetch: refetchConfig } = useAdminConfig();
  const { isLoading: statsLoading, refetch: refetchStats } = useAdminStats();
  const { data: clipsData, isLoading: clipsLoading, refetch: refetchClips } = useClipsWithRatings();
  const { data: zips = [], isLoading: zipsLoading, refetch: refetchZips } = useZips();
  const { data: pendingReportsData, refetch: refetchReports } = useReports('pending');
  const { showSuccess, showError, showAlertModal } = useNotification();

  const deleteZipMutation = useDeleteZip();
  const processClipsMutation = useProcessClips();

  const clips = clipsData?.clips || [];
  const ratings = clipsData?.ratings || {};
  const config = configData ? {
    denyThreshold: configData.admin?.denyThreshold ?? 5,
    latestVideoLink: configData.public?.latestVideoLink ?? '',
    clipChannelIds: configData.admin?.clipChannelIds ?? [],
    blacklistedSubmitters: configData.admin?.blacklistedSubmitters ?? [],
    blacklistedStreamers: configData.admin?.blacklistedStreamers ?? []
  } : {
    denyThreshold: 5,
    latestVideoLink: '',
    clipChannelIds: [],
    blacklistedSubmitters: [],
    blacklistedStreamers: []
  };

  const { clipTeam, seasonInfo, userRatings, clipStats } =
    useAdminMetrics(clips, ratings, allUsers, config.denyThreshold);

  const [processModalOpen, setProcessModalOpen] = useState<boolean>(false);
  const [processJobId, setProcessJobId] = useState<string | null>(null);

  const {
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
  } = useProcessJobs(() => {
    refetchZips();
  });

  const loading = usersLoading || configLoading || statsLoading || clipsLoading || zipsLoading;
  const { isConnected } = useSocket();

  const handleRefreshAll = () => {
    refetchUsers();
    refetchConfig();
    refetchStats();
    refetchClips();
    refetchZips();
    refetchReports();
    fetchAllProcessJobs();
  };

  const deleteZip = async (zipId: string): Promise<void> => {
    await deleteZipMutation.mutateAsync(zipId);
  };

  const processClips = async (season: string, year: number): Promise<void> => {
    const payload = buildProcessClipsPayload(clips, ratings, season, year);

    if (payload.clips.length === 0) {
      showAlertModal({
        title: 'No Clips to Process',
        message: 'No clips to process. All clips have been denied or are invalid for this season.',
        type: 'warning'
      });
      setProcessModalOpen(false);
      return;
    }

    try {
      setProcessModalOpen(false);
      showSuccess(`Starting ZIP compilation for ${season} ${year}...`);

      const response = await processClipsMutation.mutateAsync(payload);
      const { jobId } = response;
      setProcessJobId(jobId);

      if (jobId) {
        unDismissJob(jobId);
      }

      await fetchAllProcessJobs(true);
      if (jobId) setSelectedProcessJobId(jobId);
      setIsProcessWidgetExpanded(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to start processing clips. Please try again.';
      showError(message);
    }
  };

  const pendingReportsCount = pendingReportsData?.pendingCount || pendingReportsData?.total || 0;
  const openProcessModal = async () => {
    await refetchClips();
    setProcessModalOpen(true);
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] text-foreground flex flex-col bg-cc-ground">
      <AdminHeader
        seasonLabel={`${seasonInfo.season} ${seasonInfo.year}`}
        isConnected={isConnected}
        onRefresh={handleRefreshAll}
        loading={loading}
      >
        <AdminTabsNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          badges={{ reports: pendingReportsCount, denied: clipStats.deniedClips }}
        />
      </AdminHeader>

      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-8 pt-4 pb-12 grow">
        {activeTab === 'overview' && (
          <Statistics
            clipTeam={clipTeam}
            userRatings={userRatings}
            clipStats={clipStats}
            pendingReportsCount={pendingReportsCount}
            loading={loading}
          />
        )}

        {activeTab === 'seasons' && (
          <SeasonArchiveManager
            openProcessModal={openProcessModal}
            downloading={false}
            zips={zips}
            zipsLoading={zipsLoading}
            deleteZip={deleteZip}
            seasonInfo={seasonInfo}
            activeClipsCount={clips.filter((c) => !c.archived).length}
          />
        )}

        {activeTab === 'denied' && <DeniedClips clips={clips} ratings={ratings} config={config} />}

        {activeTab === 'scraper' && (
          <DiscordScraper configuredChannels={config.clipChannelIds} initialChannelId={selectedScraperChannel} />
        )}

        {activeTab === 'users' && <UserList />}

        {activeTab === 'reports' && <ReportsManagement />}

        {activeTab === 'settings' && (
          <ConfigPanel
            config={config}
            onOpenScraper={(chId) => {
              if (chId) setSelectedScraperChannel(chId);
              setActiveTab('scraper');
            }}
          />
        )}
      </div>

      <ProcessClipsModal
        isOpen={processModalOpen}
        onClose={() => setProcessModalOpen(false)}
        onProcess={processClips}
        onProcessingComplete={refetchZips}
        processing={false}
        progress={0}
        currentSeason={seasonInfo.season || ''}
        currentYear={seasonInfo.year || new Date().getFullYear()}
        clipCount={clips.filter(clip => {
          const clipSeason = clip.season?.toLowerCase();
          const currentSeason = seasonInfo.season?.toLowerCase();
          if (clipSeason !== currentSeason || clip.year !== seasonInfo.year) return false;

          const ratingData = ratings[clip._id];
          return (
            ratingData &&
            ratingData.ratingCounts &&
            Array.isArray(ratingData.ratingCounts) &&
            ratingData.ratingCounts.every(
              (rateData) => rateData.rating !== 'deny' || rateData.count < config.denyThreshold
            )
          );
        }).length}
        processJobId={processJobId}
        clips={clips}
        ratings={ratings}
        denyThreshold={config.denyThreshold}
      />

      <ActiveJobsBanner
        visibleProcessJobs={visibleProcessJobs}
        currentProcessJob={currentProcessJob}
        selectedProcessJobId={selectedProcessJobId}
        setSelectedProcessJobId={setSelectedProcessJobId}
        isProcessWidgetExpanded={isProcessWidgetExpanded}
        setIsProcessWidgetExpanded={setIsProcessWidgetExpanded}
        onRefreshJobs={fetchAllProcessJobs}
        onDismissJob={handleDismissProcessJob}
        onDismissAllJobs={handleDismissAllProcessJobs}
        onForceComplete={handleForceCompleteProcess}
        onCancelJob={handleCancelProcessJob}
        processLogsContainerRef={processLogsContainerRef}
        isScraperTab={activeTab === 'scraper'}
      />
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth isAdminRequired>
      <Suspense fallback={<div className="min-h-screen bg-cc-ground text-white flex items-center justify-center">Loading admin…</div>}>
        <AdminDash />
      </Suspense>
    </RequireAuth>
  );
}