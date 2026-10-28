'use client';

import React from 'react';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Clip } from '@/types/adminTypes';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ClipQueueSidebarProps {
  nextClip: Clip | null;
  prevClip: Clip | null;
  onNavigate: (clipId: string) => void;
  isLoading: boolean;
}

export const ClipQueueSidebar: React.FC<ClipQueueSidebarProps> = ({
  nextClip,
  prevClip,
  onNavigate,
  isLoading,
}) => {
  return (
    <Card className="p-4 flex flex-col gap-3 shadow-sm bg-card border-border">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <h3 className="text-xs font-bold uppercase tracking-wider text-card-foreground">
          Queue
        </h3>
        <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
          <span>Navigate with</span>
          <kbd className="inline-flex items-center justify-center px-1 py-0.5 text-[9px] bg-background rounded border border-border">
            <ChevronLeft className="size-2.5" />
          </kbd>
          <kbd className="inline-flex items-center justify-center px-1 py-0.5 text-[9px] bg-background rounded border border-border">
            <ChevronRight className="size-2.5" />
          </kbd>
        </span>
      </div>

      {nextClip ? (
        <div
          onClick={() => !isLoading && onNavigate(nextClip._id)}
          className="group flex gap-3 p-2 rounded-xl bg-background/60 hover:bg-secondary/40 border border-border/80 transition-all cursor-pointer"
        >
          <div className="relative w-28 aspect-video rounded-lg overflow-hidden bg-black shrink-0">
            <img
              src={nextClip.thumbnail}
              alt={nextClip.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="size-3 text-white fill-white ml-0.5" />
            </div>
            <Badge className="absolute top-1 left-1 text-[9px] font-bold px-1 py-0 h-4 rounded">
              NEXT
            </Badge>
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
            <div>
              <h4 className="text-xs font-semibold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                {nextClip.title}
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {nextClip.streamer}
              </p>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span>{nextClip.views || 0} views</span>
              <span>•</span>
              <span className="text-primary font-medium">{nextClip.upvotes} likes</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 text-center text-xs text-muted-foreground bg-background/40 rounded-xl border border-dashed border-border">
          End of playlist
        </div>
      )}

      {prevClip && (
        <div
          onClick={() => !isLoading && onNavigate(prevClip._id)}
          className="group flex items-center justify-between p-2.5 rounded-xl bg-background/40 hover:bg-secondary/30 border border-border/60 transition-all cursor-pointer text-xs"
        >
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <ChevronLeft className="size-3 text-muted-foreground shrink-0" />
            <div className="truncate">
              <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">
                Previous
              </span>
              <span className="text-foreground truncate block group-hover:text-white transition-colors">
                {prevClip.title}
              </span>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {prevClip.streamer}
          </span>
        </div>
      )}
    </Card>
  );
};

export default ClipQueueSidebar;
