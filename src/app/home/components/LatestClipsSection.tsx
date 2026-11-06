import React from 'react';
import Link from 'next/link';
import { Flame, ArrowRight } from 'lucide-react';
import { Clip } from '@/types/adminTypes';
import { cn } from '@/lib/utils';
import ClipTile from './ClipTile';

interface LatestClipsSectionProps {
  latestClips: Clip[];
  loadingClips: boolean;
}

/** First tile spans a 2×2 block; the remaining four fill the other half. */
const tileClassName = (index: number) => (index === 0 ? 'sm:col-span-2 lg:row-span-2' : '');

export const LatestClipsSection: React.FC<LatestClipsSectionProps> = ({ latestClips, loadingClips }) => {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
        <div className="mb-8 flex scroll-reveal flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground uppercase sm:text-5xl">
              Latest <span className="text-primary">highlights</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">The newest Beat Saber clips submitted by the community</p>
          </div>

          <Link
            href="/clips"
            className="group flex items-center gap-1.5 self-start rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground sm:self-auto"
          >
            View all clips
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {loadingClips ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className={cn('aspect-video animate-pulse rounded-2xl border border-border bg-card', tileClassName(i))}
              />
            ))}
          </div>
        ) : latestClips.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {latestClips.map((clip, i) => (
              <div key={clip._id} className={cn('scroll-reveal', tileClassName(i))}>
                <ClipTile clip={clip} featured={i === 0} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 py-14 text-center">
            <p className="text-sm text-muted-foreground">No clips available currently.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default LatestClipsSection;
