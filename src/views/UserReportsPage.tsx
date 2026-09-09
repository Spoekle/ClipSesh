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
  FaEye,
  FaExclamationTriangle
} from 'react-icons/fa';
import { useUserReports } from '../hooks/useReports';
import { Report } from '../types/adminTypes';
import UserReportMessagingModal from '../components/user/UserReportMessagingModal';

function UserReportsPage() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showMessagingModal, setShowMessagingModal] = useState<boolean>(false);
  
  const { data: reports = [], isLoading } = useUserReports();

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
      <div className="min-h-[calc(100vh-80px)] bg-[#0f0f0f] text-[#f1f1f1] py-16 flex flex-col justify-center items-center">
        <div className="w-8 h-8 border-2 border-[#262626] border-t-cc-red rounded-full animate-spin"></div>
        <span className="mt-3 text-xs text-[#aaaaaa] font-medium">Loading your reports...</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-[#0f0f0f] text-[#f1f1f1]">
      {/* CC Page Header Container (1200px centered) */}
      <div className="relative w-full overflow-hidden select-none">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-6 pb-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-sm text-[#b3b3b3] mb-2">
            <NavLink to="/" className="hover:text-white transition-colors">
              Home
            </NavLink>
            <span className="text-[#626262] select-none">/</span>
            <span className="text-white font-medium">My Reports</span>
          </nav>

          {/* Title row with signature CC Red Underline */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="relative pb-3 w-fit">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight uppercase">
                  MY REPORTS
                </h1>
                {/* CC Red Bar: width 60%, height 2.5px */}
                <div className="absolute bottom-0 left-0 w-3/5 h-[2.5px] bg-[#f23030] rounded-full" />
              </div>
              <p className="mt-3 text-sm sm:text-base text-[#b3b3b3] leading-relaxed max-w-xl">
                View status updates, admin notes, and discuss your submitted clip reports.
              </p>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2.5 pb-1">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-[6px] bg-[#181818] border border-[#2a2a2a] text-[#e6e6e6]">
                Reports Console
              </span>
              <span className="text-xs font-medium px-3 py-1 rounded-sm bg-[#f23030]/10 border border-[#f23030]/25 text-[#f23030]">
                {reports.length} {reports.length === 1 ? 'report' : 'reports'} submitted
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-6">

        {/* Reports List */}
        {reports.length === 0 ? (
          <div className="text-center py-16 bg-[#181818] rounded-2xl border border-[#262626] shadow-sm">
            <div className="w-12 h-12 bg-[#121212] border border-[#262626] rounded-xl flex items-center justify-center mx-auto mb-3 text-[#717171]">
              <FaFlag size={18} />
            </div>
            <h3 className="text-sm font-bold text-[#f1f1f1] mb-1">
              No reports submitted
            </h3>
            <p className="text-xs text-[#aaaaaa] max-w-sm mx-auto">
              You haven't submitted any clip reports yet. If you spot a clip violating guidelines, you can report it from the clip viewer.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report._id}
                className="bg-[#181818] rounded-2xl border border-[#262626] p-5 sm:p-6 hover:border-[#383838] transition-colors shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
                      <h3 className="font-semibold text-sm sm:text-base text-[#f1f1f1] truncate">
                        {report.clipTitle}
                      </h3>
                      <button
                        onClick={() => window.open(`/clips/${report.clipId}`, '_blank')}
                        className="text-[#717171] hover:text-[#f1f1f1] p-1 rounded-lg transition-colors cursor-pointer"
                        title="View clip in new tab"
                      >
                        <FaExternalLinkAlt size={12} />
                      </button>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getStatusBadge(report.status)}`}>
                        {report.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs text-[#aaaaaa] mb-3.5">
                      <div className="flex items-center gap-2 truncate">
                        <FaFilm className="text-[#717171] shrink-0" />
                        <span className="truncate">by <span className="text-[#f1f1f1] font-medium">{report.clipStreamer}</span></span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <FaCalendar className="text-[#717171] shrink-0" />
                        <span className="truncate">{formatDate(report.createdAt)}</span>
                      </div>
                    </div>

                    {/* Report Reason Box */}
                    <div className="bg-[#141414] border border-[#262626] rounded-xl p-3.5 mb-3">
                      <div className="flex items-start gap-2.5">
                        <FaExclamationTriangle className="text-[#eab308] mt-0.5 shrink-0" size={13} />
                        <div className="min-w-0">
                          <span className="font-semibold text-xs text-[#eab308] block">
                            Your Report:
                          </span>
                          <p className="text-xs text-[#f1f1f1] mt-1 leading-relaxed">
                            {report.reason}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Reviewed By Meta */}
                    {report.reviewedBy && (
                      <div className="text-[11px] text-[#717171] mb-2.5">
                        Reviewed by <span className="text-[#aaaaaa] font-medium">{report.reviewedBy}</span> on {formatDate(report.reviewedAt!)}
                      </div>
                    )}

                    {/* Admin Notes Box */}
                    {report.adminNotes && (
                      <div className="bg-[#121212] border border-[#262626] rounded-xl p-3.5 mb-3">
                        <div className="flex items-start gap-2.5">
                          <FaUserShield className="text-[#38bdf8] mt-0.5 shrink-0" size={13} />
                          <div className="min-w-0">
                            <span className="font-semibold text-xs text-[#38bdf8] block">
                              Admin Notes:
                            </span>
                            <p className="text-xs text-[#f1f1f1] mt-1 leading-relaxed">
                              {report.adminNotes}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Closed Notice */}
                    {(report.status === 'resolved' || report.status === 'dismissed') && (
                      <div className="bg-[#141414] border border-[#262626] rounded-xl p-3 flex items-start gap-2.5">
                        <FaEye className="text-[#717171] mt-0.5 shrink-0" size={13} />
                        <div>
                          <span className="font-semibold text-xs text-[#aaaaaa] block">
                            Report {report.status.charAt(0).toUpperCase() + report.status.slice(1)}:
                          </span>
                          <p className="text-[11px] text-[#717171] mt-0.5">
                            This report no longer accepts new messages. You can still view the conversation history.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex justify-end pt-3.5 border-t border-[#262626]">
                  {report.status === 'resolved' || report.status === 'dismissed' ? (
                    <button
                      onClick={() => openMessaging(report)}
                      className="flex items-center gap-1.5 bg-[#141414] hover:bg-[#222222] border border-[#262626] text-[#aaaaaa] hover:text-[#f1f1f1] px-3.5 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
                    >
                      <FaEye size={11} />
                      <span>View Messages</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => openMessaging(report)}
                      className="flex items-center gap-1.5 bg-cc-red hover:bg-cc-red-hover text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shadow-sm"
                    >
                      <FaComments size={11} />
                      <span>Messages</span>
                    </button>
                  )}
                </div>
              </div>
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
