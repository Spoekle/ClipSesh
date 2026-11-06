'use client';

import React from 'react';
import Link from 'next/link';
import { User, ThumbsDown, ExternalLink } from 'lucide-react';
import { Clip, Rating } from '@/types/adminTypes';
import { Card } from '@/components/ui/card';

interface DeniedClipCardProps {
  clip: Clip;
  ratingData?: Rating;
  denyThreshold: number;
}

export const DeniedClipCard: React.FC<DeniedClipCardProps> = ({
  clip,
  ratingData,
  denyThreshold,
}) => {
  const denyCount = ratingData?.ratings?.deny?.length ?? 0;
  const denyPercentage = Math.round((denyCount / (denyThreshold * 1.5)) * 100);

  return (
    <Card className="bg-background hover:bg-card border-border hover:border-border/80 rounded-xl overflow-hidden flex flex-col transition-all group shadow-xs">
      <Link
        href={`/clips/${clip._id}`}
        className="relative aspect-video bg-black/40 overflow-hidden block"
      >
        {clip.thumbnail ? (
          <img
            src={clip.thumbnail}
            alt={clip.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <video
            src={clip.url}
            className="w-full h-full object-cover"
            poster={clip.thumbnail}
          />
        )}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 pointer-events-none" />

        {/* Hover Inspect Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
          <div className="w-10 h-10 rounded-full bg-card/90 border border-border flex items-center justify-center text-foreground shadow-lg">
            <ExternalLink className="size-3.5" />
          </div>
        </div>

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <span className="bg-black/80 backdrop-blur-md border border-border text-white/90 px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1">
            <User className="size-2.5 text-muted-foreground" />
            <span>{clip.streamer}</span>
          </span>

          <span className="bg-black/80 backdrop-blur-md border border-rose-500/40 text-rose-400 px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5 shadow-xs font-mono">
            <ThumbsDown className="size-3" />
            <span>{denyCount} rejected</span>
          </span>
        </div>
      </Link>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link
            href={`/clips/${clip._id}`}
            className="font-semibold text-xs text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors block"
            title={clip.title}
          >
            {clip.title}
          </Link>

          <div className="flex justify-between text-[11px] text-muted-foreground mb-2 font-mono">
            <span>Season: {clip.season ?? 'N/A'} {clip.year ?? ''}</span>
            <span>{clip.createdAt ? new Date(clip.createdAt).toLocaleDateString() : ''}</span>
          </div>
        </div>

        {/* Rejection progress meter */}
        <div className="pt-2 border-t border-border/80 space-y-1.5">
          <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
            <span>Rejection Threshold</span>
            <span className="text-rose-400 font-semibold font-mono">
              {denyCount} / {denyThreshold} votes
            </span>
          </div>

          <div className="w-full bg-card rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-rose-500 to-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, denyPercentage)}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DeniedClipCard;
