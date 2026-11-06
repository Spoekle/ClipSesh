import React from 'react';
import { Gamepad2, ThumbsUp, Video, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PipelineStep {
  icon: LucideIcon;
  title: string;
  body: string;
  accent: string;
}

const STEPS: PipelineStep[] = [
  {
    icon: Gamepad2,
    title: 'Community submissions',
    body: 'Players submit clips directly on ClipSesh or post them in the Cube Community Discord clip channel for automated indexing.',
    accent: 'bg-primary text-primary-foreground shadow-[0_0_30px_-4px_var(--primary)]',
  },
  {
    icon: ThumbsUp,
    title: 'Voting & review queue',
    body: 'Community members can upvote clips, while the Clip Team reviews the quality and makes the final selection.',
    accent: 'bg-sky-500 text-white shadow-[0_0_30px_-4px_var(--color-sky-500)]',
  },
  {
    icon: Video,
    title: 'Official YouTube highlight video',
    body: 'At the end of each season, the highest rated plays are edited into full compilation videos with player credits on YouTube.',
    accent: 'bg-primary text-primary-foreground shadow-[0_0_30px_-4px_var(--primary)]',
  },
];

/** "How it works" steps along a rail that fills as the section scrolls past. */
export const PipelineSection: React.FC = () => (
  <section className="relative py-16 sm:py-24">
    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-size-[48px_48px] opacity-30 mask-[radial-gradient(ellipse_at_center,black_10%,transparent_70%)]" />

    <div className="relative mx-auto grid max-w-[1200px] gap-12 px-4 sm:px-8 lg:grid-cols-[2fr_3fr] lg:gap-16">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <span className="text-[11px] font-bold tracking-[0.2em] text-primary uppercase">How it works</span>
        <h2 className="mt-3 text-3xl leading-[0.95] font-black tracking-tight text-foreground uppercase sm:text-5xl">
          From submission
          <br />
          to <span className="text-primary">highlight</span>
        </h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
          How clips submitted on ClipSesh are reviewed, voted on, and edited into official Cube Community highlight
          videos.
        </p>
      </div>

      <ol className="relative flex flex-col gap-6 pl-14 sm:pl-20">
        <div className="absolute top-2 bottom-2 left-[19px] w-0.5 rounded-full bg-border sm:left-[27px]" />
        <div
          aria-hidden
          className="absolute top-2 bottom-2 left-[19px] w-0.5 scroll-fill-y rounded-full bg-linear-to-b from-primary via-sky-400 to-primary shadow-[0_0_14px_var(--primary)] sm:left-[27px]"
        />

        {STEPS.map(({ icon: Icon, title, body, accent }, i) => (
          <li key={title} className="relative scroll-reveal-x">
            <span
              className={cn(
                'absolute top-5 -left-14 flex scroll-pop size-10 items-center justify-center rounded-xl sm:-left-20 sm:size-14 sm:rounded-2xl',
                accent
              )}
            >
              <Icon className="size-5 sm:size-6" />
            </span>

            <div className="group relative overflow-hidden rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-sm transition-colors hover:border-primary/40 sm:p-7">
              <span className="pointer-events-none absolute -top-6 -right-2 font-mono text-[7rem] leading-none font-black text-transparent opacity-40 transition-opacity [-webkit-text-stroke:1.5px_var(--border)] group-hover:opacity-100 group-hover:[-webkit-text-stroke:1.5px_var(--primary)]">
                0{i + 1}
              </span>
              <h3 className="relative text-lg font-bold text-foreground">{title}</h3>
              <p className="relative mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

export default PipelineSection;
