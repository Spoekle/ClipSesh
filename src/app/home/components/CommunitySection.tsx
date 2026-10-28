'use client';

import React from 'react';
import { Gamepad2, ThumbsUp, Video, ArrowRight } from 'lucide-react';
import { FaDiscord } from 'react-icons/fa';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/ui/card';

export const CommunitySection: React.FC = () => {
  return (
    <>
      {/* How It Works Section: Pipeline */}
      <section className="py-14 border-t border-border bg-background">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <div className="max-w-2xl mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight mb-2">
              From Submissions to Highlights
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              How clips submitted on ClipSesh are reviewed, voted on, and edited into official Cube Community highlight videos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <Card className="rounded-xl p-5 border border-border flex flex-col bg-card shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
                  Step 01
                </span>
                <Gamepad2 className="text-primary size-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                Community Submissions
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Players submit clips directly on ClipSesh or post them in the Cube Community Discord clip channel for automated indexing.
              </p>
            </Card>

            {/* Step 2 */}
            <Card className="rounded-xl p-5 border border-border flex flex-col bg-card shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
                  Step 02
                </span>
                <ThumbsUp className="text-primary size-4.5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                Voting & Review Queue
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Community members can upvote clips, while Clip Team reviews the quality and makes the final selection.
              </p>
            </Card>

            {/* Step 3 */}
            <Card className="rounded-xl p-5 border border-border flex flex-col bg-card shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
                  Step 03
                </span>
                <Video className="text-primary size-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                Official YouTube Highlight Video
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                At the end of each season, the highest rated plays are edited into full compilation videos with player credits on YouTube.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Community Banner */}
      <section className="py-12 border-t border-border bg-background">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <Card className="bg-card rounded-2xl border border-border p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-bold text-foreground mb-1">
                Have a clip worth showing?
              </h3>
              <p className="text-xs text-muted-foreground max-w-lg">
                Submit your clips, browse current seasonal entries, or join discussion with other Beat Saber players.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                href="/clips"
                variant="primary"
                size="sm"
                pill
                rightIcon={<ArrowRight className="size-3.5" />}
              >
                Explore Clips
              </Button>
              <Button
                href="https://discord.gg/dwe8mbC"
                target="_blank"
                variant="card"
                size="sm"
                pill
                leftIcon={<FaDiscord size={14} className="text-[#5865F2]" />}
              >
                Discord
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
};

export default CommunitySection;
