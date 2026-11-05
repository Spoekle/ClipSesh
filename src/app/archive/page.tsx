'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Calendar, AlertTriangle } from 'lucide-react';
import { useArchiveSeasons, useClip } from '@/hooks/useClips';
import { useCurrentUser } from '@/hooks/useUser';
import { ArchiveSeasonSection } from '@/types/clipTypes';
import ArchiveHero from './components/ArchiveHero';
import ArchiveSpotlight from './components/ArchiveSpotlight';
import ArchiveTimeline from './components/ArchiveTimeline';
import SeasonClipsView from './components/SeasonClipsView';
import ArchiveLoadingGrid from './components/ArchiveLoadingGrid';
import ClipContent from '@/app/clips/components/ClipView/Index';
import { Button } from '@/components/ui/button';
import { archiveSeasonCrumb, routeCrumbs } from '@/lib/breadcrumbs';

const ArchiveView: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const { data: archiveData, isLoading, error } = useArchiveSeasons();

  const [selectedSeason, setSelectedSeason] = useState<ArchiveSeasonSection | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [expandedClip, setExpandedClip] = useState<string | null>(null);

  const { data: currentClip, isLoading: isClipLoading } = useClip(expandedClip || '');

  const sections = useMemo(() => archiveData?.sections || [], [archiveData]);

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

  const filteredSections = useMemo(() => {
    if (selectedYear === null) return sections;
    return sections.filter((s) => s.year === selectedYear);
  }, [sections, selectedYear]);

  const handleSelectSeason = useCallback(
    (section: ArchiveSeasonSection) => {
      setSelectedSeason(section);
      setExpandedClip(null);
      router.push(archiveSeasonCrumb(section.season, section.year).href);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [router]
  );

  const handleBackToOverview = useCallback(() => {
    setSelectedSeason(null);
    setExpandedClip(null);
    router.push(routeCrumbs.archive.href);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [router]);

  return (
    <div className="min-h-screen bg-cc-ground text-cc-text flex flex-col transition-colors">
      {expandedClip ? (
        <div className="w-full grow flex flex-col">
          {isClipLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-border border-t-primary mb-4" />
              <p className="text-xs text-muted-foreground">Loading clip playback...</p>
            </div>
          ) : currentClip ? (
            <ClipContent
              clip={currentClip}
              setExpandedClip={setExpandedClip}
              user={user || null}
              parentCrumbs={[
                { ...routeCrumbs.archive, onClick: () => setExpandedClip(null) },
                ...(selectedSeason
                  ? [{ ...archiveSeasonCrumb(selectedSeason.season, selectedSeason.year), onClick: () => setExpandedClip(null) }]
                  : []),
              ]}
            />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <p className="text-sm text-primary mb-3">Clip could not be loaded.</p>
              <button
                onClick={() => setExpandedClip(null)}
                className="px-4 py-2 bg-cc-card border border-border text-xs rounded-xl hover:bg-border/60 transition-colors"
              >
                Back to Archive
              </button>
            </div>
          )}
        </div>
      ) : selectedSeason ? (
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
        <div>
          <ArchiveHero
            totalClips={totalClips}
            totalSeasons={sections.length}
            totalZips={totalZips}
            availableYears={availableYears}
            selectedYear={selectedYear}
            onSelectYear={setSelectedYear}
          />

          <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-2 pb-20">
            {isLoading ? (
              <ArchiveLoadingGrid />
            ) : error ? (
              <div className="text-center py-16 bg-cc-card border border-primary/30 rounded-2xl p-8">
                <AlertTriangle className="size-8 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">Failed to Load Archives</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  There was an error retrieving available seasonal records. Please refresh the page.
                </p>
              </div>
            ) : filteredSections.length > 0 ? (
              <div className="flex flex-col gap-16">
                {selectedYear === null && (
                  <ArchiveSpotlight section={filteredSections[0]} onSelect={handleSelectSeason} />
                )}
                <ArchiveTimeline sections={filteredSections} onSelect={handleSelectSeason} />
              </div>
            ) : (
              <div className="text-center py-20 bg-cc-card border border-border rounded-2xl p-8">
                <Calendar className="size-7 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">No Seasons for this Year</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  No competitive seasons were found for {selectedYear}.
                </p>
                <Button onClick={() => setSelectedYear(null)}>
                  Show All Years
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function ArchiveViewWithSuspense() {
  return (
    <React.Suspense fallback={null}>
      <ArchiveView />
    </React.Suspense>
  );
}