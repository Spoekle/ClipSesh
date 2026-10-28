'use client';

import React from 'react';
import { Archive, Ban } from 'lucide-react';
import { FaDiscord } from 'react-icons/fa';
import SeasonArchiveManager from './SeasonArchiveManager';
import DeniedClips from './DeniedClips';
import DiscordScraper from './DiscordScraper';
import { Clip, Rating, Zip } from '@/types/adminTypes';
import { Badge } from '@/components/ui/badge';

export type ContentSubTab = 'pipeline' | 'denied' | 'scraper';

interface ContentTabProps {
  activeContentSubTab: ContentSubTab;
  setActiveContentSubTab: (subTab: ContentSubTab) => void;
  zips: Zip[];
  clips: Clip[];
  ratings: Record<string, Rating>;
  config: {
    denyThreshold: number;
    clipChannelIds?: string[];
    [key: string]: unknown;
  };
  seasonInfo: { season: string; year: number; clipAmount: number };
  downloading: boolean;
  loading: boolean;
  zipsLoading: boolean;
  deleteZip: (zipId: string) => Promise<void>;
  openProcessModal: () => Promise<void>;
  selectedScraperChannel: string;
  deniedClipsCount: number;
}

export const ContentTab: React.FC<ContentTabProps> = ({
  activeContentSubTab,
  setActiveContentSubTab,
  zips,
  clips,
  ratings,
  config,
  seasonInfo,
  downloading,
  loading,
  zipsLoading,
  deleteZip,
  openProcessModal,
  selectedScraperChannel,
  deniedClipsCount,
}) => {
  return (
    <div className="space-y-6">
      {/* Content Sub-Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-card border border-border rounded-xl">
          <button
            type="button"
            onClick={() => setActiveContentSubTab('pipeline')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeContentSubTab === 'pipeline'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <Archive className="size-3.5" />
            <span>Processing & Archives</span>
            {zips.length > 0 && (
              <Badge
                variant={activeContentSubTab === 'pipeline' ? 'secondary' : 'outline'}
                className="text-[10px] px-1.5 py-0 h-4 font-mono"
              >
                {zips.length}
              </Badge>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveContentSubTab('denied')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeContentSubTab === 'denied'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <Ban className="size-3.5" />
            <span>Denied Submissions</span>
            {deniedClipsCount > 0 && (
              <Badge
                variant="destructive"
                className="text-[10px] px-1.5 py-0 h-4 font-mono font-semibold"
              >
                {deniedClipsCount}
              </Badge>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveContentSubTab('scraper')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeContentSubTab === 'scraper'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <FaDiscord
              size={13}
              className={activeContentSubTab === 'scraper' ? 'text-primary-foreground' : 'text-[#5865F2]'}
            />
            <span>Discord Scraper</span>
            {config.clipChannelIds && config.clipChannelIds.length > 0 && (
              <Badge
                variant={activeContentSubTab === 'scraper' ? 'secondary' : 'outline'}
                className="text-[10px] px-1.5 py-0 h-4 font-mono"
              >
                {config.clipChannelIds.length}
              </Badge>
            )}
          </button>
        </div>
      </div>

      {/* Sub-tab content */}
      {activeContentSubTab === 'pipeline' && (
        <SeasonArchiveManager
          openProcessModal={openProcessModal}
          downloading={downloading}
          loading={loading}
          zips={zips}
          zipsLoading={zipsLoading}
          deleteZip={deleteZip}
          seasonInfo={seasonInfo}
          activeClipsCount={clips.filter((c) => !c.archived).length}
        />
      )}

      {activeContentSubTab === 'denied' && (
        <DeniedClips
          clips={clips}
          ratings={ratings}
          config={config}
        />
      )}

      {activeContentSubTab === 'scraper' && (
        <DiscordScraper
          configuredChannels={config.clipChannelIds}
          initialChannelId={selectedScraperChannel}
        />
      )}
    </div>
  );
};

export default ContentTab;
