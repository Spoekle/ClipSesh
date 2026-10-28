'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Sprout,
  Sun,
  Leaf,
  Snowflake,
  Archive,
  Film,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { ArchiveSeasonSection } from '@/types/clipTypes';
import { getSeasonDateRange } from '@/lib/seasonHelpers';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SeasonSectionCardProps {
  section: ArchiveSeasonSection;
  onSelect: (section: ArchiveSeasonSection) => void;
}

const getSeasonBackground = (season: string): string => {
  switch (season.toLowerCase()) {
    case 'winter':
      return '/media/winter.jpg';
    case 'spring':
      return '/media/spring.jpg';
    case 'summer':
      return '/media/summer.jpg';
    case 'fall':
      return '/media/fall.jpg';
    default:
      return '/media/summer.jpg';
  }
};

const getSeasonTheme = (season: string) => {
  switch (season.toLowerCase()) {
    case 'winter':
      return {
        icon: <Snowflake className="size-3.5" />,
        label: 'Winter',
        badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
        accentBorder: 'group-hover:border-sky-500/40',
        accentGlow: 'group-hover:shadow-[0_0_25px_rgba(56,189,248,0.15)]',
      };
    case 'spring':
      return {
        icon: <Sprout className="size-3.5" />,
        label: 'Spring',
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        accentBorder: 'group-hover:border-emerald-500/40',
        accentGlow: 'group-hover:shadow-[0_0_25px_rgba(52,211,153,0.15)]',
      };
    case 'summer':
      return {
        icon: <Sun className="size-3.5" />,
        label: 'Summer',
        badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        accentBorder: 'group-hover:border-amber-500/40',
        accentGlow: 'group-hover:shadow-[0_0_25px_rgba(251,191,36,0.15)]',
      };
    case 'fall':
      return {
        icon: <Leaf className="size-3.5" />,
        label: 'Fall',
        badgeClass: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
        accentBorder: 'group-hover:border-orange-500/40',
        accentGlow: 'group-hover:shadow-[0_0_25px_rgba(251,146,60,0.15)]',
      };
    default:
      return {
        icon: <Calendar className="size-3.5" />,
        label: season,
        badgeClass: 'bg-muted/40 text-muted-foreground border-border',
        accentBorder: 'group-hover:border-border',
        accentGlow: 'group-hover:shadow-[0_0_25px_rgba(255,255,255,0.1)]',
      };
  }
};

const formatBytes = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const SeasonSectionCard: React.FC<SeasonSectionCardProps> = ({ section, onSelect }) => {
  const bgImage = getSeasonBackground(section.season);
  const theme = getSeasonTheme(section.season);
  const dateRange = getSeasonDateRange(section.season, section.year);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.1 }}
      onClick={() => onSelect(section)}
      className="cursor-pointer"
    >
      <Card
        className={`group relative flex flex-col justify-between rounded-2xl overflow-hidden bg-card border border-border ${theme.accentBorder} ${theme.accentGlow} transition-colors duration-150 shadow-md select-none min-h-[300px] p-0`}
      >
        {/* Background artwork banner with dark gradient */}
        <div className="relative h-40 w-full overflow-hidden bg-background">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-200 group-hover:scale-110"
            style={{ backgroundImage: `url(${bgImage})` }}
          />
          {/* Gradients to fade smoothly into the card body */}
          <div className="absolute inset-0 bg-linear-to-t from-card via-card/10 to-black/30 backdrop-blur-xs" />

          {/* Current season or year indicator */}
          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-end gap-2">
            {section.isCurrent && (
              <Badge
                variant="destructive"
                className="text-[11px] font-bold uppercase tracking-wider bg-primary/30 border border-primary text-white shadow-sm"
              >
                Current Season
              </Badge>
            )}
          </div>

          {/* Season Title and Year overlay */}
          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
              {section.season} {section.year}
            </h2>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          {/* Submission Window Block */}
          <div className="px-3.5 py-2.5 rounded-xl bg-background border border-border flex items-center gap-2.5">
            <Calendar className="size-3.5 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex items-center justify-between">
                <span>Season Window</span>
                {section.isCurrent && (
                  <span className="text-emerald-400 font-bold text-[9px] uppercase tracking-wider">Open</span>
                )}
              </div>
              <div
                className="text-xs font-semibold text-foreground truncate mt-0.5"
                title={dateRange.shortFormatted}
              >
                {dateRange.shortFormatted}
              </div>
            </div>
          </div>

          {/* Clips Count & Top Streamers */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <Film className="size-3.5 text-primary shrink-0" />
              <span className="font-bold text-foreground">{section.clipCount.toLocaleString()}</span>
              <span className="text-muted-foreground">clips</span>
            </div>
          </div>

          {/* Footer with Zip Status & Action Button */}
          <div className="pt-3 border-t border-border flex items-center justify-between gap-2 text-xs">
            {section.zip ? (
              <div
                className="inline-flex items-center gap-1.5 text-emerald-400 font-medium"
                title={`Zip archive: ${formatBytes(section.zip.size)}`}
              >
                <Archive className="size-3.5" />
                <span>{formatBytes(section.zip.size)}</span>
              </div>
            ) : (
              <span className="text-muted-foreground text-[11px]">
                {section.isCurrent && 'Ongoing Season'}
              </span>
            )}

            <div className="inline-flex items-center gap-1.5 font-semibold text-foreground group-hover:text-primary transition-colors ml-auto">
              <span>Browse</span>
              <ArrowRight className="size-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default SeasonSectionCard;
