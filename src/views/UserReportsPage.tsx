import { useState } from 'react';
import { NavLink } from '@/lib/routerCompat';
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
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'reviewed':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
      case 'resolved':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      case 'dismissed':
        return 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20';
      default:
        return 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/20';
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
      <div className="min-h-[calc(100vh-80px)] bg-[#0b0b0b] text-[#e6e6e6] py-12 flex justify-center items-center">
        <div className="w-8 h-8 border-2 border-[#263238] border-t-[#f23030] rounded-full animate-spin"></div>
        <span className="ml-3 text-xs text-[#b3b3b3] font-medium">Loading your reports...</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-[#0b0b0b] text-[#e6e6e6] transition-colors py-6">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        {/* CC Page Header */}
        <div className="mb-6">
          <nav className="flex items-center gap-1.5 text-sm text-[#b3b3b3] mb-2">
            <NavLink to="/" className="hover:text-white transition-colors">
              Home
            </NavLink>
            <span className="text-[#626262] select-none">/</span>
            <span className="text-white font-medium">My Reports</span>
          </nav>

          <div className="relative pb-3 w-fit">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
              MY REPORTS
            </h1>
            <div className="absolute bottom-0 left-0 w-3/5 h-[2.5px] bg-[#f23030] rounded-full" />
          </div>
          <p className="mt-3 text-sm sm:text-base text-[#b3b3b3] leading-relaxed max-w-xl">
            View and manage your submitted clip reports.
          </p>
        </div>

        {/* Reports List */}
        {reports.length === 0 ? (
          <div className="text-center py-16 bg-[#161d21] rounded-[10px] border border-[#263238] shadow-sm">
            <div className="w-14 h-14 bg-[#0e1315] border border-[#263238] rounded-[10px] flex items-center justify-center mx-auto mb-3 text-[#b3b3b3]">
              <FaFlag size={20} />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">
              No reports submitted
            </h3>
            <p className="text-xs text-[#b3b3b3]">
              You haven't submitted any clip reports yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <motion.div
                key={report._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="card rounded-[10px] border border-[#263238] p-6 bg-[#161d21] shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-bold text-base text-white">
                        {report.clipTitle}
                      </h3>
                      <button
                        onClick={() => window.open(`/clips/${report.clipId}`, '_blank')}
                        className="text-[#b3b3b3] hover:text-[#f23030] p-1 transition-colors"
                        title="View clip"
                      >
                        <FaExternalLinkAlt size={12} />
                      </button>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(report.status)}`}>
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#b3b3b3] mb-3">
                      <div className="flex items-center gap-2">
                        <FaFilm className="text-[#f23030]" />
                        <span>by <strong className="text-white">{report.clipStreamer}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaCalendar className="text-[#b3b3b3]" />
                        <span>{formatDate(report.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="bg-[#f23030]/10 border border-[#f23030]/20 rounded-[8px] p-3 mb-3">
                      <div className="flex items-start gap-2.5">
                        <FaFlag className="text-[#f23030] mt-0.5 shrink-0" size={13} />
                        <div>
                          <span className="font-semibold text-xs text-red-700 dark:text-red-300">
                            Your report:
                          </span>
                          <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 leading-relaxed">
                            {report.reason}
                          </p>
                        </div>
                      </div>
                    </div>

                    {report.reviewedBy && (
                      <div className="flex items-center gap-2 text-xs text-[#b3b3b3] mb-3">
                        <FaUserShield className="text-indigo-400" />
                        <span>Reviewed by <strong className="text-white">{report.reviewedBy}</strong> on {formatDate(report.reviewedAt!)}</span>
                      </div>
                    )}

                    {report.adminNotes && (
                      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-[8px] p-3">
                        <div className="flex items-start gap-2.5">
                          <FaUserShield className="text-indigo-400 mt-0.5 shrink-0" size={13} />
                          <div>
                            <span className="font-semibold text-xs text-indigo-300">
                              Admin notes:
                            </span>
                            <p className="text-xs text-indigo-200 mt-0.5 leading-relaxed">
                              {report.adminNotes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {(report.status === 'resolved' || report.status === 'dismissed') && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-[8px] p-3 mt-3">
                        <div className="flex items-start gap-2.5">
                          <FaEye className="text-amber-500 mt-0.5 shrink-0" size={13} />
                          <div>
                            <span className="font-semibold text-xs text-amber-300">
                              Report {report.status.charAt(0).toUpperCase() + report.status.slice(1)}:
                            </span>
                            <p className="text-xs text-amber-400 mt-0.5">
                              This report no longer accepts new messages. You can still view the conversation history.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end pt-3 border-t border-[#263238]">
                  {report.status === 'resolved' || report.status === 'dismissed' ? (
                    <button
                      onClick={() => openMessaging(report)}
                      className="btn btn-secondary btn-sm rounded-[8px] flex items-center gap-1.5"
                    >
                      <FaEye size={12} />
                      <span>View Messages</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => openMessaging(report)}
                      className="btn btn-primary btn-sm rounded-[8px] flex items-center gap-1.5 shadow-xs"
                    >
                      <FaComments size={12} />
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
