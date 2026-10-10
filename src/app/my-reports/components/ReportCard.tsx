'use client';

import React from 'react';
import {
  FaComments,
  FaExternalLinkAlt,
  FaCalendar,
  FaFilm,
  FaUserShield,
  FaEye,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { Report } from '@/types/adminTypes';
import { Button } from '@/components/Button';

interface ReportCardProps {
  report: Report;
  onOpenMessaging: (report: Report) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
    case 'reviewed':
      return 'bg-sky-500/15 text-sky-400 border border-sky-500/30';
    case 'resolved':
      return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
    case 'dismissed':
      return 'bg-border/60 text-muted-foreground border border-border';
    default:
      return 'bg-cc-card text-muted-foreground border border-border';
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

export const ReportCard: React.FC<ReportCardProps> = ({ report, onOpenMessaging }) => {
  const isClosed = report.status === 'resolved' || report.status === 'dismissed';

  return (
    <div className="bg-cc-card rounded-2xl border border-border p-5 sm:p-6 hover:border-muted-foreground/30 transition-colors shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
            <h3 className="font-semibold text-sm sm:text-base text-cc-text truncate">
              {report.clipTitle}
            </h3>
            <button
              onClick={() => window.open(`/clips/${report.clipId}`, '_blank')}
              className="text-muted-foreground hover:text-cc-text p-1 rounded-lg transition-colors cursor-pointer"
              title="View clip in new tab"
            >
              <FaExternalLinkAlt size={12} />
            </button>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getStatusBadge(
                report.status
              )}`}
            >
              {report.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs text-muted-foreground mb-3.5">
            <div className="flex items-center gap-2 truncate">
              <FaFilm className="text-muted-foreground shrink-0" />
              <span className="truncate">
                by <span className="text-cc-text font-medium">{report.clipStreamer}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 truncate">
              <FaCalendar className="text-muted-foreground shrink-0" />
              <span className="truncate">{formatDate(report.createdAt)}</span>
            </div>
          </div>

          {/* Report Reason Box */}
          <div className="bg-cc-ground border border-border rounded-xl p-3.5 mb-3">
            <div className="flex items-start gap-2.5">
              <FaExclamationTriangle className="text-amber-400 mt-0.5 shrink-0" size={13} />
              <div className="min-w-0">
                <span className="font-semibold text-xs text-amber-400 block">
                  Your Report:
                </span>
                <p className="text-xs text-cc-text mt-1 leading-relaxed">
                  {report.reason}
                </p>
              </div>
            </div>
          </div>

          {/* Reviewed By Meta */}
          {report.reviewedBy && (
            <div className="text-[11px] text-muted-foreground mb-2.5">
              Reviewed by{' '}
              <span className="text-cc-text font-medium">{report.reviewedBy}</span> on{' '}
              {formatDate(report.reviewedAt || '')}
            </div>
          )}

          {/* Admin Notes Box */}
          {report.adminNotes && (
            <div className="bg-cc-ground border border-border rounded-xl p-3.5 mb-3">
              <div className="flex items-start gap-2.5">
                <FaUserShield className="text-sky-400 mt-0.5 shrink-0" size={13} />
                <div className="min-w-0">
                  <span className="font-semibold text-xs text-sky-400 block">
                    Admin Notes:
                  </span>
                  <p className="text-xs text-cc-text mt-1 leading-relaxed">
                    {report.adminNotes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Closed Notice */}
          {isClosed && (
            <div className="bg-cc-ground border border-border rounded-xl p-3 flex items-start gap-2.5">
              <FaEye className="text-muted-foreground mt-0.5 shrink-0" size={13} />
              <div>
                <span className="font-semibold text-xs text-muted-foreground block">
                  Report {report.status.charAt(0).toUpperCase() + report.status.slice(1)}:
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  This report no longer accepts new messages. You can still view the conversation history.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions Footer */}
      <div className="flex justify-end pt-3.5 border-t border-border">
        {isClosed ? (
          <Button
            variant="card"
            size="sm"
            onClick={() => onOpenMessaging(report)}
            leftIcon={<FaEye size={11} />}
          >
            View Messages
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onOpenMessaging(report)}
            leftIcon={<FaComments size={11} />}
          >
            Messages
          </Button>
        )}
      </div>
    </div>
  );
};

export default ReportCard;
