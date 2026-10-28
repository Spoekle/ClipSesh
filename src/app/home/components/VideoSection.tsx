'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Play, Film } from 'lucide-react';
import { FaYoutube } from 'react-icons/fa';
import { Card } from '@/components/ui/card';

interface VideoSectionProps {
  showVideo: boolean;
  setShowVideo: (show: boolean) => void;
  embedUrl: string | null;
  thumbnailUrl: string | null;
}

export const VideoSection: React.FC<VideoSectionProps> = ({
  showVideo,
  setShowVideo,
  embedUrl,
  thumbnailUrl,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="lg:col-span-5"
    >
      <Card className="rounded-xl border-border shadow-xl p-2.5 overflow-hidden bg-card">
        <div className="relative aspect-video rounded-lg overflow-hidden bg-background flex items-center justify-center">
          {showVideo && embedUrl ? (
            <iframe
              className="w-full h-full"
              src={embedUrl}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Latest Highlight Video"
            />
          ) : (
            <div
              className="w-full h-full bg-cover bg-center relative group cursor-pointer"
              style={{ backgroundImage: `url(${thumbnailUrl})` }}
              onClick={() => setShowVideo(true)}
            >
              <div className="absolute inset-0 bg-black/45 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <div className="w-13 h-13 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
                  <Play className="size-5 fill-current ml-0.5" />
                </div>
              </div>
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs text-foreground bg-black/80 backdrop-blur-xs px-3 py-1.5 rounded-md border border-white/10">
                <span className="font-semibold flex items-center gap-1.5">
                  <Film className="size-3.5 text-primary" /> Latest Highlights Video
                </span>
                <span className="text-neutral-300 text-[11px]">Click to play</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-3.5 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Official Season Highlights Video
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Curated from the highest-rated community clips
            </p>
          </div>
          <a
            href="https://www.youtube.com/@CubeCommunity"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-background hover:bg-secondary text-foreground text-xs px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1.5 shrink-0 border border-border"
          >
            <FaYoutube size={13} className="text-primary" />
            <span>Subscribe</span>
          </a>
        </div>
      </Card>
    </motion.div>
  );
};

export default VideoSection;
