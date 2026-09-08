import React from 'react';
import { motion } from 'framer-motion';
import { FaArchive, FaFilm, FaCalendarAlt, FaDownload } from 'react-icons/fa';

interface ArchiveHeroProps {
  totalClips: number;
  totalSeasons: number;
  totalZips: number;
  availableYears: number[];
  selectedYear: number | null;
  onSelectYear: (year: number | null) => void;
}

const ArchiveHero: React.FC<ArchiveHeroProps> = ({
  totalClips,
  totalSeasons,
  totalZips,
  availableYears,
  selectedYear,
  onSelectYear,
}) => {
  return (
    <div className="relative border-b border-[#262626] bg-[#121212]/95 overflow-hidden py-10 md:py-14">
      {/* Ambient background glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-3/4 h-56 bg-cc-red/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          {/* Header text */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl"
          >

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#f1f1f1]">
              Clip Archives
            </h1>

            <p className="mt-2 text-sm sm:text-base text-[#aaaaaa] leading-relaxed">
              Explore competitive Beat Saber highlights across every season and year. Filter by season to watch, search, and download archived clip packs.
            </p>
          </motion.div>

          {/* Quick Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex items-center gap-3 sm:gap-4 flex-wrap"
          >
            <div className="px-4 py-2.5 rounded-xl bg-[#181818] border border-[#262626] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#222222] border border-[#333333] flex items-center justify-center text-cc-red shrink-0">
                <FaFilm size={13} />
              </div>
              <div>
                <div className="text-xs text-[#717171] font-medium">Total Clips</div>
                <div className="text-sm sm:text-base font-bold text-[#f1f1f1] font-mono">
                  {totalClips.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="px-4 py-2.5 rounded-xl bg-[#181818] border border-[#262626] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#222222] border border-[#333333] flex items-center justify-center text-amber-400 shrink-0">
                <FaCalendarAlt size={13} />
              </div>
              <div>
                <div className="text-xs text-[#717171] font-medium">Seasons</div>
                <div className="text-sm sm:text-base font-bold text-[#f1f1f1] font-mono">
                  {totalSeasons}
                </div>
              </div>
            </div>

            <div className="px-4 py-2.5 rounded-xl bg-[#181818] border border-[#262626] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#222222] border border-[#333333] flex items-center justify-center text-emerald-400 shrink-0">
                <FaDownload size={13} />
              </div>
              <div>
                <div className="text-xs text-[#717171] font-medium">Zips Ready</div>
                <div className="text-sm sm:text-base font-bold text-[#f1f1f1] font-mono">
                  {totalZips}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Year Filter Chips */}
        {availableYears.length > 1 && (
          <div className="mt-8 pt-6 border-t border-[#262626]/80 flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
            <span className="text-xs text-[#717171] font-medium mr-1 shrink-0">Filter by Year:</span>
            <button
              onClick={() => onSelectYear(null)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                selectedYear === null
                  ? 'bg-cc-red text-white shadow-xs'
                  : 'bg-[#181818] hover:bg-[#222222] text-[#aaaaaa] hover:text-[#f1f1f1] border border-[#2e2e2e]'
              }`}
            >
              All Years
            </button>
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => onSelectYear(year === selectedYear ? null : year)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                  selectedYear === year
                    ? 'bg-cc-red text-white shadow-xs'
                    : 'bg-[#181818] hover:bg-[#222222] text-[#aaaaaa] hover:text-[#f1f1f1] border border-[#2e2e2e]'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchiveHero;
