'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { DiscordIcon, YoutubeIcon } from '@/components/BrandIcons';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  currentSeason: { season: string; year: number };
  seasonRemaining: { daysRemaining: number };
  clipCountDisplay: string;
  loadingArchive: boolean;
  totalClips: number | null;
}

const HEADLINE_LINES = [
  { text: 'The hub for', className: 'text-foreground' },
  { text: 'Beat Saber', className: 'text-foreground' },
];

const ENTER = 'motion-safe:animate-in motion-safe:fill-mode-both motion-safe:ease-out';

export const HeroSection: React.FC<HeroSectionProps> = ({
  currentSeason,
  seasonRemaining,
  clipCountDisplay,
  loadingArchive,
  totalClips,
}) => {

  return (
    <div className="text-center lg:col-span-7 lg:text-left">
      <div className={`${ENTER} fade-in slide-in-from-bottom-2 duration-500`}>
        <Link
          href="/clips"
          className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold tracking-[0.2em] text-primary uppercase backdrop-blur-sm transition-colors hover:bg-primary/20"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full rounded-full bg-primary opacity-75 motion-safe:animate-ping" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          {currentSeason.season} {currentSeason.year} · {seasonRemaining.daysRemaining}d left
        </Link>
      </div>

      <h1 className="mt-5 text-5xl leading-[0.92] font-black tracking-tight uppercase sm:text-6xl md:text-7xl">
        {HEADLINE_LINES.map(({ text, className }, i) => (
          <span key={text} className="block overflow-hidden pb-1">
            <span
              className={`block ${className} ${ENTER} slide-in-from-bottom-[110%] duration-700`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              {text}
            </span>
          </span>
        ))}
        <span className="relative inline-block overflow-hidden pb-3">
          <span
            className={`block text-primary drop-shadow-[0_0_28px_color-mix(in_oklch,var(--primary)_55%,transparent)] ${ENTER} slide-in-from-bottom-[110%] duration-700`}
            style={{ animationDelay: '160ms' }}
          >
            clips.
          </span>
          <span
            aria-hidden
            className="absolute bottom-0 left-0 h-1.5 w-full origin-left rounded-full bg-primary shadow-[0_0_18px_var(--primary)] motion-safe:animate-saber-draw"
          />
        </span>
      </h1>

      <div className={`${ENTER} fade-in slide-in-from-bottom-3 duration-700`} style={{ animationDelay: '350ms' }}>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base lg:mx-0">
          Watch Beat Saber clips submitted by players worldwide. Rate clips, comment on them and help decide what goes
          into the official Cube Community seasonal highlights.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
          <Button
            nativeButton={false}
            render={<Link href="/clips" />}
            size="xl"
            className="rounded-full shadow-[0_8px_32px_-8px_var(--primary)] hover:shadow-[0_8px_40px_-4px_var(--primary)]"
          >
            Browse Clips
            <ArrowRight
              data-icon="inline-end"
              className="size-4 transition-transform group-hover/button:translate-x-0.5"
            />
          </Button>
          <Button
            nativeButton={false}
            render={<a href="https://discord.gg/dwe8mbC" target="_blank" rel="noopener noreferrer" />}
            variant="card"
            size="xl"
            className="rounded-full bg-card/70 backdrop-blur-md"
          >
            <DiscordIcon data-icon="inline-start" size={16} className="text-[#5865F2]" />
            Join Discord
          </Button>
          <Button
            nativeButton={false}
            render={<a href="https://www.youtube.com/@CubeCommunity" target="_blank" rel="noopener noreferrer" />}
            variant="card"
            size="xl"
            className="rounded-full bg-card/70 backdrop-blur-md"
          >
            <YoutubeIcon data-icon="inline-start" size={16} className="text-primary" />
            YouTube
          </Button>
        </div>

        <div className="mx-auto mt-10 grid max-w-md grid-cols-3 gap-px overflow-hidden rounded-2xl border border-border bg-border text-left lg:mx-0">
          <Link href="/archive" className="group bg-card/80 px-4 py-3 backdrop-blur-md" title="Explore clip archives">
            <div className="text-xl font-bold text-foreground tabular-nums transition-colors group-hover:text-primary sm:text-2xl">
              {loadingArchive && !totalClips ? (
                <span className="inline-block h-7 w-16 animate-pulse rounded bg-secondary align-middle" />
              ) : (
                clipCountDisplay
              )}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">Total clips</div>
          </Link>
          <Link href="/clips" className="group bg-card/80 px-4 py-3 backdrop-blur-md">
            <div className="text-xl font-bold text-foreground capitalize transition-colors group-hover:text-primary sm:text-2xl">
              {currentSeason.season}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              <span className="font-semibold text-amber-400">{seasonRemaining.daysRemaining}d</span> remaining
            </div>
          </Link>
          <div className="bg-card/80 px-4 py-3 backdrop-blur-md">
            <div className="text-xl font-bold text-foreground sm:text-2xl">Official</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">Cube Community</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
