import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaFlag, 
  FaEye, 
  FaCheck, 
  FaTimes, 
  FaBan, 
  FaTrash, 
  FaExclamationTriangle,
  FaCalendar,
  FaUser,
  FaFilm,
  FaExternalLinkAlt,
  FaComments
} from 'react-icons/fa';
import { useNotification } from '../../../context/AlertContext';
import { useReports, useUpdateReport, useDeleteReport } from '../../../hooks/useAdmin';
import { Report } from '../../../types/adminTypes';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import ReportMessagingModal from '../../../components/admin/ReportMessagingModal';

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
      // Clear the highlight after 3 seconds
      const timer = setTimeout(() => {
        setHighlightedReportId(null);
        // Clear the state to prevent re-highlighting on future navigation
        navigate(location.pathname, { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [location.state, navigate, location.pathname]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
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
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <FaFlag className="text-red-500 text-2xl" />
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Clip Reports
          </h2>
          {(reportsData?.pendingCount || 0) > 0 && (
            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-sm font-medium">
              {reportsData?.pendingCount || 0} pending
            </span>
          )}
        </div>
        
        {/* Filter */}
        <div className="relative">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Reports</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      {reportsData?.reports && reportsData.reports.length > 0 ? (
        <div className="grid gap-4">
          {reportsData.reports.map((report) => (
            <motion.div
              key={report._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white dark:bg-neutral-800 rounded-lg border p-6 ${
                highlightedReportId === report._id 
                  ? 'border-blue-500 shadow-lg bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-neutral-200 dark:border-neutral-700'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-lg text-neutral-900 dark:text-white">
                      {report.clipTitle}
                    </h3>
                    <button
                      onClick={() => window.open(`/clips/${report.clipId}`, '_blank')}
                      className="text-blue-500 hover:text-blue-700 dark:text-blue-400 p-1 rounded-full transition-colors"
                      title="View clip"
                    >
                      <FaExternalLinkAlt size={14} />
                    </button>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                    <div className="flex items-center space-x-2">
                      <FaFilm className="text-blue-500" />
                      <span>by {report.clipStreamer}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaUser className="text-green-500" />
                      <span>submitted by {report.clipSubmitter}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FaCalendar className="text-purple-500" />
                      <span>{formatDate(report.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-3">
                    <div className="flex items-start space-x-2">
                      <FaExclamationTriangle className="text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-red-800 dark:text-red-300">
                          Reported by {report.reporterUsername}:
                        </span>
                        <p className="text-red-700 dark:text-red-300 mt-1">
                          {report.reason}
                        </p>
                      </div>
                    </div>
                  </div>

                  {report.reviewedBy && (
                    <div className="text-sm text-neutral-600 dark:text-neutral-400">
                      Reviewed by {report.reviewedBy} on {formatDate(report.reviewedAt!)}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <div className="flex space-x-2">
                  {report.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(report._id, 'reviewed')}
                        className="flex items-center space-x-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm transition"
                        disabled={updateReportMutation.isPending}
                      >
                        <FaEye />
                        <span>Mark Reviewed</span>
                      </button>
                      <button
                        onClick={() => handleStatusChange(report._id, 'resolved')}
                        className="flex items-center space-x-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm transition"
                        disabled={updateReportMutation.isPending}
                      >
                        <FaCheck />
                        <span>Resolve</span>
                      </button>
                      <button
                        onClick={() => handleStatusChange(report._id, 'dismissed')}
                        className="flex items-center space-x-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm transition"
                        disabled={updateReportMutation.isPending}
                      >
                        <FaBan />
                        <span>Dismiss</span>
                      </button>
                    </>
                  )}
                  
                  {report.status !== 'pending' && (
                    <button
                      onClick={() => handleStatusChange(report._id, 'pending')}
                      className="flex items-center space-x-1 bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm transition"
                      disabled={updateReportMutation.isPending}
                    >
                      <FaTimes />
                      <span>Mark Pending</span>
                    </button>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => openMessaging(report)}
                    className="flex items-center space-x-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm transition"
                  >
                    <FaComments />
                    <span>Messages</span>
                  </button>
                  <button
                    onClick={() => openReportDetails(report)}
                    className="flex items-center space-x-1 bg-neutral-500 hover:bg-neutral-600 text-white px-3 py-2 rounded-lg text-sm transition"
                  >
                    <FaEye />
                    <span>Add Notes</span>
                  </button>
                  <button
                    onClick={() => {
                      setReportToDelete(report._id);
                      setShowDeleteConfirm(true);
                    }}
                    className="flex items-center space-x-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm transition"
                  >
                    <FaTrash />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <FaFlag className="mx-auto text-4xl text-neutral-400 mb-4" />
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
            No reports found
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            {selectedStatus === 'all' 
              ? 'No reports have been submitted yet.'
              : `No ${selectedStatus} reports found.`
            }
          </p>
        </div>
      )}

      {/* Report Details Modal */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50"
            onMouseDown={(e) => e.target === e.currentTarget && setSelectedReport(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-md mx-4"
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-neutral-900 dark:text-white">
                  Admin Notes for Report
                </h3>
                
                <div className="mb-4">
                  <h4 className="font-medium text-neutral-700 dark:text-neutral-300">
                    {selectedReport.clipTitle}
                  </h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Reported by {selectedReport.reporterUsername}
                  </p>
                </div>

                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add admin notes about this report..."
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white min-h-[120px] resize-vertical"
                  rows={5}
                />

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-white rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    disabled={updateReportMutation.isPending}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center space-x-2"
                  >
                    {updateReportMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Notes</span>
                    )}
                  </button>
                </div>
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
