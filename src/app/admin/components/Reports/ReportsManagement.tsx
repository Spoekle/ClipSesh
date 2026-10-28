'use client';

import React, { useState, useEffect } from 'react';
import { Flag, Filter } from 'lucide-react';
import { useReports, useUpdateReport, useDeleteReport } from '@/hooks/useAdmin';
import { Report } from '@/types/adminTypes';
import ReportMessagingModal from './ReportMessagingModal';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import { useSearchParams } from 'next/navigation';
import { useNotification } from '@/context/AlertContext';
import ReportCardItem from './ReportCardItem';
import ReportNotesModal from './ReportNotesModal';

export const ReportsManagement: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [highlightedReportId, setHighlightedReportId] = useState<string | null>(null);
  const [messagingReport, setMessagingReport] = useState<Report | null>(null);
  const [showMessagingModal, setShowMessagingModal] = useState<boolean>(false);

  const searchParams = useSearchParams();
  const { showSuccess, showError } = useNotification();

  const { data: reportsData, isLoading } = useReports(selectedStatus);
  const updateReportMutation = useUpdateReport();
  const deleteReportMutation = useDeleteReport();

  const highlightReport = searchParams.get('highlightReport');
  useEffect(() => {
    if (highlightReport) {
      setHighlightedReportId(highlightReport);
      const timer = setTimeout(() => {
        setHighlightedReportId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightReport]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedReport) {
        setSelectedReport(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedReport]);

  const handleStatusChange = async (reportId: string, newStatus: string) => {
    try {
      await updateReportMutation.mutateAsync({
        reportId,
        updateData: { status: newStatus as Report['status'] },
      });
      showSuccess(`Report ${newStatus} successfully`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update report status';
      showError(message);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedReport) return;

    try {
      await updateReportMutation.mutateAsync({
        reportId: selectedReport._id,
        updateData: { adminNotes },
      });
      showSuccess('Notes saved successfully');
      setSelectedReport(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save notes';
      showError(message);
    }
  };

  const handleDeleteReport = async () => {
    if (!reportToDelete) return;

    try {
      await deleteReportMutation.mutateAsync(reportToDelete);
      showSuccess('Report deleted successfully');
      setShowDeleteConfirm(false);
      setReportToDelete(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to delete report';
      showError(message);
    }
  };

  const openNotesModal = (report: Report) => {
    setSelectedReport(report);
    setAdminNotes(report.adminNotes || '');
  };

  const openMessaging = (report: Report) => {
    setMessagingReport(report);
    setShowMessagingModal(true);
  };

  const reportsList = reportsData?.reports || [];
  const pendingCount = reportsData?.pendingCount || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-cc-card border border-border p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <Flag className="size-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Clip Reports</span>
              {pendingCount > 0 && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  {pendingCount} pending
                </span>
              )}
            </h2>
            <p className="text-xs text-muted-foreground">
              Review and take action on user reported submissions
            </p>
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs font-medium text-muted-foreground">Status:</span>
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-cc-ground border border-border text-white text-xs font-medium py-1.5 pl-3 pr-8 rounded-xl appearance-none cursor-pointer focus:border-border/80 focus:outline-none transition-colors"
            >
              <option value="all">All Reports</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5">
              <Filter className="text-muted-foreground size-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      {reportsList.length > 0 ? (
        <div className="grid gap-3">
          {reportsList.map((report) => (
            <ReportCardItem
              key={report._id}
              report={report}
              isHighlighted={highlightedReportId === report._id}
              onStatusChange={handleStatusChange}
              onOpenMessaging={openMessaging}
              onOpenNotes={openNotesModal}
              onDeleteClick={(id) => {
                setReportToDelete(id);
                setShowDeleteConfirm(true);
              }}
              isUpdating={updateReportMutation.isPending}
            />
          ))}
        </div>
      ) : (
        <div className="bg-cc-card border border-border rounded-2xl p-12 text-center">
          <div className="size-12 rounded-2xl bg-cc-ground border border-border flex items-center justify-center text-muted-foreground mx-auto mb-3">
            <Flag className="size-5" />
          </div>
          <h3 className="text-sm font-semibold text-white">No reports found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedStatus === 'all'
              ? 'No clip reports have been submitted yet.'
              : `No reports with status "${selectedStatus}".`}
          </p>
        </div>
      )}

      {/* Admin Notes Modal */}
      <ReportNotesModal
        selectedReport={selectedReport}
        adminNotes={adminNotes}
        setAdminNotes={setAdminNotes}
        onClose={() => setSelectedReport(null)}
        onSave={handleSaveNotes}
        isPending={updateReportMutation.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Report"
        message="Are you sure you want to permanently delete this report? This action cannot be undone."
        confirmText="Delete Report"
        confirmVariant="danger"
        onConfirm={handleDeleteReport}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setReportToDelete(null);
        }}
      />

      {/* Report Messaging Modal */}
      <ReportMessagingModal
        isOpen={showMessagingModal}
        onClose={() => {
          setShowMessagingModal(false);
          setMessagingReport(null);
        }}
        report={messagingReport}
      />
    </div>
  );
};

export default ReportsManagement;
