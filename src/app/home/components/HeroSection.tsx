'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaArrowRight, FaDiscord, FaYoutube } from 'react-icons/fa';

import { Button } from '@/components/common/Button';

interface HeroSectionProps {
  currentSeason: { season: string; year: number };
  seasonRemaining: { daysRemaining: number };
  clipCountDisplay: string;
  loadingArchive: boolean;
  totalClips: number | null;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  currentSeason,
  seasonRemaining,
  clipCountDisplay,
  loadingArchive,
  totalClips,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className="lg:col-span-7 text-center lg:text-left"
    >

      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-cc-text leading-[1.12] mb-4">
        The hub for <span className="text-primary">Beat Saber clips.</span>
      </h1>

      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-7 max-w-xl mx-auto lg:mx-0">
        Watch Beat Saber clips submitted by players worldwide. Rate clips,
        comment on them and help decide what goes into the official Cube Community seasonal highlights.
      </p>

      {/* Main Action Buttons */}
      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-8">
        <Button
          href="/clips"
          variant="primary"
          size="lg"
          pill
          rightIcon={<FaArrowRight size={12} />}
        >
          Browse Clips
        </Button>

        <Button
          href="https://discord.gg/dwe8mbC"
          target="_blank"
          variant="card"
          size="lg"
          pill
          leftIcon={<FaDiscord size={16} className="text-[#5865F2]" />}
        >
          Join Discord
        </Button>

        <Button
          href="https://www.youtube.com/@CubeCommunity"
          target="_blank"
          variant="card"
          size="lg"
          pill
          leftIcon={<FaYoutube size={16} className="text-primary" />}
        >
          YouTube
        </Button>
      </div>

      {/* Quick Metrics Strip */}
      <div className="pt-6 border-t border-border grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0 text-left">
        <Link href="/archive" className="group block" title="Explore clip archives">
          <div className="text-xl sm:text-2xl font-bold text-cc-text group-hover:text-primary transition-colors">
            {loadingArchive && !totalClips ? (
              <span className="inline-block w-16 h-7 bg-cc-card rounded animate-pulse align-middle" />
            ) : (
              clipCountDisplay
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 group-hover:text-cc-text transition-colors">
            Total Clips
          </div>
        </Link>
        <Link
          href={`/archive?season=${currentSeason.season}&year=${currentSeason.year}`}
          className="group block"
          title={`Explore ${currentSeason.season} ${currentSeason.year} clips`}
        >
          <div className="text-xl sm:text-2xl font-bold text-cc-text capitalize group-hover:text-primary transition-colors">
            {currentSeason.season}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 group-hover:text-cc-text transition-colors">
            <span className="text-amber-400 font-semibold">
              {seasonRemaining.daysRemaining}d
            </span>{' '}
            remaining
          </div>
        </Link>
        <div>
          <div className="text-xl sm:text-2xl font-bold text-cc-text">Cube Community</div>
          <div className="text-xs text-muted-foreground mt-0.5">Official Highlight Videos</div>
        </div>
      </div>
    </motion.div>
  );
};

export default HeroSection;
