import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { DiscordIcon } from '@/components/BrandIcons';
import { Button } from '@/components/ui/button';

/** Closing call-to-action panel linking to clips and the Discord. */
export const JoinBanner: React.FC = () => (
  <section className="px-4 pt-8 pb-20 sm:px-8 sm:pb-28">
    <div className="mx-auto max-w-[1200px]">
      <div className="overflow-hidden rounded-3xl border border-border bg-linear-to-br from-primary/25 via-card to-sky-500/20">
        <div className="flex flex-col items-center gap-8 px-6 py-14 text-center sm:px-12 sm:py-20">
          <div>
            <h2 className="text-3xl leading-[0.95] font-black tracking-tight text-foreground uppercase sm:text-5xl md:text-6xl">
              Have a clip
              <br />
              worth <span className="text-primary">showing?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground sm:text-base">
              Submit your clips, browse current seasonal entries, or join the discussion with other Beat Saber players.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              nativeButton={false}
              render={<Link href="/clips" />}
              size="xl"
              className="rounded-full shadow-[0_8px_32px_-8px_var(--primary)]"
            >
              Explore Clips
              <ArrowRight data-icon="inline-end" className="size-4" />
            </Button>
            <Button
              nativeButton={false}
              render={<a href="https://discord.gg/dwe8mbC" target="_blank" rel="noopener noreferrer" />}
              variant="card"
              size="xl"
              className="rounded-full"
            >
              <DiscordIcon data-icon="inline-start" size={16} className="text-[#5865F2]" />
              Discord
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default JoinBanner;
