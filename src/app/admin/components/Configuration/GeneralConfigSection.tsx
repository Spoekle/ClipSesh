'use client';

import React from 'react';
import { FaDiscord, FaCheck } from 'react-icons/fa';
import { Button } from '@/components/common/Button';

interface GeneralConfigSectionProps {
  denyThreshold: number;
  setDenyThreshold: (threshold: number) => void;
  latestVideoLink: string;
  setLatestVideoLink: (link: string) => void;
  channelIdsText: string;
  onChannelIdsChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onOpenScraper?: (channelId?: string) => void;
  isSubmitting?: boolean;
}

export const GeneralConfigSection: React.FC<GeneralConfigSectionProps> = ({
  denyThreshold,
  setDenyThreshold,
  latestVideoLink,
  setLatestVideoLink,
  channelIdsText,
  onChannelIdsChange,
  onOpenScraper,
  isSubmitting = false,
}) => {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-cc-ground border border-border p-4 rounded-xl">
          <label
            htmlFor="denyThreshold"
            className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5"
          >
            Deny Threshold
          </label>
          <input
            type="number"
            id="denyThreshold"
            name="denyThreshold"
            value={denyThreshold}
            onChange={(e) => setDenyThreshold(parseInt(e.target.value, 10) || 5)}
            className="w-full bg-cc-card border border-border rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-border/80"
            required
            min="1"
          />
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Number of deny votes needed to automatically reject a clip
          </p>
        </div>

        <div className="bg-cc-ground border border-border p-4 rounded-xl">
          <label
            htmlFor="latestVideoLink"
            className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5"
          >
            Latest Video Link
          </label>
          <input
            type="text"
            id="latestVideoLink"
            name="latestVideoLink"
            value={latestVideoLink}
            onChange={(e) => setLatestVideoLink(e.target.value)}
            className="w-full bg-cc-card border border-border rounded-xl px-3.5 py-2 text-xs text-white placeholder-muted-foreground focus:outline-none focus:border-border/80"
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            YouTube episode URL featured on the public home page
          </p>
        </div>
      </div>

      <div className="bg-cc-ground border border-border p-4 rounded-xl">
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="clipChannelIds"
            className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            Discord Ingest Channel IDs
          </label>
          {onOpenScraper && (
            <button
              type="button"
              onClick={() => {
                const firstId = channelIdsText
                  .split('\n')
                  .map((s) => s.trim())
                  .find(Boolean);
                onOpenScraper(firstId);
              }}
              className="text-[11px] font-semibold text-[#5865F2] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FaDiscord size={12} />
              <span>Open Channel Scraper</span>
            </button>
          )}
        </div>
        <textarea
          id="clipChannelIds"
          value={channelIdsText}
          onChange={onChannelIdsChange}
          className="w-full bg-cc-card border border-border text-white font-mono rounded-xl p-3 text-xs focus:outline-none focus:border-border/80 h-24 resize-none"
          placeholder="123456789012345678&#10;234567890123456789"
        />
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          List of Discord channel IDs monitored by the bot for incoming submissions (one ID per line)
        </p>
      </div>

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          fullWidth
          isLoading={isSubmitting}
          leftIcon={<FaCheck size={12} />}
        >
          Update System Settings
        </Button>
      </div>
    </div>
  );
};

export default GeneralConfigSection;
