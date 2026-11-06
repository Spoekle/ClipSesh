'use client';

import React from 'react';
import {
  Archive,
  Download,
  Trash2,
  Loader2,
  History,
} from 'lucide-react';
import { formatFileSize } from '@/utils/fileHelpers';
import { Zip } from '@/types/adminTypes';
import { Button } from '@/components/ui/button';

export interface SeasonStatusItem {
  season: string;
  year: number;
  isCurrent?: boolean;
  isArchived?: boolean;
  activeClips?: number;
  archivedClips?: number;
  hasArchivedClips?: boolean;
  zip?: {
    _id?: string;
    name?: string;
    size?: number;
    url?: string;
  } | null;
}

interface SeasonLifecycleTableProps {
  seasons: SeasonStatusItem[];
  loading: boolean;
  zips: Zip[];
  downloadStates: Record<string, { isDownloading: boolean; progress: number }>;
  onDownload: (zipId: string, url: string, filename: string) => void;
  onDeleteZip: (zipId: string, zipName: string) => void;
  onSelectUnarchive: (season: {
    season: string;
    year: number;
    archivedClips?: number;
    zipName?: string | null;
  }) => void;
  onArchiveSeason: (season: string, year: number) => void;
  isArchiving?: boolean;
  onCompilePool: () => void;
}

export const SeasonLifecycleTable: React.FC<SeasonLifecycleTableProps> = ({
  seasons,
  loading,
  zips,
  downloadStates,
  onDownload,
  onDeleteZip,
  onSelectUnarchive,
  onArchiveSeason,
  isArchiving = false,
  onCompilePool,
}) => {
  const getZipForSeason = (seasonName: string, seasonYear: number) => {
    return zips.find(
      (z) =>
        z.season?.toLowerCase() === seasonName?.toLowerCase() &&
        Number(z.year) === Number(seasonYear)
    );
  };

  if (loading) {
    return (
      <div className="p-12 text-center bg-cc-ground rounded-xl border border-border">
        <Loader2 className="size-4 animate-spin text-primary mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">Loading seasonal collections...</p>
      </div>
    );
  }

  if (seasons.length === 0) {
    return (
      <div className="p-8 text-center bg-cc-ground rounded-xl border border-border">
        <p className="text-xs text-muted-foreground">No season collections found in database.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {seasons.map((s) => {
        const seasonKey = `${s.season}-${s.year}`;
        const matchedZip = getZipForSeason(s.season, s.year);
        const linkedZip = matchedZip ?? (s.zip?.name ? {
          _id: s.zip._id ?? s.zip.name,
          name: s.zip.name,
          size: s.zip.size ?? 0,
          url: s.zip.url ?? '',
          season: s.season,
          year: s.year,
          createdAt: '',
          clipAmount: 0,
        } : null);

        const zipId = linkedZip?._id ?? '';
        const isZipDownloading = zipId ? Boolean(downloadStates[zipId]?.isDownloading) : false;
        const zipDownloadProgress = zipId ? (downloadStates[zipId]?.progress ?? 0) : 0;
        const activeClipsCount = s.activeClips ?? 0;
        const archivedClipsCount = s.archivedClips ?? 0;

        return (
          <div
            key={seasonKey}
            className="p-4 rounded-xl bg-cc-ground border border-border hover:border-border/80 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-sm font-bold text-white capitalize flex items-center gap-2">
                  <span>{s.season} {s.year}</span>
                </span>

                {s.isCurrent ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 uppercase tracking-wide flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    Active
                  </span>
                ) : s.isArchived ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    Archived
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Unarchived
                  </span>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-cc-card border border-border space-y-1.5 text-xs text-muted-foreground font-mono">
                <div className="flex justify-between items-center text-[11px]">
                  <span>Active Pool:</span>
                  <span className="text-white font-semibold">{activeClipsCount} clips</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span>Archived:</span>
                  <span className={archivedClipsCount > 0 ? 'text-amber-400 font-semibold' : 'text-muted-foreground/60'}>
                    {archivedClipsCount} clips
                  </span>
                </div>
              </div>

              {linkedZip ? (
                <div className="mt-3 p-2.5 rounded-lg bg-cc-card border border-border flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white truncate">
                      <Archive className="size-3 text-sky-400 shrink-0" />
                      <span className="truncate" title={linkedZip.name}>{linkedZip.name}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono block mt-0.5">
                      {formatFileSize(linkedZip.size)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon-xs"
                      onClick={() => handleDownloadClick(linkedZip, onDownload)}
                      disabled={isZipDownloading}
                      className="cursor-pointer"
                      title="Download ZIP Archive"
                    >
                      {isZipDownloading ? (
                        <span className="text-[10px] flex items-center gap-1">
                          <Loader2 className="size-2.5 animate-spin" />
                          {zipDownloadProgress}%
                        </span>
                      ) : (
                        <Download className="size-3" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => onDeleteZip(linkedZip._id, linkedZip.name)}
                      className="text-muted-foreground hover:text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                      title="Delete ZIP Archive"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 py-2 px-2.5 rounded-lg bg-cc-ground border border-border text-center">
                  <span className="text-[10px] text-muted-foreground/60 font-mono italic">No ZIP archive compiled</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-border">
              {s.hasArchivedClips ? (
                <button
                  type="button"
                  onClick={() =>
                    onSelectUnarchive({
                      season: s.season,
                      year: s.year,
                      archivedClips: s.archivedClips,
                      zipName: linkedZip?.name,
                    })
                  }
                  className="w-full py-1.5 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 hover:text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Restore archived clips back to the active reviewer list"
                >
                  <History className="size-3" />
                  <span>Unarchive (Undo)</span>
                </button>
              ) : !s.isCurrent && activeClipsCount > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5"
                  onClick={() => onArchiveSeason(s.season, s.year)}
                  disabled={isArchiving}
                  title="Archive active clips for this past season"
                >
                  {isArchiving ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Archive className="size-3" />
                  )}
                  <span>Archive Season</span>
                </Button>
              ) : s.isCurrent ? (
                <Button
                  variant="default"
                  size="sm"
                  className="w-full gap-1.5 bg-primary text-white hover:bg-primary/90 font-semibold"
                  onClick={onCompilePool}
                >
                  <Download className="size-3" />
                  <span>Compile Current Pool</span>
                </Button>
              ) : (
                <span className="text-[11px] text-muted-foreground/60 italic block text-center py-1">
                  All clips active
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

function handleDownloadClick(
  zip: { _id: string; url: string; name: string },
  onDownload: (id: string, url: string, filename: string) => void
) {
  onDownload(zip._id, zip.url, zip.name);
}

export default SeasonLifecycleTable;
