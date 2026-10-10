'use client';

import React from 'react';
import { FaArrowLeft, FaShare, FaFlag } from 'react-icons/fa';
import { AiOutlineEdit, AiOutlineDelete } from 'react-icons/ai';
import Breadcrumbs, { BreadcrumbItem } from '@/components/common/Breadcrumbs';
import { User } from '@/types/adminTypes';
import { Button } from '@/components/Button';

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
    <div className="border-b border-border bg-cc-ground/95 py-3 sticky top-0 z-30 backdrop-blur-md">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Back button + Breadcrumbs */}
        <div className="flex items-center gap-3">
          <Button
            variant="card"
            size="sm"
            pill
            onClick={onBack}
            title={backTitle}
            leftIcon={<FaArrowLeft size={10} />}
          >
            Back
          </Button>

          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="card"
            size="sm"
            pill
            onClick={() => {
              navigator.clipboard
                .writeText(shareUrl)
                .then(() => onCopyShareLink())
                .catch((err) => console.error('Failed to copy text: ', err));
            }}
            leftIcon={<FaShare size={11} />}
          >
            Share
          </Button>

          {canReportClip && (
            <Button
              variant="card"
              size="sm"
              pill
              onClick={onReport}
              disabled={isLoading}
              title="Report this clip"
              leftIcon={<FaFlag size={11} />}
            >
              Report
            </Button>
          )}

          {user && user.roles?.includes('admin') && (
            <>
              <Button
                variant="card"
                size="sm"
                pill
                onClick={onEdit}
                disabled={isLoading}
                leftIcon={<AiOutlineEdit size={13} />}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                pill
                onClick={onDelete}
                disabled={isLoading}
                leftIcon={<AiOutlineDelete size={13} />}
              >
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
