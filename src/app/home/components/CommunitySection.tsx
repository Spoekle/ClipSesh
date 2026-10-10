'use client';

import React from 'react';
import Link from 'next/link';
import { FaGamepad, FaThumbsUp, FaYoutube, FaArrowRight, FaDiscord } from 'react-icons/fa';

import { Button } from '@/components/common/Button';

export const CommunitySection: React.FC = () => {
  return (
    <>
      {/* How It Works Section: Pipeline */}
      <section className="py-14 border-t border-border bg-cc-ground">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
          <div className="max-w-2xl mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-cc-text tracking-tight mb-2">
              From Submissions to Highlights
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              How clips submitted on ClipSesh are reviewed, voted on, and edited into official Cube Community highlight videos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="bg-cc-card rounded-xl p-5 border border-border flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cc-ground border border-border text-muted-foreground">
                  Step 01
                </span>
                <FaGamepad className="text-primary" size={16} />
              </div>
              <h3 className="text-sm font-semibold text-cc-text mb-1.5">
                Community Submissions
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Players submit clips directly on ClipSesh or post them in the Cube Community Discord clip channel for automated indexing.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-cc-card rounded-xl p-5 border border-border flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cc-ground border border-border text-muted-foreground">
                  Step 02
                </span>
                <FaThumbsUp className="text-primary" size={15} />
              </div>
              <h3 className="text-sm font-semibold text-cc-text mb-1.5">
                Voting & Review Queue
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Community members can upvote clips, while Clip Team reviews the quality and makes the final selection.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-cc-card rounded-xl p-5 border border-border flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-cc-ground border border-border text-muted-foreground">
                  Step 03
                </span>
                <FaYoutube className="text-primary" size={16} />
              </div>
              <h3 className="text-sm font-semibold text-cc-text mb-1.5">
                Official YouTube Highlight Video
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                At the end of each season, the highest rated plays are edited into full compilation videos with player credits on YouTube.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Banner */}
      <section className="py-12 border-t border-border bg-cc-ground">
        <div className="max-w-300 mx-auto px-4 sm:px-8">
          <div className="bg-cc-card rounded-xl border border-border p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-bold text-cc-text mb-1">
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
                rightIcon={<FaArrowRight size={11} />}
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
          </div>
        </div>
      </section>
    </>
  );
};

export default CommunitySection;
