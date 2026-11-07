import React from 'react';
import Link from 'next/link';
import { Eye, ThumbsUp, MessageSquare, Play } from 'lucide-react';
import { format } from 'timeago.js';
import { Clip } from '@/types/adminTypes';
import { cn } from '@/lib/utils';

interface ClipTileProps {
  clip: Clip;
  featured?: boolean;
}

/** Thumbnail-first clip card for the home page bento grid. */
export const ClipTile: React.FC<ClipTileProps> = ({ clip, featured }) => (
  <Link
    href={`/clips/${clip._id}`}
    className={cn(
      'group relative flex h-full flex-col justify-end overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 select-none hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_20px_50px_-15px_color-mix(in_oklch,var(--primary)_50%,transparent)] focus-visible:outline-2 focus-visible:outline-primary',
      featured ? 'aspect-video lg:aspect-auto' : 'aspect-video'
    )}
  >
    {clip.thumbnail ? (
      <img
        src={clip.thumbnail}
        alt=""
        loading="lazy"
        className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    ) : (
      <div className="absolute inset-0 bg-linear-to-br from-primary/25 via-card to-sky-500/15" />
    )}
    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-black/10" />
    <div className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-primary shadow-[0_0_12px_var(--primary)] transition-transform duration-500 group-hover:scale-x-100" />

    <div className="absolute top-3 left-3 rounded-full border border-white/10 bg-black/70 px-2.5 py-0.5 text-[10px] font-medium text-foreground backdrop-blur-md">
      {clip.streamer}
    </div>

    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
      <span
        className={cn(
          'flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_30px_var(--primary)]',
          featured ? 'size-16' : 'size-11'
        )}
      >
        <Play className={cn('ml-0.5 fill-current', featured ? 'size-6' : 'size-4')} />
      </span>
    </div>

    <div className={cn('relative', featured ? 'p-5 sm:p-6' : 'p-3.5')}>
      <h3
        className={cn('line-clamp-2 leading-tight font-bold text-white', featured ? 'text-lg sm:text-2xl' : 'text-sm')}
      >
        {clip.title}
      </h3>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-300">
        <span className="flex items-center gap-1">
          <Eye className="size-3" />
          {clip.views || 0}
        </span>
        <span className="flex items-center gap-1">
          <ThumbsUp className="size-3" />
          {clip.upvotes}
        </span>
        {clip.comments && clip.comments.length > 0 && (
          <span className="flex items-center gap-1">
            <MessageSquare className="size-3" />
            {clip.comments.length}
          </span>
        )}
        <span className="text-neutral-400" suppressHydrationWarning>
          {format(new Date(clip.createdAt))}
        </span>
      </div>
    </div>
  </Link>
);

export default ClipTile;
