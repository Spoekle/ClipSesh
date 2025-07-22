import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FaFlag, 
  FaComments, 
  FaExternalLinkAlt,
  FaCalendar,
  FaFilm,
  FaUserShield,
  FaEye
} from 'react-icons/fa';
import { useUserReports } from '../hooks/useReports';
import { Report } from '../types/adminTypes';
import UserReportMessagingModal from '../components/user/UserReportMessagingModal';

function UserReportsPage() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showMessagingModal, setShowMessagingModal] = useState<boolean>(false);
  
  const { data: reports = [], isLoading } = useUserReports();

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

  const openMessaging = (report: Report) => {
    setSelectedReport(report);
    setShowMessagingModal(true);
  };

  const closeMessaging = () => {
    setShowMessagingModal(false);
    setSelectedReport(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-200 dark:bg-neutral-900 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading your reports...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-200 dark:bg-neutral-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <FaFlag className="text-red-500 text-2xl" />
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
              My Reports
            </h1>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400">
            View and manage your submitted clip reports
          </p>
        </div>

        {/* Reports List */}
        {reports.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <FaFlag className="mx-auto text-4xl text-neutral-400 mb-4" />
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              No reports submitted
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">
              You haven't submitted any clip reports yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <motion.div
                key={report._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6"
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                      <div className="flex items-center space-x-2">
                        <FaFilm className="text-blue-500" />
                        <span>by {report.clipStreamer}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FaCalendar className="text-purple-500" />
                        <span>{formatDate(report.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-3">
                      <div className="flex items-start space-x-2">
                        <FaFlag className="text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-red-800 dark:text-red-300">
                            Your report:
                          </span>
                          <p className="text-red-700 dark:text-red-300 mt-1">
                            {report.reason}
                          </p>
                        </div>
                      </div>
                    </div>

                    {report.reviewedBy && (
                      <div className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                        <FaUserShield className="text-blue-500" />
                        <span>Reviewed by {report.reviewedBy} on {formatDate(report.reviewedAt!)}</span>
                      </div>
                    )}

                    {report.adminNotes && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                          <FaUserShield className="text-blue-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-blue-800 dark:text-blue-300">
                              Admin notes:
                            </span>
                            <p className="text-blue-700 dark:text-blue-300 mt-1">
                              {report.adminNotes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {(report.status === 'resolved' || report.status === 'dismissed') && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                          <FaEye className="text-amber-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-amber-800 dark:text-amber-300">
                              Report {report.status.charAt(0).toUpperCase() + report.status.slice(1)}:
                            </span>
                            <p className="text-amber-700 dark:text-amber-300 mt-1 text-sm">
                              This report no longer accepts new messages. You can still view the conversation history.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  {report.status === 'resolved' || report.status === 'dismissed' ? (
                    <button
                      onClick={() => openMessaging(report)}
                      className="flex items-center space-x-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition"
                    >
                      <FaEye />
                      <span>View Messages</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => openMessaging(report)}
                      className="flex items-center space-x-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition"
                    >
                      <FaComments />
                      <span>Messages</span>
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* User Report Messaging Modal */}
        <UserReportMessagingModal
          report={selectedReport}
          isOpen={showMessagingModal}
          onClose={closeMessaging}
        />
      </div>
    </div>
  );
}

export default UserReportsPage;
