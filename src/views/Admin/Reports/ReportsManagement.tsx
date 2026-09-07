import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaFlag,
  FaExternalLinkAlt,
  FaFilm,
  FaUser,
  FaCalendar,
  FaExclamationTriangle,
  FaCheck,
  FaTimes,
  FaEye,
  FaTrash,
  FaComments,
  FaBan,
  FaFilter
} from 'react-icons/fa';
import { useReports, useUpdateReport, useDeleteReport } from '../../../hooks/useAdmin';
import { Report } from '../../../types/adminTypes';
import ReportMessagingModal from '../../../components/admin/ReportMessagingModal';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import { useLocation, useNavigate } from '@/lib/routerCompat';
import { useNotification } from '../../../context/AlertContext';

const ReportsManagement: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [highlightedReportId, setHighlightedReportId] = useState<string | null>(null);
  const [messagingReport, setMessagingReport] = useState<Report | null>(null);
  const [showMessagingModal, setShowMessagingModal] = useState<boolean>(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const { data: reportsData, isLoading } = useReports(selectedStatus);
  const updateReportMutation = useUpdateReport();
  const deleteReportMutation = useDeleteReport();

  // Handle highlighting specific reports from notifications
  useEffect(() => {
    if (location.state?.highlightReport) {
      setHighlightedReportId(location.state.highlightReport);
      const timer = setTimeout(() => {
        setHighlightedReportId(null);
        navigate(location.pathname, { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [location.state, navigate, location.pathname]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-[#eab308]/15 text-[#eab308] border border-[#eab308]/30';
      case 'reviewed':
        return 'bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30';
      case 'resolved':
        return 'bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30';
      case 'dismissed':
        return 'bg-[#717171]/20 text-[#aaaaaa] border border-[#717171]/30';
      default:
        return 'bg-[#222222] text-[#aaaaaa] border border-[#383838]';
    }
  };

  const handleStatusChange = async (reportId: string, newStatus: string) => {
    try {
      await updateReportMutation.mutateAsync({
        reportId,
        updateData: { status: newStatus }
      });
      showSuccess(`Report ${newStatus} successfully`);
    } catch (error: any) {
      showError(error.message || 'Failed to update report status');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedReport) return;

    try {
      await updateReportMutation.mutateAsync({
        reportId: selectedReport._id,
        updateData: { adminNotes }
      });
      showSuccess('Admin notes saved successfully');
      setSelectedReport(null);
      setAdminNotes('');
    } catch (error: any) {
      showError(error.message || 'Failed to save admin notes');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await deleteReportMutation.mutateAsync(reportId);
      showSuccess('Report deleted successfully');
      setShowDeleteConfirm(false);
      setReportToDelete(null);
    } catch (error: any) {
      showError(error.message || 'Failed to delete report');
      setShowDeleteConfirm(false);
      setReportToDelete(null);
    }
  };

  const openReportDetails = (report: Report) => {
    setSelectedReport(report);
    setAdminNotes(report.adminNotes || '');
  };

  const openMessaging = (report: Report) => {
    setMessagingReport(report);
    setShowMessagingModal(true);
  };

  const closeMessaging = () => {
    setShowMessagingModal(false);
    setMessagingReport(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 bg-[#181818] border border-[#262626] rounded-2xl">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#f23030] border-t-transparent"></div>
        <span className="ml-3 text-xs text-[#aaaaaa]">Loading reports...</span>
      </div>
    );
  }

  const reportsList = reportsData?.reports || [];
  const pendingCount = reportsData?.pendingCount || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[#181818] border border-[#262626] p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f23030]/15 text-[#f23030] flex items-center justify-center">
            <FaFlag size={14} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#f1f1f1] flex items-center gap-2">
              <span>Clip Reports</span>
              {pendingCount > 0 && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#eab308]/15 text-[#eab308] border border-[#eab308]/30">
                  {pendingCount} pending
                </span>
              )}
            </h2>
            <p className="text-xs text-[#717171]">Review and take action on user reported submissions</p>
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs font-medium text-[#717171]">Status:</span>
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-[#121212] border border-[#262626] text-[#f1f1f1] text-xs font-medium py-1.5 pl-3 pr-8 rounded-xl appearance-none cursor-pointer focus:border-[#444] focus:outline-none transition-colors"
            >
              <option value="all">All Reports</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5">
              <FaFilter className="text-[#717171]" size={10} />
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      {reportsList.length > 0 ? (
        <div className="grid gap-3">
          {reportsList.map((report) => (
            <motion.div
              key={report._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-[#181818] rounded-2xl border p-5 transition-all ${
                highlightedReportId === report._id
                  ? 'border-[#38bdf8] ring-1 ring-[#38bdf8]/40'
                  : 'border-[#262626] hover:border-[#383838]'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2.5 mb-2">
                    <h3 className="font-semibold text-sm sm:text-base text-[#f1f1f1] truncate">
                      {report.clipTitle}
                    </h3>
                    <button
                      onClick={() => window.open(`/clips/${report.clipId}`, '_blank')}
                      className="text-[#717171] hover:text-[#f1f1f1] p-1 rounded transition-colors cursor-pointer"
                      title="View clip in new tab"
                    >
                      <FaExternalLinkAlt size={12} />
                    </button>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getStatusBadge(report.status)}`}>
                      {report.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs text-[#aaaaaa] mb-3">
                    <div className="flex items-center space-x-2 truncate">
                      <FaFilm className="text-[#717171] flex-shrink-0" />
                      <span className="truncate">by {report.clipStreamer}</span>
                    </div>
                    <div className="flex items-center space-x-2 truncate">
                      <FaUser className="text-[#717171] flex-shrink-0" />
                      <span className="truncate">submitted by {report.clipSubmitter}</span>
                    </div>
                    <div className="flex items-center space-x-2 truncate">
                      <FaCalendar className="text-[#717171] flex-shrink-0" />
                      <span className="truncate">{formatDate(report.createdAt)}</span>
                    </div>
                  </div>

                  {/* Report Reason Box */}
                  <div className="bg-[#141414] border border-[#262626] rounded-xl p-3 mb-3">
                    <div className="flex items-start space-x-2.5">
                      <FaExclamationTriangle className="text-[#eab308] mt-0.5 flex-shrink-0" size={13} />
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-[#eab308]">
                          Reported by {report.reporterUsername}:
                        </span>
                        <p className="text-xs text-[#f1f1f1] mt-1 leading-relaxed">
                          {report.reason}
                        </p>
                      </div>
                    </div>
                  </div>

                  {report.reviewedBy && (
                    <div className="text-[11px] text-[#717171]">
                      Reviewed by <span className="text-[#aaaaaa] font-medium">{report.reviewedBy}</span> on {formatDate(report.reviewedAt!)}
                    </div>
                  )}

                  {report.adminNotes && (
                    <div className="mt-2 text-[11px] text-[#aaaaaa] bg-[#121212] border border-[#262626] rounded-lg p-2.5">
                      <span className="font-semibold text-[#717171] uppercase tracking-wider text-[10px] block mb-1">Admin Notes:</span>
                      {report.adminNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3.5 border-t border-[#262626]">
                <div className="flex flex-wrap items-center gap-1.5">
                  {report.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(report._id, 'reviewed')}
                        className="flex items-center space-x-1.5 bg-[#141414] hover:bg-[#222222] border border-[#262626] text-[#aaaaaa] hover:text-[#f1f1f1] px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
                        disabled={updateReportMutation.isPending}
                      >
                        <FaEye size={11} />
                        <span>Mark Reviewed</span>
                      </button>
                      <button
                        onClick={() => handleStatusChange(report._id, 'resolved')}
                        className="flex items-center space-x-1.5 bg-[#22c55e]/15 hover:bg-[#22c55e]/25 text-[#22c55e] border border-[#22c55e]/30 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
                        disabled={updateReportMutation.isPending}
                      >
                        <FaCheck size={11} />
                        <span>Resolve</span>
                      </button>
                      <button
                        onClick={() => handleStatusChange(report._id, 'dismissed')}
                        className="flex items-center space-x-1.5 bg-[#141414] hover:bg-[#222222] border border-[#262626] text-[#717171] hover:text-[#aaaaaa] px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
                        disabled={updateReportMutation.isPending}
                      >
                        <FaBan size={11} />
                        <span>Dismiss</span>
                      </button>
                    </>
                  )}

                  {report.status !== 'pending' && (
                    <button
                      onClick={() => handleStatusChange(report._id, 'pending')}
                      className="flex items-center space-x-1.5 bg-[#eab308]/15 hover:bg-[#eab308]/25 text-[#eab308] border border-[#eab308]/30 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
                      disabled={updateReportMutation.isPending}
                    >
                      <FaTimes size={11} />
                      <span>Mark Pending</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                  <button
                    onClick={() => openMessaging(report)}
                    className="flex items-center space-x-1.5 bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 text-[#38bdf8] border border-[#38bdf8]/30 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
                  >
                    <FaComments size={11} />
                    <span>Messages</span>
                  </button>
                  <button
                    onClick={() => openReportDetails(report)}
                    className="flex items-center space-x-1.5 bg-[#141414] hover:bg-[#222222] border border-[#262626] text-[#aaaaaa] hover:text-[#f1f1f1] px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
                  >
                    <FaEye size={11} />
                    <span>Notes</span>
                  </button>
                  <button
                    onClick={() => {
                      setReportToDelete(report._id);
                      setShowDeleteConfirm(true);
                    }}
                    className="flex items-center space-x-1.5 bg-[#f23030]/15 hover:bg-[#f23030]/25 text-[#f23030] border border-[#f23030]/30 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
                  >
                    <FaTrash size={11} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-[#181818] rounded-2xl border border-[#262626]">
          <FaFlag className="mx-auto text-3xl text-[#717171] mb-3" />
          <h3 className="text-sm font-semibold text-[#f1f1f1] mb-1">
            No reports found
          </h3>
          <p className="text-[#aaaaaa] text-xs">
            {selectedStatus === 'all'
              ? 'No reports have been submitted yet.'
              : `No ${selectedStatus} reports found.`
            }
          </p>
        </div>
      )}

      {/* Report Notes Modal */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4"
            onMouseDown={(e) => e.target === e.currentTarget && setSelectedReport(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#181818] border border-[#262626] rounded-2xl shadow-xl w-full max-w-md p-6 text-[#f1f1f1]"
            >
              <h3 className="text-base font-bold mb-3 text-[#f1f1f1]">
                Admin Notes for Report
              </h3>

              <div className="mb-4 bg-[#141414] p-3 rounded-xl border border-[#262626]">
                <h4 className="text-xs font-semibold text-[#f1f1f1] truncate">
                  {selectedReport.clipTitle}
                </h4>
                <p className="text-[11px] text-[#717171] mt-0.5">
                  Reported by {selectedReport.reporterUsername}
                </p>
              </div>

              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add admin notes about this report..."
                className="w-full px-3.5 py-2.5 border border-[#262626] rounded-xl focus:outline-none focus:border-[#444] bg-[#121212] text-xs text-[#f1f1f1] min-h-[120px] resize-vertical"
                rows={5}
              />

              <div className="flex justify-end space-x-2.5 mt-5">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 bg-[#141414] hover:bg-[#222222] text-xs text-[#aaaaaa] hover:text-[#f1f1f1] border border-[#262626] rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNotes}
                  disabled={updateReportMutation.isPending}
                  className="px-4 py-2 bg-[#f23030] hover:bg-[#d92222] text-white text-xs font-semibold rounded-xl transition disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  {updateReportMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Notes</span>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Report"
        message="Are you sure you want to delete this report? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={() => reportToDelete && handleDeleteReport(reportToDelete)}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setReportToDelete(null);
        }}
      />

      {/* Report Messaging Modal */}
      <ReportMessagingModal
        report={messagingReport}
        isOpen={showMessagingModal}
        onClose={closeMessaging}
      />
    </div>
  );
};

export default ReportsManagement;
