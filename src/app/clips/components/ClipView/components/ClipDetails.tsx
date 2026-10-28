'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  Link2,
  Eye,
  Calendar,
} from 'lucide-react';
import { format } from 'timeago.js';
import { Clip } from '@/types/adminTypes';
import { Button } from '@/components/Button';
import { Card } from '@/components/ui/card';

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
      <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-snug">
        {clipData.title}
      </h1>

      {/* Streamer Channel Row + Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-border">
        {/* Left: Streamer info */}
        <div className="flex items-center gap-3">
          <div>
            <Link
              href={`/clips?streamer=${encodeURIComponent(clipData.streamer)}`}
              className="font-bold text-foreground text-base hover:text-primary transition-colors block leading-tight"
            >
              {clipData.streamer}
            </Link>
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              {clipData.submitter !== 'Legacy(no data)' && (
                <span>
                  submitted by <span className="text-foreground font-medium">{clipData.submitter}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Segmented Like / Dislike Pill */}
          <div className="flex items-center bg-card border border-border rounded-full overflow-hidden shadow-xs">
            <button
              onClick={onUpvote}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                userVote === 'upvote'
                  ? 'bg-primary/20 text-primary'
                  : 'text-foreground hover:bg-secondary'
              }`}
              title={userVote === 'upvote' ? 'Remove upvote' : 'Upvote'}
            >
              <ThumbsUp
                className={`size-3.5 ${userVote === 'upvote' ? 'text-primary' : 'text-muted-foreground'}`}
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
                  : 'text-foreground hover:bg-secondary'
              }`}
              title={userVote === 'downvote' ? 'Remove downvote' : 'Downvote'}
            >
              <ThumbsDown
                className={`size-3.5 ${userVote === 'downvote' ? 'text-primary' : 'text-muted-foreground'}`}
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
            leftIcon={<Share2 className="size-3.5 text-muted-foreground" />}
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
            leftIcon={<Link2 className="size-3.5 text-muted-foreground" />}
          >
            Source
          </Button>
        </div>
      </div>

      {/* Expandable Description Box */}
      <Card
        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
        className="mt-4 bg-card hover:bg-secondary/40 transition-colors rounded-xl p-4 border border-border cursor-pointer shadow-xs"
      >
        <div className="flex flex-wrap items-center gap-2 font-semibold text-xs text-foreground mb-1">
          <span className="flex items-center gap-1.5 text-foreground">
            <Eye className="size-3.5 text-muted-foreground" />
            <span>{clipData.views || 0} views</span>
          </span>
          <span>•</span>
          <span>{clipData.upvotes + clipData.downvotes} total votes</span>
          <span>•</span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="size-3" />
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
            Streamer: <span className="text-foreground font-medium">{clipData.streamer}</span>
          </p>
          {clipData.submitter && (
            <p>
              Submitted by:{' '}
              <span className="text-foreground font-medium">{clipData.submitter}</span>
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
        <span className="text-[11px] font-semibold text-foreground mt-2 inline-block">
          {isDescriptionExpanded ? 'Show less' : '...more'}
        </span>
      </Card>
    </div>
  );
};

export default ClipDetails;
