'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
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
} from 'react-icons/fa';
import { Report } from '@/types/adminTypes';

interface ReportCardItemProps {
  report: Report;
  isHighlighted: boolean;
  onStatusChange: (reportId: string, status: string) => Promise<void>;
  onOpenMessaging: (report: Report) => void;
  onOpenNotes: (report: Report) => void;
  onDeleteClick: (reportId: string) => void;
  isUpdating: boolean;
}

export const ReportCardItem: React.FC<ReportCardItemProps> = ({
  report,
  isHighlighted,
  onStatusChange,
  onOpenMessaging,
  onOpenNotes,
  onDeleteClick,
  isUpdating,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      case 'reviewed':
        return 'bg-sky-500/15 text-sky-400 border border-sky-500/30';
      case 'resolved':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      case 'dismissed':
        return 'bg-neutral-500/20 text-muted-foreground border border-neutral-500/30';
      default:
        return 'bg-cc-ground text-muted-foreground border border-border';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-cc-card rounded-2xl border p-5 transition-all ${
        isHighlighted
          ? 'border-sky-400 ring-1 ring-sky-400/40'
          : 'border-border hover:border-border/80'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2.5 mb-2">
            <h3 className="font-semibold text-sm sm:text-base text-white truncate">
              {report.clipTitle}
            </h3>
            <button
              type="button"
              onClick={() => window.open(`/clips/${report.clipId}`, '_blank')}
              className="text-muted-foreground hover:text-white p-1 rounded transition-colors cursor-pointer"
              title="View clip in new tab"
            >
              <FaExternalLinkAlt size={12} />
            </button>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getStatusBadge(
                report.status
              )}`}
            >
              {report.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs text-muted-foreground mb-3">
            <div className="flex items-center space-x-2 truncate">
              <FaFilm className="text-muted-foreground shrink-0" />
              <span className="truncate">by {report.clipStreamer}</span>
            </div>
            <div className="flex items-center space-x-2 truncate">
              <FaUser className="text-muted-foreground shrink-0" />
              <span className="truncate">submitted by {report.clipSubmitter}</span>
            </div>
            <div className="flex items-center space-x-2 truncate">
              <FaCalendar className="text-muted-foreground shrink-0" />
              <span className="truncate">{formatDate(report.createdAt)}</span>
            </div>
          </div>

          {/* Report Reason Box */}
          <div className="bg-cc-ground border border-border rounded-xl p-3 mb-3">
            <div className="flex items-start space-x-2.5">
              <FaExclamationTriangle className="text-amber-400 mt-0.5 shrink-0" size={13} />
              <div className="min-w-0">
                <span className="text-xs font-semibold text-amber-400">
                  Reported by {report.reporterUsername}:
                </span>
                <p className="text-xs text-white mt-1 leading-relaxed">{report.reason}</p>
              </div>
            </div>
          </div>

          {report.reviewedBy && (
            <div className="text-[11px] text-muted-foreground">
              Reviewed by{' '}
              <span className="text-white/80 font-medium">{report.reviewedBy}</span> on{' '}
              {report.reviewedAt ? formatDate(report.reviewedAt) : ''}
            </div>
          )}

          {report.adminNotes && (
            <div className="mt-2 text-[11px] text-muted-foreground bg-cc-ground border border-border rounded-lg p-2.5">
              <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px] block mb-1">
                Admin Notes:
              </span>
              {report.adminNotes}
            </div>
          )}
        </div>
      </div>

      {/* Actions Footer */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3.5 border-t border-border">
        <div className="flex flex-wrap items-center gap-1.5">
          {report.status === 'pending' && (
            <>
              <button
                type="button"
                onClick={() => onStatusChange(report._id, 'reviewed')}
                className="flex items-center space-x-1.5 bg-cc-ground hover:bg-border/50 border border-border text-muted-foreground hover:text-white px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
                disabled={isUpdating}
              >
                <FaEye size={11} />
                <span>Mark Reviewed</span>
              </button>
              <button
                type="button"
                onClick={() => onStatusChange(report._id, 'resolved')}
                className="flex items-center space-x-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
                disabled={isUpdating}
              >
                <FaCheck size={11} />
                <span>Resolve</span>
              </button>
              <button
                type="button"
                onClick={() => onStatusChange(report._id, 'dismissed')}
                className="flex items-center space-x-1.5 bg-cc-ground hover:bg-border/50 border border-border text-muted-foreground hover:text-white px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
                disabled={isUpdating}
              >
                <FaBan size={11} />
                <span>Dismiss</span>
              </button>
            </>
          )}

          {report.status !== 'pending' && (
            <button
              type="button"
              onClick={() => onStatusChange(report._id, 'pending')}
              className="flex items-center space-x-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
              disabled={isUpdating}
            >
              <FaTimes size={11} />
              <span>Mark Pending</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => onOpenMessaging(report)}
            className="flex items-center space-x-1.5 bg-cc-ground hover:bg-border/50 border border-border text-muted-foreground hover:text-white px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
            title="Message reporter"
          >
            <FaComments size={11} />
            <span>Message</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenNotes(report)}
            className="flex items-center space-x-1.5 bg-cc-ground hover:bg-border/50 border border-border text-muted-foreground hover:text-white px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer"
          >
            <span>{report.adminNotes ? 'Edit Notes' : 'Add Notes'}</span>
          </button>

          <button
            type="button"
            onClick={() => onDeleteClick(report._id)}
            className="p-1.5 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
            title="Delete report"
          >
            <FaTrash size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ReportCardItem;
