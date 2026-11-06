'use client';

import React from 'react';
import {
  MessageSquare,
  ExternalLink,
  Calendar,
  Film,
  ShieldAlert,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { Report } from '@/types/adminTypes';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ReportCardProps {
  report: Report;
  onOpenMessaging: (report: Report) => void;
}

const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'pending':
      return 'outline';
    case 'reviewed':
      return 'secondary';
    case 'resolved':
      return 'default';
    case 'dismissed':
      return 'outline';
    default:
      return 'outline';
  }
};

const getStatusBadgeStyle = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    case 'reviewed':
      return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
    case 'resolved':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    case 'dismissed':
      return 'bg-border/60 text-muted-foreground border-border';
    default:
      return 'bg-muted/30 text-muted-foreground border-border';
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

export const ReportCard: React.FC<ReportCardProps> = ({ report, onOpenMessaging }) => {
  const isClosed = report.status === 'resolved' || report.status === 'dismissed';

  return (
    <Card className="p-5 sm:p-6 bg-card border-border hover:border-muted-foreground/30 transition-colors shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
            <h3 className="font-semibold text-sm sm:text-base text-card-foreground truncate">
              {report.clipTitle}
            </h3>
            <button
              onClick={() => window.open(`/clips/${report.clipId}`, '_blank')}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
              title="View clip in new tab"
            >
              <ExternalLink className="size-3.5" />
            </button>
            <Badge
              variant={getStatusBadgeVariant(report.status)}
              className={`text-[10px] font-semibold uppercase tracking-wider ${getStatusBadgeStyle(report.status)}`}
            >
              {report.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs text-muted-foreground mb-3.5">
            <div className="flex items-center gap-2 truncate">
              <Film className="size-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">
                by <span className="text-foreground font-medium">{report.clipStreamer}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 truncate">
              <Calendar className="size-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{formatDate(report.createdAt)}</span>
            </div>
          </div>

          {/* Report Reason Box */}
          <div className="bg-background border border-border rounded-xl p-3.5 mb-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="text-amber-400 mt-0.5 shrink-0 size-3.5" />
              <div className="min-w-0">
                <span className="font-semibold text-xs text-amber-400 block">
                  Your Report:
                </span>
                <p className="text-xs text-foreground mt-1 leading-relaxed">
                  {report.reason}
                </p>
              </div>
            </div>
          </div>

          {/* Reviewed By Meta */}
          {report.reviewedBy && (
            <div className="text-[11px] text-muted-foreground mb-2.5">
              Reviewed by{' '}
              <span className="text-foreground font-medium">{report.reviewedBy}</span> on{' '}
              {formatDate(report.reviewedAt || '')}
            </div>
          )}

          {/* Admin Notes Box */}
          {report.adminNotes && (
            <div className="bg-background border border-border rounded-xl p-3.5 mb-3">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="text-sky-400 mt-0.5 shrink-0 size-3.5" />
                <div className="min-w-0">
                  <span className="font-semibold text-xs text-sky-400 block">
                    Admin Notes:
                  </span>
                  <p className="text-xs text-foreground mt-1 leading-relaxed">
                    {report.adminNotes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Closed Notice */}
          {isClosed && (
            <div className="bg-background border border-border rounded-xl p-3 flex items-start gap-2.5">
              <Eye className="text-muted-foreground mt-0.5 shrink-0 size-3.5" />
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
            variant="outline"
            size="sm"
            onClick={() => onOpenMessaging(report)}
            className="gap-1.5"
          >
            <Eye className="size-3.5" />
            View Messages
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={() => onOpenMessaging(report)}
            className="gap-1.5"
          >
            <MessageSquare className="size-3.5" />
            Messages
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ReportCard;
