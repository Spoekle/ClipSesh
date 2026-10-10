'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaDownload, FaHistory, FaSpinner } from 'react-icons/fa';
import { ArchiveSeasonSection } from '@/types/clipTypes';
import { Button } from '@/components/Button';
import { downloadWithProgress } from '@/utils/downloadHelpers';

interface SeasonViewHeaderProps {
  section: ArchiveSeasonSection;
  dateRange: { fullFormatted: string };
  totalClips: number;
  isAdmin: boolean;
  canDownloadZip?: boolean;
  onBack: () => void;
  onOpenUnarchive: () => void;
}

const formatBytes = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const SeasonViewHeader: React.FC<SeasonViewHeaderProps> = ({
  section,
  dateRange,
  totalClips,
  isAdmin,
  canDownloadZip = true,
  onBack,
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

  return (
    <div className="relative w-full overflow-hidden select-none">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-6 pb-4">
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex items-center gap-2 mb-3">
          <Button
            variant="card"
            size="sm"
            onClick={onBack}
            leftIcon={<FaArrowLeft size={10} />}
          >
            All Seasons
          </Button>
          <span className="text-muted-foreground/60 select-none">/</span>
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span className="text-muted-foreground/60 select-none">/</span>
            <Link href="/archive" className="hover:text-white transition-colors">
              Archive
            </Link>
            <span className="text-muted-foreground/60 select-none">/</span>
            <span className="text-white font-medium">
              {section.season} {section.year}
            </span>
          </nav>
        </div>

        {/* Title row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="relative pb-3 w-fit">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight uppercase">
                {section.season} {section.year}
              </h1>
              <div className="absolute bottom-0 left-0 w-3/5 h-[2.5px] bg-primary rounded-full" />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2.5 text-sm text-muted-foreground">
              <span>
                Season Window:{' '}
                <strong className="text-white font-medium">{dateRange.fullFormatted}</strong>
              </span>
              {section.isCurrent && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/30 uppercase tracking-wider">
                  Active
                </span>
              )}
            </div>
          </div>

          {/* Right Badges & Download Zip Button */}
          <div className="flex items-center gap-2.5 pb-1 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-cc-card border border-border text-white">
              {totalClips.toLocaleString()} clips
            </span>
            {section.zip && canDownloadZip && (
              <Button
                variant="success"
                size="xs"
                onClick={handleDownload}
                disabled={isDownloading}
                isLoading={isDownloading}
                leftIcon={<FaDownload size={10} />}
                title={`Download batch archive: ${section.zip.name}`}
              >
                {isDownloading
                  ? `Downloading ${downloadProgress}%`
                  : `Zip (${formatBytes(section.zip.size)})`}
              </Button>
            )}
            {isAdmin && (
              <button
                type="button"
                onClick={onOpenUnarchive}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/25 text-xs font-medium transition-colors shrink-0 shadow-xs cursor-pointer"
                title={`Unarchive ${section.season} ${section.year} (Undo Archive)`}
              >
                <FaHistory size={10} />
                <span>Unarchive Season</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeasonViewHeader;
