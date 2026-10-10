'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import UserList from './components/UserManagement/UserList';
import Statistics from './components/Overview/Statistics';
import ConfigPanel from './components/Configuration/ConfigPanel';
import ReportsManagement from './components/Reports/ReportsManagement';
import { Clip } from '@/types/adminTypes';
import ProcessClipsModal from './components/ProcessClipsModal';
import useSocket from '@/hooks/useSocket';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import RequireAuth from '@/components/RequireAuth';
import AdminHeader from './components/AdminHeader';
import ExecutiveSummaryStrip from './components/ExecutiveSummaryStrip';
import AdminTabsNav, { AdminTab } from './components/AdminTabsNav';
import ContentTab, { ContentSubTab } from './components/ContentManagement/ContentTab';
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
  useDeleteUser,
  useProcessClips,
  useReports,
} from '@/hooks/useAdmin';
import { useNotification } from '@/context/AlertContext';

function AdminDash() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [activeContentSubTab, setActiveContentSubTab] = useState<ContentSubTab>('pipeline');
  const [selectedScraperChannel, setSelectedScraperChannel] = useState<string>('');

  const { data: allUsers = [], isLoading: usersLoading, refetch: refetchUsers } = useAllUsers();
  const { data: configData, isLoading: configLoading, refetch: refetchConfig } = useAdminConfig();
  const { isLoading: statsLoading, refetch: refetchStats } = useAdminStats();
  const { data: clipsData, isLoading: clipsLoading, refetch: refetchClips } = useClipsWithRatings();
  const { data: zips = [], isLoading: zipsLoading, refetch: refetchZips } = useZips();
  const { data: pendingReportsData, refetch: refetchReports } = useReports('pending');
  const { showSuccess, showError, showAlertModal } = useNotification();

  const deleteZipMutation = useDeleteZip();
  const deleteUserMutation = useDeleteUser();
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

  const {
    admins,
    clipTeam,
    disabledUsers,
    seasonInfo,
    userRatings,
    clipStats,
  } = useAdminMetrics(clips, ratings, allUsers, config.denyThreshold);

  const AVAILABLE_ROLES = ['user', 'admin', 'editor', 'uploader', 'clipteam'];
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showDeleteUserConfirmation, setShowDeleteUserConfirmation] = useState<boolean>(false);

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
  const searchParams = useSearchParams();
  const { isConnected } = useSocket();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'users', 'content', 'config', 'reports'].includes(tabParam)) {
      setActiveTab(tabParam as AdminTab);
    }
  }, [searchParams]);

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

  const confirmDeleteUser = async (): Promise<void> => {
    if (!userToDelete) return;
    setShowDeleteUserConfirmation(false);
    try {
      await deleteUserMutation.mutateAsync(userToDelete);
      showSuccess('User deleted successfully');
    } catch {
      showError('Failed to delete user. Please try again.');
    } finally {
      setUserToDelete(null);
    }
  };

  const cancelDeleteUser = (): void => {
    setShowDeleteUserConfirmation(false);
    setUserToDelete(null);
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
  const reviewedPercent = seasonInfo.clipAmount > 0
    ? Math.round((clipStats.ratedClips / seasonInfo.clipAmount) * 100)
    : 0;

  return (
    <div className="relative min-h-[calc(100vh-80px)] text-white flex flex-col bg-cc-ground transition-colors">
      <AdminHeader
        isConnected={isConnected}
        userCount={allUsers.length}
        clipCount={clips.length}
        onRefresh={handleRefreshAll}
        loading={loading}
      />

      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-8 py-6 grow flex flex-col">
        <ExecutiveSummaryStrip
          clipAmount={seasonInfo.clipAmount}
          reviewedPercent={reviewedPercent}
          ratedClipsCount={clipStats.ratedClips}
          reviewTeamCount={clipTeam.length + admins.length}
          pendingReportsCount={pendingReportsCount}
        />

        <AdminTabsNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingReportsCount={pendingReportsCount}
        />

        <div className="space-y-6">
          {activeTab === 'overview' && (
            <Statistics
              clipTeam={clipTeam}
              userRatings={userRatings}
              seasonInfo={seasonInfo}
              clipStats={clipStats}
              loading={loading}
            />
          )}

          {activeTab === 'users' && (
            <UserList
              fetchUsers={refetchUsers}
              disabledUsers={disabledUsers}
              setDisabledUsers={() => {}}
              AVAILABLE_ROLES={AVAILABLE_ROLES}
            />
          )}

          {activeTab === 'content' && (
            <ContentTab
              activeContentSubTab={activeContentSubTab}
              setActiveContentSubTab={setActiveContentSubTab}
              zips={zips}
              clips={clips}
              ratings={ratings}
              config={config}
              seasonInfo={seasonInfo}
              downloading={false}
              loading={loading}
              zipsLoading={zipsLoading}
              deleteZip={deleteZip}
              openProcessModal={async () => {
                await refetchClips();
                setProcessModalOpen(true);
              }}
              selectedScraperChannel={selectedScraperChannel}
              deniedClipsCount={clipStats.deniedClips}
            />
          )}

          {activeTab === 'config' && (
            <ConfigPanel
              config={config}
              onOpenScraper={(chId) => {
                if (chId) setSelectedScraperChannel(chId);
                setActiveTab('content');
                setActiveContentSubTab('scraper');
              }}
            />
          )}

          {activeTab === 'reports' && <ReportsManagement />}
        </div>
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

      <ConfirmationDialog
        isOpen={showDeleteUserConfirmation}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={confirmDeleteUser}
        onCancel={cancelDeleteUser}
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
        isScraperTab={activeTab === 'content' && activeContentSubTab === 'scraper'}
      />
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth isAdminRequired>
      <Suspense fallback={<div className="min-h-screen bg-cc-ground text-white flex items-center justify-center">Loading Admin Dashboard...</div>}>
        <AdminDash />
      </Suspense>
    </RequireAuth>
  );
}