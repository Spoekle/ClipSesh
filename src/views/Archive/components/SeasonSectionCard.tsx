import React from 'react';
import { motion } from 'framer-motion';
import {
  FaSeedling,
  FaSun,
  FaLeaf,
  FaSnowflake,
  FaFileArchive,
  FaFilm,
  FaArrowRight,
  FaCalendarAlt,
} from 'react-icons/fa';
import { ArchiveSeasonSection } from '../../../types/clipTypes';
import { getSeasonDateRange } from '../../../utils/seasonHelpers';

interface SeasonSectionCardProps {
  section: ArchiveSeasonSection;
  onSelect: (section: ArchiveSeasonSection) => void;
}

const getSeasonBackground = (season: string): string => {
  switch (season.toLowerCase()) {
    case 'winter':
      return '/media/winter.webp'
    case 'spring':
      return '/media/spring.jpg'
    case 'summer':
      return '/media/summer.jpg'
    case 'fall':
      return '/media/fall.jpg'
    default:
      return '/media/summer.jpg'
  }
};

const getSeasonTheme = (season: string) => {
  switch (season.toLowerCase()) {
    case 'winter':
      return {
        icon: <FaSnowflake size={12} />,
        label: 'Winter',
        badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
        accentBorder: 'group-hover:border-sky-500/40',
        accentGlow: 'group-hover:shadow-[0_0_25px_rgba(56,189,248,0.15)]',
      };
    case 'spring':
      return {
        icon: <FaSeedling size={12} />,
        label: 'Spring',
        badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        accentBorder: 'group-hover:border-emerald-500/40',
        accentGlow: 'group-hover:shadow-[0_0_25px_rgba(52,211,153,0.15)]',
      };
    case 'summer':
      return {
        icon: <FaSun size={12} />,
        label: 'Summer',
        badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        accentBorder: 'group-hover:border-amber-500/40',
        accentGlow: 'group-hover:shadow-[0_0_25px_rgba(251,191,36,0.15)]',
      };
    case 'fall':
      return {
        icon: <FaLeaf size={12} />,
        label: 'Fall',
        badgeClass: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
        accentBorder: 'group-hover:border-orange-500/40',
        accentGlow: 'group-hover:shadow-[0_0_25px_rgba(251,146,60,0.15)]',
      };
    default:
      return {
        icon: <FaCalendarAlt size={12} />,
        label: season,
        badgeClass: 'bg-neutral-500/15 text-neutral-300 border-neutral-500/30',
        accentBorder: 'group-hover:border-neutral-500/40',
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

const SeasonSectionCard: React.FC<SeasonSectionCardProps> = ({ section, onSelect }) => {
  const bgImage = getSeasonBackground(section.season);
  const theme = getSeasonTheme(section.season);
  const dateRange = getSeasonDateRange(section.season, section.year);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.1 }}
      onClick={() => onSelect(section)}
      className={`group relative flex flex-col justify-between rounded-2xl overflow-hidden bg-[#181818] border border-[#262626] ${theme.accentBorder} ${theme.accentGlow} transition-colors duration-150 cursor-pointer shadow-md select-none min-h-[300px]`}
    >
      {/* Background artwork banner with dark gradient */}
      <div className="relative h-40 w-full overflow-hidden bg-[#111111]">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-200 group-hover:scale-103 filter brightness-75 group-hover:brightness-90"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
        {/* Gradients to fade smoothly into the card body */}
        <div className="absolute inset-0 bg-linear-to-t from-[#181818] via-[#181818]/60 to-black/30" />

        {/* Badges on banner */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
          {/* Season pill */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-bold border backdrop-blur-md ${theme.badgeClass}`}
          >
            {theme.icon}
            <span>{section.season}</span>
          </div>

          {/* Current season or year indicator */}
          <div className="flex items-center gap-1.5">
            {section.isCurrent && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-sm text-[11px] font-extrabold uppercase tracking-wider bg-cc-red/30 border border-cc-red text-cc-red shadow-sm">
                Current Season
              </span>
            )}
          </div>
        </div>

        {/* Season Title and Year overlay */}
        <div className="absolute bottom-3 left-4 right-4">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">
            {section.season} {section.year}
          </h2>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
        {/* Submission Window Block */}
        <div className="px-3.5 py-2.5 rounded-xl bg-[#141414] border border-[#262626] flex items-center gap-2.5">
          <FaCalendarAlt size={12} className="text-neutral-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-[#717171] uppercase tracking-wider font-semibold flex items-center justify-between">
              <span>Season Window</span>
              {section.isCurrent && (
                <span className="text-emerald-400 font-bold text-[9px] uppercase tracking-wider">Open</span>
              )}
            </div>
            <div
              className="text-xs font-semibold text-[#f1f1f1] truncate mt-0.5"
              title={dateRange.shortFormatted}
            >
              {dateRange.shortFormatted}
            </div>
          </div>
        </div>

        {/* Clips Count & Top Streamers */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <FaFilm size={12} className="text-cc-red shrink-0" />
            <span className="font-bold text-white font-mono">{section.clipCount.toLocaleString()}</span>
            <span className="text-neutral-400">clips</span>
          </div>
        </div>

        {/* Footer with Zip Status & Action Button */}
        <div className="pt-3 border-t border-[#262626] flex items-center justify-between gap-2 text-xs">
          {section.zip ? (
            <div
              className="inline-flex items-center gap-1.5 text-emerald-400 font-medium"
              title={`Zip archive: ${formatBytes(section.zip.size)}`}
            >
              <FaFileArchive size={12} />
              <span>{formatBytes(section.zip.size)}</span>
            </div>
          ) : (
            <span className="text-neutral-500 text-[11px]">
              {section.isCurrent ? 'Ongoing Season' : 'Individual Clips'}
            </span>
          )}

          <div className="inline-flex items-center gap-1.5 font-semibold text-white group-hover:text-cc-red transition-colors ml-auto">
            <span>Browse</span>
            <FaArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SeasonSectionCard;
