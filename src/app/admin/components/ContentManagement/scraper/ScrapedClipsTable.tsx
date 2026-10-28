'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Filter,
  ExternalLink,
  Video,
  Folder,
  User,
  Loader2,
} from 'lucide-react';
import { FaYoutube, FaTwitch } from 'react-icons/fa';
import { ScrapedClipItem, ChannelScanStatusResponse } from '@/services/adminService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ScrapedClipsTableProps {
  scanResult: ChannelScanStatusResponse;
  filteredClips: ScrapedClipItem[];
  selectedIds: Set<string>;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  originFilter: string;
  setOriginFilter: (val: string) => void;
  seasonFilter: string;
  setSeasonFilter: (val: string) => void;
  onlyNewFilter: boolean;
  setOnlyNewFilter: (val: boolean) => void;
  onToggleSelect: (id: string) => void;
  onSelectAllNew: () => void;
  onSelectAllFiltered: () => void;
  onDeselectAll: () => void;
  onProceedDownload: () => void;
  isStartingDownload: boolean;
  concurrency?: number;
  setConcurrency?: (val: number) => void;
}

export const ScrapedClipsTable: React.FC<ScrapedClipsTableProps> = ({
  scanResult,
  filteredClips,
  selectedIds,
  searchQuery,
  setSearchQuery,
  originFilter,
  setOriginFilter,
  seasonFilter,
  setSeasonFilter,
  onlyNewFilter,
  setOnlyNewFilter,
  onToggleSelect,
  onSelectAllNew,
  onSelectAllFiltered,
  onDeselectAll,
  onProceedDownload,
  isStartingDownload,
  concurrency,
  setConcurrency,
}) => {
  const getOriginBadge = (origin: string) => {
    switch (origin) {
      case 'youtube':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-red-500/15 text-red-400 border border-red-500/25 text-[11px] font-semibold">
            <FaYoutube size={11} />
            <span>YouTube</span>
          </span>
        );
      case 'twitch':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-purple-500/15 text-purple-400 border border-purple-500/25 text-[11px] font-semibold">
            <FaTwitch size={11} />
            <span>Twitch</span>
          </span>
        );
      case 'medal':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-amber-500/15 text-amber-400 border border-amber-500/25 text-[11px] font-semibold">
            <span className="font-bold">M</span>
            <span>Medal</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-sky-500/15 text-sky-400 border border-sky-500/25 text-[11px] font-semibold">
            <Video className="size-3" />
            <span>Direct</span>
          </span>
        );
    }
  };

  const isAllFilteredSelected =
    filteredClips.length > 0 && filteredClips.every((c) => selectedIds.has(c.id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-cc-card p-3.5 rounded-xl border border-border">
          <span className="text-[11px] text-muted-foreground block">Total Discovered</span>
          <span className="text-base font-bold text-white font-mono">
            {scanResult.stats?.totalClips ?? scanResult.clips?.length ?? 0}
          </span>
        </div>

        <div className="bg-cc-card p-3.5 rounded-xl border border-border">
          <span className="text-[11px] text-muted-foreground block">New (Ready to Ingest)</span>
          <span className="text-base font-bold text-emerald-400 font-mono">
            {scanResult.stats?.newClips ?? 0}
          </span>
        </div>

        <div className="bg-cc-card p-3.5 rounded-xl border border-border">
          <span className="text-[11px] text-muted-foreground block">Already in Database</span>
          <span className="text-base font-bold text-muted-foreground font-mono">
            {scanResult.stats?.existingClips ?? 0}
          </span>
        </div>

        <div className="bg-cc-card p-3.5 rounded-xl border border-border">
          <span className="text-[11px] text-muted-foreground block">Selected to Ingest</span>
          <span className="text-base font-bold text-primary font-mono">
            {selectedIds.size}
          </span>
        </div>
      </div>

      {/* Filter & Action Toolbar */}
      <div className="bg-cc-card p-4 rounded-xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Bar */}
          <div className="relative">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title, author, url..."
              className="bg-cc-ground border-border text-xs text-white placeholder-muted-foreground/60 w-48 sm:w-60"
            />
          </div>

          {/* Origin Dropdown */}
          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="bg-cc-ground border border-border text-xs text-white rounded-lg px-2.5 py-1.5 outline-none cursor-pointer h-8"
          >
            <option value="all">All Origins</option>
            <option value="twitch">Twitch ({scanResult.stats?.origins.twitch ?? 0})</option>
            <option value="youtube">YouTube ({scanResult.stats?.origins.youtube ?? 0})</option>
            <option value="medal">Medal.tv ({scanResult.stats?.origins.medal ?? 0})</option>
            <option value="direct_video">Direct Videos ({scanResult.stats?.origins.direct_video ?? 0})</option>
          </select>

          {/* Season Dropdown */}
          {scanResult.stats?.seasons && Object.keys(scanResult.stats.seasons).length > 0 && (
            <select
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              className="bg-cc-ground border border-border text-xs text-white rounded-lg px-2.5 py-1.5 outline-none cursor-pointer h-8"
            >
              <option value="all">All Seasons</option>
              {Object.entries(scanResult.stats.seasons).map(([sKey, count]) => (
                <option key={sKey} value={sKey}>
                  {sKey} ({count})
                </option>
              ))}
            </select>
          )}

          {/* Toggle Only New */}
          <button
            type="button"
            onClick={() => setOnlyNewFilter(!onlyNewFilter)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 h-8 ${
              onlyNewFilter
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold'
                : 'bg-cc-ground text-muted-foreground border-border hover:text-white'
            }`}
          >
            <Filter className="size-3" />
            <span>Only New</span>
          </button>
        </div>

        {/* Bulk Selection and Ingest Button */}
        <div className="flex flex-wrap items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="xs"
            onClick={onSelectAllNew}
          >
            Select New
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={onSelectAllFiltered}
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={onDeselectAll}
          >
            Deselect All
          </Button>

          {concurrency !== undefined && setConcurrency && (
            <div className="flex items-center gap-1.5 bg-cc-ground border border-border rounded-lg px-2.5 py-1 text-xs">
              <span className="text-muted-foreground whitespace-nowrap text-[11px]">Tasks:</span>
              <select
                value={concurrency}
                onChange={(e) => setConcurrency(Number(e.target.value))}
                className="bg-transparent text-white font-medium outline-none cursor-pointer text-xs"
                title="Number of clips to download and process concurrently"
              >
                <option value={1} className="bg-cc-card text-white">1 (Sequential)</option>
                <option value={2} className="bg-cc-card text-white">2 at once</option>
                <option value={3} className="bg-cc-card text-white">3 at once (Fast)</option>
                <option value={5} className="bg-cc-card text-white">5 at once (Turbo)</option>
              </select>
            </div>
          )}

          <Button
            variant="default"
            size="sm"
            onClick={onProceedDownload}
            disabled={selectedIds.size === 0 || isStartingDownload}
            className="gap-1.5 bg-primary text-white hover:bg-primary/90 font-semibold ml-1"
          >
            {isStartingDownload ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Proceed Downloading ({selectedIds.size})</span>
              </>
            ) : (
              <>
                <Download className="size-3.5" />
                <span>Proceed Downloading ({selectedIds.size})</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Clips List / Table */}
      <div className="bg-cc-card rounded-xl border border-border overflow-hidden shadow-xs">
        <div className="p-3 border-b border-border bg-cc-ground flex items-center justify-between text-xs text-muted-foreground font-semibold">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isAllFilteredSelected}
              onChange={(e) => {
                if (e.target.checked) onSelectAllFiltered();
                else onDeselectAll();
              }}
              className="rounded-xs cursor-pointer accent-primary"
            />
            <span>CLIP / TITLE</span>
          </div>
          <div className="hidden md:flex items-center gap-12 mr-2">
            <span>SUBMITTER</span>
            <span>TIMESTAMP & SEASON</span>
            <span>DESTINATION</span>
            <span>STATUS</span>
          </div>
        </div>

        {filteredClips.length === 0 ? (
          <div className="text-center py-12 text-xs text-muted-foreground">
            No clips match the selected filters.
          </div>
        ) : (
          <div className="divide-y divide-border/60 max-h-[550px] overflow-y-auto">
            {filteredClips.map((clip) => {
              const isSelected = selectedIds.has(clip.id);
              const clipDate = new Date(clip.timestamp);

              return (
                <div
                  key={clip.id}
                  onClick={() => onToggleSelect(clip.id)}
                  className={`p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-white/5 transition-colors cursor-pointer select-none ${
                    isSelected ? 'bg-primary/10' : ''
                  }`}
                >
                  {/* Left: Checkbox, Origin Badge, Title, Link */}
                  <div className="flex items-start gap-3 min-w-0 md:max-w-md lg:max-w-lg">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 rounded-xs cursor-pointer accent-primary shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {getOriginBadge(clip.origin)}
                        <a
                          href={clip.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-semibold text-white hover:text-primary transition-colors truncate max-w-sm inline-flex items-center gap-1.5"
                          title={clip.link}
                        >
                          <span>{clip.title}</span>
                          <ExternalLink className="size-2.5 shrink-0 text-muted-foreground" />
                        </a>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono block truncate max-w-xs sm:max-w-md">
                        {clip.link}
                      </span>
                    </div>
                  </div>

                  {/* Right metadata columns */}
                  <div className="flex flex-wrap md:flex-nowrap items-center gap-4 text-xs shrink-0">
                    {/* Author */}
                    <div className="w-28 truncate text-muted-foreground flex items-center gap-1.5">
                      <User className="size-3 text-muted-foreground/60 shrink-0" />
                      <span className="truncate">{clip.author}</span>
                    </div>

                    {/* Timestamp & Season */}
                    <div className="w-40">
                      <span className="text-white font-medium block text-[11px]">
                        {clip.season} {clip.year}
                      </span>
                      <span className="text-muted-foreground text-[10px] block font-mono">
                        {clipDate.toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        {clipDate.toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Destination */}
                    <div className="w-44 hidden lg:block">
                      <span className="text-muted-foreground text-[10px] font-mono truncate block flex items-center gap-1">
                        <Folder className="size-3 text-muted-foreground/60 shrink-0" />
                        <span className="truncate">{clip.destinationFolder}</span>
                      </span>
                    </div>

                    {/* Status badge */}
                    <div className="w-24 text-right">
                      {clip.alreadyExists ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-sm bg-white/5 text-muted-foreground border border-border">
                          In Database
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                          New Clip
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ScrapedClipsTable;
