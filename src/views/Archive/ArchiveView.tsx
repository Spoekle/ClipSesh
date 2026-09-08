'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from '@/lib/routerCompat';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFilm, FaCalendarAlt, FaExclamationTriangle } from 'react-icons/fa';
import { Helmet } from '@/lib/helmetCompat';
import { useArchiveSeasons, useClip } from '../../hooks/useClips';
import { useCurrentUser } from '../../hooks/useUser';
import { ArchiveSeasonSection } from '../../types/clipTypes';
import ArchiveHero from './components/ArchiveHero';
import SeasonSectionCard from './components/SeasonSectionCard';
import SeasonClipsView from './components/SeasonClipsView';
import ClipContent from '../Clips/ClipView/Index';

const ArchiveView: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: user } = useCurrentUser();
  const { data: archiveData, isLoading, error } = useArchiveSeasons();

  const [selectedSeason, setSelectedSeason] = useState<ArchiveSeasonSection | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [expandedClip, setExpandedClip] = useState<string | null>(null);

  const { data: currentClip, isLoading: isClipLoading } = useClip(expandedClip || '');

  const sections = useMemo(() => archiveData?.sections || [], [archiveData]);

  // Read initial season and year from URL search params
  const paramSeason = searchParams.get('season');
  const paramYear = searchParams.get('year');

  useEffect(() => {
    if (sections.length > 0 && paramSeason && paramYear) {
      const match = sections.find(
        (s) =>
          s.season.toLowerCase() === paramSeason.toLowerCase() &&
          s.year === parseInt(paramYear, 10)
      );
      if (match) {
        setSelectedSeason(match);
      }
    } else if (!paramSeason && !paramYear) {
      setSelectedSeason(null);
    }
  }, [sections, paramSeason, paramYear]);

  // Aggregate metrics
  const totalClips = useMemo(() => {
    return sections.reduce((acc, s) => acc + (s.clipCount || 0), 0);
  }, [sections]);

  const totalZips = useMemo(() => {
    return sections.filter((s) => Boolean(s.zip)).length;
  }, [sections]);

  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    sections.forEach((s) => yearsSet.add(s.year));
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [sections]);

  // Filter sections by selected year in overview mode
  const filteredSections = useMemo(() => {
    if (selectedYear === null) return sections;
    return sections.filter((s) => s.year === selectedYear);
  }, [sections, selectedYear]);

  // Handle selecting a season section
  const handleSelectSeason = useCallback(
    (section: ArchiveSeasonSection) => {
      setSelectedSeason(section);
      setExpandedClip(null);
      setSearchParams({ season: section.season, year: section.year.toString() });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setSearchParams]
  );

  // Handle returning back to all seasons
  const handleBackToOverview = useCallback(() => {
    setSelectedSeason(null);
    setExpandedClip(null);
    setSearchParams({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setSearchParams]);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#f1f1f1] flex flex-col transition-colors">
      <Helmet>
        <title>
          {selectedSeason
            ? `${selectedSeason.season} ${selectedSeason.year} Archive • ClipSesh`
            : 'Clip Archives • ClipSesh'}
        </title>
        <meta
          name="description"
          content="Explore Beat Saber clips, seasonal rankings, and historical highlight videos across every season."
        />
      </Helmet>

      {/* If a clip is expanded for playback, render ClipContent */}
      {expandedClip ? (
        <div className="w-full grow flex flex-col">
          {isClipLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#2a2a2a] border-t-cc-red mb-4" />
              <p className="text-xs text-[#717171]">Loading clip playback...</p>
            </div>
          ) : currentClip ? (
            <ClipContent
              clip={currentClip}
              setExpandedClip={setExpandedClip}
              user={user || null}
              fromContext={{
                label: 'Archive',
                path: selectedSeason
                  ? `/archive?season=${encodeURIComponent(selectedSeason.season)}&year=${selectedSeason.year}`
                  : '/archive',
                season: selectedSeason?.season,
                year: selectedSeason?.year,
              }}
            />
          ) : (
            <div className="text-center py-20 bg-[#181818] border border-[#262626] rounded-2xl p-8 max-w-xl mx-auto my-12">
              <h3 className="text-lg font-bold text-white mb-2">Clip Not Found</h3>
              <p className="text-xs text-[#aaaaaa] mb-4">
                The requested clip could not be loaded or may have been deleted.
              </p>
              <button
                onClick={() => setExpandedClip(null)}
                className="px-4 py-2 rounded-xl bg-cc-red text-white text-xs font-bold hover:bg-cc-red-hover transition-colors"
              >
                Back to Archive
              </button>
            </div>
          )}
        </div>
      ) : selectedSeason ? (
        /* Season Detail Mode: All clips in the selected season */
        <SeasonClipsView
          section={selectedSeason}
          onBack={handleBackToOverview}
          onSelectClip={(clipId) => {
            setExpandedClip(clipId);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          user={user || null}
        />
      ) : (
        /* Catalog Overview Mode: All available seasons/years */
        <div>
          <ArchiveHero
            totalClips={totalClips}
            totalSeasons={sections.length}
            totalZips={totalZips}
            availableYears={availableYears}
            selectedYear={selectedYear}
            onSelectYear={setSelectedYear}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl overflow-hidden bg-[#181818] border border-[#262626] animate-pulse h-80"
                  >
                    <div className="h-36 bg-[#202020]" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-[#262626] rounded-sm w-2/3" />
                      <div className="h-3 bg-[#202020] rounded-sm w-1/2" />
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div className="h-10 bg-[#1c1c1c] rounded-lg" />
                        <div className="h-10 bg-[#1c1c1c] rounded-lg" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-16 bg-[#181818] border border-red-500/30 rounded-2xl p-8">
                <FaExclamationTriangle size={32} className="text-red-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">Failed to Load Archives</h3>
                <p className="text-xs text-neutral-400 max-w-md mx-auto">
                  There was an error retrieving available seasonal records. Please refresh the page.
                </p>
              </div>
            ) : filteredSections.length > 0 ? (
              <div>
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      {selectedYear ? `${selectedYear} Seasons` : 'All Available Seasons'}
                    </h2>
                    <p className="text-xs text-[#888888] mt-0.5">
                      Select any season below to explore its clips, view count, and highlight package.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[#717171] font-semibold">
                    {filteredSections.length} {filteredSections.length === 1 ? 'Season' : 'Seasons'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredSections.map((section) => (
                    <SeasonSectionCard
                      key={`${section.season}-${section.year}`}
                      section={section}
                      onSelect={handleSelectSeason}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-20 bg-[#181818] border border-[#262626] rounded-2xl p-8">
                <FaCalendarAlt size={28} className="text-[#717171] mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">No Seasons for this Year</h3>
                <p className="text-xs text-[#888888] mb-4">
                  No competitive seasons were found for {selectedYear}.
                </p>
                <button
                  onClick={() => setSelectedYear(null)}
                  className="px-4 py-2 rounded-xl bg-cc-red text-white text-xs font-bold hover:bg-cc-red-hover transition-colors"
                >
                  Show All Years
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchiveView;
