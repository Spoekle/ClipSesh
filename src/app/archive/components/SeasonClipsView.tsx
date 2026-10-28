'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Film } from 'lucide-react';
import debounce from 'lodash.debounce';
import { ArchiveSeasonSection } from '@/types/clipTypes';
import { Clip, User, Rating } from '@/types/adminTypes';
import { getClips, getClipFilterOptions } from '@/services/clipService';
import { getSeasonDateRange } from '@/lib/seasonHelpers';
import ClipItem from '@/app/clips/components/ClipGrid/components/ClipItem';
import { useUnarchiveSeason } from '@/hooks/useAdmin';
import { useNotification } from '@/context/AlertContext';
import UnarchiveSeasonModal from '@/app/admin/components/UnarchiveSeasonModal';
import SeasonViewHeader from './SeasonViewHeader';
import SeasonFilterBar from './SeasonFilterBar';
import SeasonPagination from './SeasonPagination';
import { Button } from '@/components/common/Button';

interface SeasonClipsViewProps {
  section: ArchiveSeasonSection;
  onBack: () => void;
  onSelectClip: (clipId: string) => void;
  user: User | null;
  ratings?: Record<string, Rating>;
}

const SeasonClipsView: React.FC<SeasonClipsViewProps> = ({
  section,
  onBack,
  onSelectClip,
  user,
  ratings = {},
}) => {
  const dateRange = getSeasonDateRange(section.season, section.year);
  const { showSuccess, showError } = useNotification();
  const unarchiveSeasonMutation = useUnarchiveSeason();
  const [showUnarchiveModal, setShowUnarchiveModal] = useState<boolean>(false);
  const isAdmin = Boolean(user && Array.isArray(user.roles) && user.roles.includes('admin'));

  const handleConfirmUnarchive = async (deleteZip: boolean) => {
    try {
      const result = await unarchiveSeasonMutation.mutateAsync({
        season: section.season,
        year: section.year,
        deleteZip,
      });
      showSuccess(result.message || `Successfully unarchived ${section.season} ${section.year}!`);
      setShowUnarchiveModal(false);
      onBack();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to unarchive season';
      showError(message);
    }
  };

  const [searchInput, setSearchInput] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [streamerFilter, setStreamerFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'views' | 'upvotes'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState<number>(1);
  const limit = 12;

  const [clips, setClips] = useState<Clip[]>([]);
  const [totalClips, setTotalClips] = useState<number>(section.clipCount);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [streamers, setStreamers] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadStreamers = async () => {
      try {
        const options = await getClipFilterOptions();
        if (isMounted && options && options.streamers) {
          setStreamers(options.streamers);
        }
      } catch (err) {
        console.warn('Failed to load filter options:', err);
      }
    };
    loadStreamers();
    return () => {
      isMounted = false;
    };
  }, []);

  const debouncedSearch = useMemo(
    () =>
      debounce((val: string) => {
        setSearchTerm(val);
        setPage(1);
      }, 350),
    []
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    debouncedSearch(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTerm('');
    debouncedSearch.cancel();
    setPage(1);
  };

  useEffect(() => {
    let isMounted = true;
    const loadSeasonClips = async () => {
      setLoading(true);
      try {
        const response = await getClips({
          page,
          limit,
          sortBy,
          sortOrder,
          search: searchTerm,
          streamer: streamerFilter,
          season: section.season,
          year: section.year,
        });

        if (!isMounted) return;

        if (response && Array.isArray(response.clips)) {
          setClips(response.clips);
          setTotalClips(response.total || 0);
          setTotalPages(response.pages || Math.ceil((response.total || 0) / limit) || 1);
        } else {
          setClips([]);
          setTotalClips(0);
          setTotalPages(1);
        }
      } catch (err) {
        console.error('Error fetching season clips:', err);
        if (isMounted) {
          setClips([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSeasonClips();

    return () => {
      isMounted = false;
    };
  }, [section.season, section.year, page, sortBy, sortOrder, searchTerm, streamerFilter]);

  return (
    <div className="relative min-h-[calc(100vh-80px)] text-white flex flex-col bg-cc-ground transition-colors">
      <SeasonViewHeader
        section={section}
        dateRange={dateRange}
        totalClips={totalClips}
        isAdmin={isAdmin}
        canDownloadZip={Boolean(
          user &&
            Array.isArray(user.roles) &&
            (user.roles.includes('admin') || user.roles.includes('editor') || user.roles.includes('clipteam'))
        )}
        onBack={onBack}
        onOpenUnarchive={() => setShowUnarchiveModal(true)}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-6 grow flex flex-col w-full">
        <SeasonFilterBar
          searchInput={searchInput}
          streamerFilter={streamerFilter}
          streamers={streamers}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSearchChange={handleSearchChange}
          onClearSearch={handleClearSearch}
          onStreamerFilterChange={(streamer) => {
            setStreamerFilter(streamer);
            setPage(1);
          }}
          onSortChange={(newSortBy, newSortOrder) => {
            setSortBy(newSortBy);
            setSortOrder(newSortOrder);
            setPage(1);
          }}
        />

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-xl overflow-hidden bg-cc-card border border-border animate-pulse h-64"
              >
                <div className="aspect-video bg-cc-ground" />
                <div className="p-3.5 space-y-2.5">
                  <div className="h-3.5 bg-border rounded-sm w-3/4" />
                  <div className="h-3 bg-cc-ground rounded-sm w-1/2" />
                  <div className="h-2.5 bg-cc-ground/60 rounded-sm w-1/3 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : clips.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {clips.map((clip) => (
                <div key={clip._id} className="h-full">
                  <ClipItem
                    clip={clip}
                    user={user}
                    ratings={ratings}
                    setExpandedClip={(clipId) => onSelectClip(clipId)}
                  />
                </div>
              ))}
            </div>

            <SeasonPagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        ) : (
          <div className="py-20 text-center flex flex-col items-center justify-center bg-cc-card border border-border rounded-2xl p-8">
            <div className="w-14 h-14 rounded-2xl bg-cc-ground border border-border flex items-center justify-center text-muted-foreground mb-4">
              <Film className="size-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No Clips Found</h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mb-5">
              {searchTerm || streamerFilter
                ? 'No clips in this season match your current search or filter criteria.'
                : 'There are currently no clips recorded in this seasonal archive.'}
            </p>
            {(searchTerm || streamerFilter) && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  handleClearSearch();
                  setStreamerFilter('');
                }}
              >
                Clear All Filters
              </Button>
            )}
          </div>
        )}
      </div>

      <UnarchiveSeasonModal
        isOpen={showUnarchiveModal}
        onClose={() => setShowUnarchiveModal(false)}
        onConfirm={handleConfirmUnarchive}
        season={section.season}
        year={section.year}
        archivedClipsCount={section.archivedClipsCount ?? totalClips}
        zipName={section.zip?.name}
        loading={unarchiveSeasonMutation.isPending}
      />
    </div>
  );
};

export default SeasonClipsView;
