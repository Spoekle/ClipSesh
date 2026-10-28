'use client';

import React from 'react';
import { ArrowLeft, Share2, Flag, Edit, Trash2 } from 'lucide-react';
import Breadcrumbs, { BreadcrumbItem } from '@/components/common/Breadcrumbs';
import { User } from '@/types/adminTypes';
import { Button } from '@/components/ui/button';

interface ClipViewHeaderProps {
  onBack: () => void;
  backTitle: string;
  breadcrumbItems: BreadcrumbItem[];
  shareUrl: string;
  onCopyShareLink: () => void;
  canReportClip: boolean;
  onReport: () => void;
  user: User | null;
  isLoading: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export const ClipViewHeader: React.FC<ClipViewHeaderProps> = ({
  onBack,
  backTitle,
  breadcrumbItems,
  shareUrl,
  onCopyShareLink,
  canReportClip,
  onReport,
  user,
  isLoading,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="border-b border-border bg-background/95 py-3 sticky top-0 z-30 backdrop-blur-md">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Back button + Breadcrumbs */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            title={backTitle}
            className="rounded-full gap-1.5"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </Button>

          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard
                .writeText(shareUrl)
                .then(() => onCopyShareLink())
                .catch((err) => console.error('Failed to copy text: ', err));
            }}
            className="rounded-full gap-1.5"
          >
            <Share2 className="size-3.5" />
            Share
          </Button>

          {canReportClip && (
            <Button
              variant="outline"
              size="sm"
              onClick={onReport}
              disabled={isLoading}
              title="Report this clip"
              className="rounded-full gap-1.5"
            >
              <Flag className="size-3.5" />
              Report
            </Button>
          )}

          {user && user.roles?.includes('admin') && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                disabled={isLoading}
                className="rounded-full gap-1.5"
              >
                <Edit className="size-3.5" />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={onDelete}
                disabled={isLoading}
                className="rounded-full gap-1.5"
              >
                <Trash2 className="size-3.5" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClipViewHeader;
