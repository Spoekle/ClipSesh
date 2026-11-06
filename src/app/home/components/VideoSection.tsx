'use client';

import React from 'react';
import { Play, Film } from 'lucide-react';
import { YoutubeIcon } from '@/components/BrandIcons';

interface VideoSectionProps {
  showVideo: boolean;
  setShowVideo: (show: boolean) => void;
  embedUrl: string | null;
  thumbnailUrl: string | null;
}

export const VideoSection: React.FC<VideoSectionProps> = ({ showVideo, setShowVideo, embedUrl, thumbnailUrl }) => {
  return (
    <div
      className="lg:col-span-5 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:slide-in-from-bottom-6 motion-safe:fill-mode-both motion-safe:duration-700 motion-safe:ease-out"
      style={{ animationDelay: '250ms' }}
    >
      <div className="rounded-2xl bg-primary/70 p-px shadow-[0_30px_80px_-20px_color-mix(in_oklch,var(--primary)_45%,transparent)]">
        <div className="overflow-hidden rounded-2xl bg-card/95 p-2.5 backdrop-blur-xl">
          <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-background">
            {showVideo && embedUrl ? (
              <iframe
                className="h-full w-full"
                src={embedUrl}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Latest Highlight Video"
              />
            ) : (
              <button
                type="button"
                className="group relative h-full w-full bg-cover bg-center"
                style={{
                  backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : undefined,
                }}
                onClick={() => setShowVideo(true)}
                aria-label="Play latest highlights video"
              >
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 transition-colors group-hover:bg-black/25">
                  <div className="relative flex size-16 items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-primary/40 motion-safe:animate-ping" />
                    <span className="relative flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_40px_var(--primary)] transition-transform duration-200 group-hover:scale-110">
                      <Play className="ml-0.5 size-6 fill-current" />
                    </span>
                  </div>
                </div>
                <div className="absolute right-2.5 bottom-2.5 left-2.5 flex items-center justify-between rounded-lg border border-white/10 bg-black/75 px-3 py-1.5 text-xs text-foreground backdrop-blur-xs">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Film className="size-3.5 text-primary" /> Latest Highlights Video
                  </span>
                  <span className="text-[11px] text-neutral-300">Click to play</span>
                </div>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 p-3.5">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Official Season Highlights Video</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Curated from the highest-rated community clips</p>
            </div>
            <a
              href="https://www.youtube.com/@CubeCommunity"
              target="_blank"
              rel="noopener noreferrer"
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <YoutubeIcon size={13} className="text-primary" />
              <span>Subscribe</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoSection;
