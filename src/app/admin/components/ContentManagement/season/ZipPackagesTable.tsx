'use client';

import React from 'react';
import { FaBoxOpen, FaFileDownload, FaSpinner, FaTrash } from 'react-icons/fa';
import { formatFileSize, formatDate } from '@/utils/fileHelpers';
import { Zip } from '@/types/adminTypes';
import { Button } from '@/components/Button';

interface ZipPackagesTableProps {
  zips: Zip[];
  loading: boolean;
  downloadStates: Record<string, { isDownloading: boolean; progress: number }>;
  onDownload: (zipId: string, url: string, filename: string) => void;
  onDeleteZip: (zipId: string, zipName: string) => void;
  onCompileFirstZip: () => void;
}

export const ZipPackagesTable: React.FC<ZipPackagesTableProps> = ({
  zips,
  loading,
  downloadStates,
  onDownload,
  onDeleteZip,
  onCompileFirstZip,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <FaSpinner className="animate-spin text-2xl text-primary mb-2" />
        <p className="text-xs">Loading compiled packages...</p>
      </div>
    );
  }

  if (zips.length === 0) {
    return (
      <div className="text-center py-16 rounded-xl border border-border bg-cc-ground flex flex-col items-center justify-center">
        <FaBoxOpen className="text-3xl text-muted-foreground/60 mb-2" />
        <p className="text-sm font-bold text-white">No Packages Found</p>
        <p className="text-xs text-muted-foreground mt-0.5 max-w-sm mb-4">
          Compile a season archive using the compilation pipeline or upload an existing raw archive.
        </p>
        <Button
          variant="primary"
          size="md"
          onClick={onCompileFirstZip}
        >
          Compile First ZIP
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {zips.map((zip) => {
        const isDownloading = Boolean(downloadStates[zip._id]?.isDownloading);
        const progress = downloadStates[zip._id]?.progress ?? 0;

        return (
          <div
            key={zip._id}
            className="bg-cc-ground rounded-xl p-4 border border-border hover:border-border/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-bold text-sm text-white capitalize">
                  {zip.season} {zip.year}
                </span>
                <span className="px-2 py-0.5 bg-cc-card text-foreground border border-border text-[10px] font-semibold rounded-full font-mono">
                  {zip.clipAmount} clips
                </span>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-semibold rounded-full font-mono">
                  {formatFileSize(zip.size)}
                </span>
              </div>

              <p className="text-xs text-muted-foreground font-mono truncate">{zip.name}</p>

              <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground/80">
                <span>Compiled {formatDate(zip.createdAt)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="card"
                size="sm"
                onClick={() => onDownload(zip._id, zip.url, zip.name)}
                disabled={isDownloading}
                isLoading={isDownloading}
                leftIcon={<FaFileDownload size={11} />}
                title="Download Package"
              >
                {isDownloading ? `${progress}%` : 'Download'}
              </Button>

              <Button
                variant="card"
                size="icon-sm"
                onClick={() => onDeleteZip(zip._id, zip.name)}
                className="hover:bg-rose-500/20 hover:text-rose-400"
                title="Delete Package"
              >
                <FaTrash size={11} />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ZipPackagesTable;
