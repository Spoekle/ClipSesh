'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FaThumbsUp,
  FaThumbsDown,
  FaShare,
  FaLink,
  FaEye,
  FaRegCalendarAlt,
} from 'react-icons/fa';
import { format } from 'timeago.js';
import { Clip } from '@/types/adminTypes';
import { Button } from '@/components/Button';

interface ClipDetailsProps {
  clipData: Clip;
  userVote: string | null;
  onUpvote: () => void;
  onDownvote: () => void;
  shareUrl: string;
  onCopyShareLink: () => void;
  isLoading: boolean;
}

export const ClipDetails: React.FC<ClipDetailsProps> = ({
  clipData,
  userVote,
  onUpvote,
  onDownvote,
  shareUrl,
  onCopyShareLink,
  isLoading,
}) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false);

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-cc-text tracking-tight leading-snug">
        {clipData.title}
      </h1>

      {/* Streamer Channel Row + Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-border">
        {/* Left: Streamer info */}
        <div className="flex items-center gap-3">
          <div>
            <Link
              href={`/clips?streamer=${encodeURIComponent(clipData.streamer)}`}
              className="font-bold text-cc-text text-base hover:text-white transition-colors block leading-tight"
            >
              {clipData.streamer}
            </Link>
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              {clipData.submitter !== 'Legacy(no data)' && (
                <span>
                  submitted by <span className="text-neutral-300 font-medium">{clipData.submitter}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Segmented Like / Dislike Pill */}
          <div className="flex items-center bg-cc-card border border-border rounded-full overflow-hidden shadow-xs">
            <button
              onClick={onUpvote}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                userVote === 'upvote'
                  ? 'bg-primary/20 text-primary'
                  : 'text-cc-text hover:bg-border/60'
              }`}
              title={userVote === 'upvote' ? 'Remove upvote' : 'Upvote'}
            >
              <FaThumbsUp
                size={12}
                className={userVote === 'upvote' ? 'text-primary' : 'text-muted-foreground'}
              />
              <span>{clipData.upvotes}</span>
            </button>
            <div className="w-px h-4 bg-border" />
            <button
              onClick={onDownvote}
              disabled={isLoading}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                userVote === 'downvote'
                  ? 'bg-primary/20 text-primary'
                  : 'text-cc-text hover:bg-border/60'
              }`}
              title={userVote === 'downvote' ? 'Remove downvote' : 'Downvote'}
            >
              <FaThumbsDown
                size={12}
                className={userVote === 'downvote' ? 'text-primary' : 'text-muted-foreground'}
              />
              {clipData.downvotes > 0 && <span>{clipData.downvotes}</span>}
            </button>
          </div>

          {/* Share Pill */}
          <Button
            variant="card"
            size="md"
            pill
            onClick={() => {
              navigator.clipboard.writeText(shareUrl).then(onCopyShareLink);
            }}
            leftIcon={<FaShare size={11} className="text-muted-foreground" />}
          >
            Share
          </Button>

          {/* Source / Link Pill */}
          <Button
            variant="card"
            size="md"
            pill
            href={clipData.link}
            target="_blank"
            rel="noreferrer"
            title="View original clip source"
            leftIcon={<FaLink size={11} className="text-muted-foreground" />}
          >
            Source
          </Button>
        </div>
      </div>

      {/* Expandable Description Box */}
      <div
        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
        className="mt-4 bg-cc-card hover:bg-border/30 transition-colors rounded-xl p-4 border border-border cursor-pointer"
      >
        <div className="flex flex-wrap items-center gap-2 font-semibold text-xs text-cc-text mb-1">
          <span className="flex items-center gap-1.5 text-cc-text">
            <FaEye size={12} className="text-muted-foreground" />
            <span>{clipData.views || 0} views</span>
          </span>
          <span>•</span>
          <span>{clipData.upvotes + clipData.downvotes} total votes</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <FaRegCalendarAlt size={10} />
            {new Date(clipData.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}{' '}
            ({format(new Date(clipData.createdAt))})
          </span>
          {clipData.comments && clipData.comments.length > 0 && (
            <>
              <span>•</span>
              <span className="text-muted-foreground">{clipData.comments.length} comments</span>
            </>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1 mt-2">
          <p>
            Streamer: <span className="text-cc-text font-medium">{clipData.streamer}</span>
          </p>
          {clipData.submitter && (
            <p>
              Submitted by:{' '}
              <span className="text-cc-text font-medium">{clipData.submitter}</span>
            </p>
          )}
          {isDescriptionExpanded && (
            <div className="pt-2 mt-2 border-t border-border text-[11px] text-muted-foreground space-y-1">
              <p>
                Original Link:{' '}
                <a
                  href={clipData.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  {clipData.link}
                </a>
              </p>
              <p>
                Clip ID: <span className="font-mono text-muted-foreground">{clipData._id}</span>
              </p>
            </div>
          )}
        </div>
        <span className="text-[11px] font-semibold text-cc-text mt-2 inline-block">
          {isDescriptionExpanded ? 'Show less' : '...more'}
        </span>
      </div>
    </div>
  );
};

export default ClipDetails;
