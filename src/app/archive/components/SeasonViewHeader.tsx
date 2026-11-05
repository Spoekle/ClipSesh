'use client';

import React, { useState } from 'react';
import { Download, Film, History, Loader2 } from 'lucide-react';
import { ArchiveSeasonSection } from '@/types/clipTypes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { routeCrumbs } from '@/lib/breadcrumbs';
import { downloadWithProgress } from '@/utils/downloadHelpers';
import { formatFileSize } from '@/utils/fileHelpers';
import { cn } from '@/lib/utils';
import { getSeasonTheme } from '../seasonTheme';

interface SeasonViewHeaderProps {
  section: ArchiveSeasonSection;
  dateRange: { fullFormatted: string };
  totalClips: number;
  isAdmin: boolean;
  canDownloadZip?: boolean;
  onOpenUnarchive: () => void;
}

export const SeasonViewHeader: React.FC<SeasonViewHeaderProps> = ({
  section,
  dateRange,
  totalClips,
  isAdmin,
  canDownloadZip = true,
  onOpenUnarchive,
}) => {
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  const handleDownload = async () => {
    if (!section.zip || isDownloading) return;
    setIsDownloading(true);
    setDownloadProgress(0);

    try {
      await downloadWithProgress({
        url: section.zip.url,
        filename: section.zip.name,
        onProgress: (progress) => {
          setDownloadProgress(progress);
        },
      });
    } catch (err) {
      console.error('Archive download failed:', err);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const theme = getSeasonTheme(section.season);
  const SeasonIcon = theme.icon;
  const backdrop = section.previewThumbnails[0] ?? theme.image;

  return (
    <div className="relative w-full overflow-hidden select-none">
      <div className="pointer-events-none absolute inset-0">
        <img src={backdrop} alt="" className="size-full scale-110 object-cover opacity-30 blur-2xl" />
        <div className={cn('absolute inset-0 bg-linear-to-br via-transparent to-transparent', theme.from)} />
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/70 to-background/30" />
      </div>

      <div className="relative mx-auto max-w-[1200px] px-4 pt-6 pb-8 sm:px-8">
        <Breadcrumbs
          items={[routeCrumbs.archive, { label: `${section.season} ${section.year}` }]}
          className="mb-6"
        />

        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold tracking-[0.15em] uppercase',
                  theme.chip
                )}
              >
                <SeasonIcon className="size-3" />
                {section.season} season
              </span>
              {section.isCurrent && (
                <Badge
                  variant="destructive"
                  className="border-primary/30 bg-primary/15 text-[11px] font-bold tracking-wider text-primary uppercase"
                >
                  Active
                </Badge>
              )}
            </div>
            <h1 className="mt-4 text-5xl leading-[0.95] font-black tracking-tight text-foreground uppercase sm:text-6xl md:text-7xl">
              {section.season}
              <span className="ml-3 font-mono text-3xl font-bold text-muted-foreground sm:text-4xl md:text-5xl">
                {section.year}
              </span>
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">{dateRange.fullFormatted}</p>

            {section.topStreamers.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Top streamers
                </span>
                {section.topStreamers.map((streamer) => (
                  <span
                    key={streamer}
                    className="rounded-md border border-border bg-card/70 px-2 py-0.5 text-xs font-medium text-foreground backdrop-blur-sm"
                  >
                    {streamer}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
<div className="flex items-center gap-3 rounded-2xl border border-border bg-card/90 px-5 py-3.5 backdrop-blur-sm">
              <Film className="size-5 text-primary" />
              <div>
                <div className="text-2xl font-bold text-foreground tabular-nums">{totalClips.toLocaleString()}</div>
                <div className="text-[11px] text-muted-foreground">Clips</div>
              </div>
            </div>

            {((section.zip && canDownloadZip) || isAdmin) && (
              <div className="flex flex-wrap items-center gap-2">
                {section.zip && canDownloadZip && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="gap-1.5 border-emerald-500/25 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    title={`Download batch archive: ${section.zip.name}`}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        Downloading {downloadProgress}%
                      </>
                    ) : (
                      <>
                        <Download className="size-3.5" />
                        Zip ({formatFileSize(section.zip.size, 1)})
                      </>
                    )}
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onOpenUnarchive}
                    className="gap-1.5 border-amber-500/25 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                    title={`Unarchive ${section.season} ${section.year} (Undo Archive)`}
                  >
                    <History className="size-3.5" />
                    <span>Unarchive Season</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeasonViewHeader;
