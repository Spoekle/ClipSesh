'use client';

import React from 'react';

interface VideoFileInputProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  fileUploadProgress: number;
}

export const VideoFileInput: React.FC<VideoFileInputProps> = ({
  fileInputRef,
  onFileChange,
  uploading,
  fileUploadProgress,
}) => {
  return (
    <div>
      <label className="block mb-2 text-sm font-medium text-white/90">Video File *</label>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        className="w-full px-3.5 py-2.5 bg-cc-ground border border-border focus:border-border/80 rounded-xl text-xs sm:text-sm text-white file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/15 file:text-primary hover:file:bg-primary/25 file:transition-colors cursor-pointer"
        accept="video/*"
        disabled={uploading}
        required
      />
      <p className="mt-1.5 text-xs text-muted-foreground">
        Max size: 100MB. Supported formats: MP4, WebM, MOV
      </p>

      {uploading && fileUploadProgress > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1 font-mono">
            <span>Uploading...</span>
            <span>{fileUploadProgress}%</span>
          </div>
          <div className="w-full bg-cc-ground h-1.5 rounded-full overflow-hidden border border-border">
            <div
              className="bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${fileUploadProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoFileInput;
