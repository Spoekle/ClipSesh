'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FaDiscord, FaSearch, FaStop } from 'react-icons/fa';
import { Button } from '@/components/Button';

interface ScraperChannelScannerProps {
  channelId: string;
  setChannelId: (val: string) => void;
  isScanning: boolean;
  scanProgress: {
    scannedMessages: number;
    foundClipsCount: number;
  };
  configuredChannels: string[];
  onStartScan: () => void;
  onCancelScan: () => void;
}

export const ScraperChannelScanner: React.FC<ScraperChannelScannerProps> = ({
  channelId,
  setChannelId,
  isScanning,
  scanProgress,
  configuredChannels,
  onStartScan,
  onCancelScan,
}) => {
  return (
    <div className="bg-cc-card p-5 sm:p-6 rounded-xl border border-border shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#5865F2]/15 text-[#5865F2] border border-[#5865F2]/25 flex items-center justify-center shrink-0">
            <FaDiscord size={20} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Discord Channel Scraper & Ingestion</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Scrape historical clip links from Discord channels, preview by season/timestamp, and import into seasonal storage
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="Enter Discord Channel ID"
              disabled={isScanning}
              className="w-full bg-cc-ground border border-border focus:border-primary rounded-xl px-4 py-2.5 text-xs text-white placeholder-muted-foreground/60 font-mono transition-colors outline-none"
            />
          </div>

          {isScanning ? (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="primary"
                size="md"
                isLoading
                disabled
              >
                Scanning Channel...
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={onCancelScan}
                leftIcon={<FaStop size={10} />}
                title="Cancel channel scan"
              >
                Cancel Scan
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={onStartScan}
              disabled={!channelId.trim()}
              leftIcon={<FaSearch size={12} />}
            >
              Scan Channel Clips
            </Button>
          )}
        </div>

        {configuredChannels.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="text-[11px] text-muted-foreground font-medium">Configured Ingest Channels:</span>
            {configuredChannels.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setChannelId(id)}
                disabled={isScanning}
                className={`text-[11px] font-mono px-2.5 py-0.5 rounded-sm border transition-colors cursor-pointer ${
                  channelId.trim() === id
                    ? 'bg-[#5865F2]/20 text-[#5865F2] border-[#5865F2]/40 font-semibold'
                    : 'bg-cc-ground text-muted-foreground border-border hover:text-white hover:border-border/80'
                }`}
              >
                {id}
              </button>
            ))}
          </div>
        )}
      </div>

      {isScanning && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 p-4 rounded-xl bg-cc-ground border border-border flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
            <div>
              <span className="text-xs font-semibold text-white block">
                Scraping Discord Channel Message History...
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                Scanned {scanProgress.scannedMessages.toLocaleString()} messages • Discovered{' '}
                <strong className="text-white">{scanProgress.foundClipsCount}</strong> valid clips
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="hidden sm:inline text-[11px] px-2 py-0.5 rounded-full bg-cc-card text-muted-foreground border border-border">
              Respecting Discord Rate Limits
            </span>
            <button
              type="button"
              onClick={onCancelScan}
              className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FaStop size={10} />
              <span>Cancel Scan</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ScraperChannelScanner;
