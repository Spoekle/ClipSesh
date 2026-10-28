'use client';

import React from 'react';
import Link from 'next/link';
import { Flame, ArrowRight, Eye, ThumbsUp, MessageSquare } from 'lucide-react';
import { format } from 'timeago.js';
import { Clip } from '@/types/adminTypes';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LatestClipsSectionProps {
  latestClips: Clip[];
  loadingClips: boolean;
}

export const LatestClipsSection: React.FC<LatestClipsSectionProps> = ({
  latestClips,
  loadingClips,
}) => {
  return (
    <section className="py-12 border-t border-border bg-background">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <Flame className="size-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                Latest Highlights
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              The latest Beat Saber clips submitted by the community
            </p>
          </div>

          <Link
            href="/clips"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <span>View all clips</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {loadingClips ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-8">
            {[...Array(4)].map((_, i) => (
              <Card
                key={i}
                className="rounded-xl border border-border overflow-hidden animate-pulse bg-card p-0"
              >
                <div className="aspect-video bg-secondary/50" />
                <div className="p-3.5 space-y-2">
                  <div className="h-4 bg-secondary/60 rounded w-3/4" />
                  <div className="h-3 bg-secondary/40 rounded w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : latestClips.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {latestClips.map((clip) => {
              return (
                <Link
                  key={clip._id}
                  href={`/clips/${clip._id}`}
                  className="group flex flex-col h-full focus:outline-none"
                >
                  <Card className="flex flex-col h-full bg-card hover:bg-secondary/40 rounded-xl overflow-hidden border border-border hover:border-muted-foreground/30 transition-all duration-200 cursor-pointer shadow-xs select-none p-0">
                    <div className="relative aspect-video bg-background overflow-hidden">
                      <img
                        src={clip.thumbnail}
                        alt={clip.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                      <div className="absolute top-2 left-2">
                        <Badge
                          variant="secondary"
                          className="bg-black/75 backdrop-blur-md text-foreground border border-white/10 text-[10px] px-2 py-0.5 rounded-full font-medium"
                        >
                          {clip.streamer}
                        </Badge>
                      </div>

                      {(clip.comments?.length ?? 0) > 0 && (
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-neutral-300 border border-white/10">
                          <MessageSquare className="size-3" />
                          <span>{clip.comments?.length}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 flex flex-col justify-between flex-1">
                      <div>
                        <h3 className="text-xs font-semibold text-foreground group-hover:text-primary line-clamp-2 leading-tight transition-colors">
                          {clip.title}
                        </h3>
                        <div className="text-[11px] text-muted-foreground mt-1 truncate">
                          {clip.streamer}
                        </div>
                      </div>

                      <div className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="flex items-center gap-1 text-neutral-300 font-medium">
                          <Eye className="size-3 text-muted-foreground" />
                          <span>{clip.views || 0}</span>
                        </span>
                        <span className="text-neutral-600">•</span>
                        <span className="flex items-center gap-1 text-neutral-300 font-medium">
                          <ThumbsUp className="size-3 text-muted-foreground" />
                          <span>{clip.upvotes}</span>
                        </span>
                        <span className="text-neutral-600">•</span>
                        <span>{format(new Date(clip.createdAt))}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-10 bg-card rounded-xl border border-border">
            <p className="text-xs text-muted-foreground">No clips available currently.</p>
          </Card>
        )}
      </div>
    </section>
  );
};

export default LatestClipsSection;
