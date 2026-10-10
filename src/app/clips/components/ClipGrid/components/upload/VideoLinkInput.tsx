'use client';

import React from 'react';
import { FaSpinner, FaInfoCircle } from 'react-icons/fa';

interface VideoInfo {
  title: string;
  author: string;
  platform: string;
}

interface VideoLinkInputProps {
  link: string;
  onLinkChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fetchingInfo: boolean;
  uploading: boolean;
  videoInfo: VideoInfo | null;
}

export const VideoLinkInput: React.FC<VideoLinkInputProps> = ({
  link,
  onLinkChange,
  fetchingInfo,
  uploading,
  videoInfo,
}) => {
  return (
    <div>
      <label className="block mb-2 text-sm font-medium text-white/90">
        Video Link *
      </label>
      <div className="relative">
        <input
          type="url"
          value={link}
          onChange={onLinkChange}
          className="w-full px-3.5 py-2.5 bg-cc-ground border border-border focus:border-border/80 rounded-xl text-xs sm:text-sm text-white placeholder-muted-foreground focus:outline-none transition-colors"
          placeholder="YouTube, Twitch, or other video platform URL"
          disabled={uploading}
          required
        />
        {fetchingInfo && (
          <div className="absolute right-3.5 top-3">
            <FaSpinner className="animate-spin text-primary" />
          </div>
        )}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        Supported: YouTube videos, basic info for Twitch/Medal.tv/Kick/TikTok, and direct video links (.mp4, .webm, .mov). Note: Only YouTube and direct video files can be downloaded automatically.
      </p>

      {videoInfo && (
        <div className="mt-2.5 p-3 bg-cc-ground border border-border rounded-xl text-xs text-white">
          <div className="flex items-start mb-2">
            <FaInfoCircle className="text-primary mr-2 mt-0.5 shrink-0" size={13} />
            <div>
              <p className="font-semibold text-white">Video Information Retrieved:</p>
              <p className="mt-1">
                <span className="text-muted-foreground">Title:</span> {videoInfo.title}
              </p>
              <p>
                <span className="text-muted-foreground">Creator:</span> {videoInfo.author}
              </p>
              <p>
                <span className="text-muted-foreground">Platform:</span> {videoInfo.platform}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoLinkInput;
