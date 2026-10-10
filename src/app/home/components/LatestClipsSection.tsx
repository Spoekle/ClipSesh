'use client';

import React from 'react';
import Link from 'next/link';
import { FaFire, FaArrowRight, FaEye, FaThumbsUp } from 'react-icons/fa';
import { IoChatbubbleEllipsesOutline } from 'react-icons/io5';
import { format } from 'timeago.js';
import { Clip } from '@/types/adminTypes';

interface LatestClipsSectionProps {
  latestClips: Clip[];
  loadingClips: boolean;
}

export const LatestClipsSection: React.FC<LatestClipsSectionProps> = ({
  latestClips,
  loadingClips,
}) => {
  return (
    <section className="py-12 border-t border-border bg-cc-ground">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <FaFire size={13} />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-cc-text">
                Latest Highlights
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              The latest Beat Saber clips submitted by the community
            </p>
          </div>

          <Link
            href="/clips"
            className="text-xs font-semibold text-muted-foreground hover:text-cc-text flex items-center gap-1 transition-colors self-start sm:self-auto"
          >
            <span>View all clips</span>
            <FaArrowRight size={10} />
          </Link>
        </div>

        {loadingClips ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-cc-card rounded-xl border border-border overflow-hidden animate-pulse"
              >
                <div className="aspect-video bg-border/40" />
                <div className="p-3.5 space-y-2">
                  <div className="h-4 bg-border/40 rounded w-3/4" />
                  <div className="h-3 bg-border/40 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : latestClips.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {latestClips.map((clip) => {
              return (
                <Link
                  key={clip._id}
                  href={`/clips/${clip._id}`}
                  className="flex flex-col h-full bg-cc-card hover:bg-border/30 rounded-xl overflow-hidden border border-border hover:border-muted-foreground/30 transition-all duration-200 group cursor-pointer shadow-sm select-none"
                >
                  <div className="relative aspect-video bg-cc-ground overflow-hidden">
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

                    <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-md text-cc-text border border-white/10 text-[10px] px-2 py-0.5 rounded-full font-medium">
                      {clip.streamer}
                    </div>

                    {(clip.comments?.length ?? 0) > 0 && (
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-neutral-300 border border-white/10">
                        <IoChatbubbleEllipsesOutline size={11} />
                        <span>{clip.comments?.length}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="text-xs font-semibold text-cc-text group-hover:text-white line-clamp-2 leading-tight transition-colors">
                        {clip.title}
                      </h3>
                      <div className="text-[11px] text-muted-foreground mt-1 truncate">
                        {clip.streamer}
                      </div>
                    </div>

                    <div className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-neutral-300 font-medium">
                        <FaEye size={10} className="text-neutral-500" />
                        <span>{clip.views || 0}</span>
                      </span>
                      <span className="text-neutral-600">•</span>
                      <span className="flex items-center gap-1 text-neutral-300 font-medium">
                        <FaThumbsUp size={9} className="text-neutral-500" />
                        <span>{clip.upvotes}</span>
                      </span>
                      <span className="text-neutral-600">•</span>
                      <span>{format(new Date(clip.createdAt))}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 bg-cc-card rounded-xl border border-border">
            <p className="text-xs text-muted-foreground">No clips available currently.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default LatestClipsSection;
